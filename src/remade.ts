interface Bag<Msg> {
    readonly commands: Array<Cmd<Msg>>;
    readonly subscriptions: Array<Sub<Msg>>;
}

abstract class Effect<Msg> {
    protected static collect<Msg>(
        effect: Effect<Msg>,
        managers: Array<Manager<Msg>>,
        bags: {[ key: number ]: Bag<Msg> }
    ): void {
        return effect.collect(managers, bags);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    protected abstract collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void;
}

abstract class Collector<Msg> extends Effect<Msg> {
    public static collect<Msg>(
        effect: Effect<Msg>,
        managers: Array<Manager<Msg>>,
        bags: {[ key: number ]: Bag<Msg> }
    ): void {
        return super.collect(effect, managers, bags);
    }
}

const none = new class None<Msg> extends Effect<Msg> {
    public map<R>(): Effect<R> {
        return this;
    }

    protected collect(): void {
        // do nothing
    }
}<never>();

class Batch<Msg> extends Effect<Msg> {
    public static of<Msg>(effects: Array<Effect<Msg>>): Effect<Msg> {
        const notNone: Array<Effect<Msg>> = [];

        for (const effect of effects) {
            // none is a singleton
            if (effect !== none) {
                notNone.push(effect);
            }
        }

        switch (notNone.length) {
            case 0: return none;
            case 1: return notNone[ 0 ];
            default: return new Batch(notNone);
        }
    }

    private constructor(private readonly effects: Array<Effect<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Effect<R> {
        const result: Array<Effect<R>> = new Array(this.effects.length);

        for (let i = 0; i < this.effects.length; i++) {
            result[ i ] = this.effects[ i ].map(fn);
        }

        return new Batch(result);
    }

    protected collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void {
        for (const effect of this.effects) {
            Collector.collect(effect, managers, bags);
        }
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    public static none = none as unknown as Cmd<never>;

    public static batch = Batch.of as unknown as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;

    protected abstract readonly manager: Manager<Msg>;

    public abstract map<R>(fn: (msg: Msg) => R): Cmd<R>;

    protected collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void {
        const bag = bags[ this.manager.id ];

        if (typeof bag === 'undefined') {
            managers.push(this.manager);
            bags[ this.manager.id ] = {
                commands: [ this ],
                subscriptions: []
            };
        } else {
            bag.commands.push(this);
        }
    }
}

export abstract class Sub<Msg> extends Effect<Msg> {
    public static none = none as unknown as Sub<never>;

    public static batch = Batch.of as unknown as <Msg>(cmds: Array<Sub<Msg>>) => Sub<Msg>;

    protected abstract readonly manager: Manager<Msg>;

    public abstract map<R>(fn: (msg: Msg) => R): Sub<R>;

    protected collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void {
        const bag = bags[ this.manager.id ];

        if (typeof bag === 'undefined') {
            managers.push(this.manager);
            bags[ this.manager.id ] = {
                commands: [],
                subscriptions: [ this ]
            };
        } else {
            bag.subscriptions.push(this);
        }
    }
}

/**
 * M A N A G E R
 */

export class Manager<AppMsg, SelfMsg = unknown, State = unknown> {
    public static register<AppMsg, SelfMsg, State>({ init, onEffects, onSelfMsg }: {
        init: Task<never, State>;
        onEffects(
            router: Router<AppMsg, SelfMsg>,
            commands: Array<Cmd<AppMsg>>,
            subscriptions: Array<Sub<AppMsg>>,
            state: State
        ): Task<never, State>;
        onSelfMsg(
            router: Router<AppMsg, SelfMsg>,
            selfMsg: SelfMsg,
            state: State
        ): Task<never, State>;
    }): Manager<AppMsg, SelfMsg, State> {
        return new Manager(Manager.NEXT++, init, onEffects, onSelfMsg);
    }

    private static NEXT = 0;

    private constructor(
        public readonly id: number,
        public readonly init: Task<never, State>,
        public readonly onEffects: (
            router: Router<AppMsg, SelfMsg>,
            commands: Array<Cmd<AppMsg>>,
            subscriptions: Array<Sub<AppMsg>>,
            state: State
        ) => Task<never, State>,
        public readonly onSelfMsg: (
            router: Router<AppMsg, SelfMsg>,
            selfMsg: SelfMsg,
            state: State
        ) => Task<never, State>
    ) {}
}

/**
 * R O U T E R
 */

export interface Router<AppMsg, SelfMsg> {
    sendToApp(many: Array<AppMsg>): Task<never, null>;

    sendToSelf(msg: SelfMsg): Task<never, null>;
}

class RouterImpl<AppMsg, SelfMsg> implements Router<AppMsg, SelfMsg> {
    public sendToApp(many: Array<AppMsg>): Task<never, null> {}

    public sendToSelf(msg: SelfMsg): Task<never, null> {}
}

/**
 * R U N T I M E
 */

class Process<AppMsg, SelfMsg, State> {
    public constructor(
        private readonly root: Promise<State>,
        private readonly router: Router<AppMsg, SelfMsg>,
        private readonly manager: Manager<AppMsg, SelfMsg, State>
    ) {}

    public send(bag: Bag<AppMsg>): Process<AppMsg, SelfMsg, State> {
        return new Process(
            this.root.then((state: State): Promise<State> => Promisify.toPromise(
                this.manager.onEffects(this.router, bag.commands, bag.subscriptions, state)
            )),
            this.router,
            this.manager
        );
    }
}

class Runtime<AppMsg, SelfMsg, State> {
    private readonly office: Array<Manager<AppMsg, SelfMsg, State>> = [];
    private readonly processes: {[ key: number ]: Process<AppMsg, SelfMsg, State> } = {};

    public constructor(
        private readonly dispatch: (many: Array<AppMsg>) => void
    ) {}

    public execute(cmd: Cmd<AppMsg>, sub: Sub<AppMsg>): void {
        const activeManagers: Array<Manager<AppMsg, SelfMsg, State>> = [];
        const bags: {[ key: number ]: Bag<AppMsg> } = {};

        // Collect commands and subscriptions by manager id
        // Track active managers to register or send empty bag
        Collector.collect(cmd, activeManagers, bags);
        Collector.collect(sub, activeManagers, bags);

        // Handles effects of active managers only
        for (const manager of activeManagers) {
            // Extract an existing process or start new one
            const process = this.processes[ manager.id ] || this.hireManager(manager);
            // Extract bag of commands and subscriptions
            // It always exists in bags but let's leave empty by default to be sure
            const bag = bags[ manager.id ] || { commands: [], subscriptions: [] };

            this.processes[ manager.id ] = process.send(bag);
        }

        // Pass empty bag to passive managers
        for (const manager of this.office) {
            // manager is active actually
            if (manager.id in bags) {
                continue;
            }

            const process = this.processes[ manager.id ];

            if (typeof process === 'undefined') {
                continue;
            }

            // If a manager don't get any effects this circle send empty
            this.processes[ manager.id ] = process.send({ commands: [], subscriptions: [] });
        }
    }

    private hireManager(manager: Manager<AppMsg, SelfMsg, State>): Process<AppMsg, SelfMsg, State> {
        const loop = (state: State): Promise<State> => {
            const foo: Promise<State> = null as never;

            return foo.then(loop);
        };

        const promise = Promisify.toPromise(manager.init).then(loop);

        this.office.push(manager);
    }
}

/**
 * P R O G R A M
 */

export interface Program<Model, Msg> {
    getModel(): Model;
    dispatch(msg: Msg): void;
    subscribe(subscriber: () => void): () => void;
}

export const program = <Flags, Model, Msg>({ flags, init, update, subscriptions }: {
    flags: Flags;
    init(flags: Flags): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}): Program<Model, Msg> => {
    return new ProgramImpl(init(flags), update, subscriptions);
};

class ProgramImpl<Model, Msg> implements Program<Model, Msg> {
    private model: Model;
    private readonly runtime: Runtime<Msg>;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        this.model = initialModel;
        this.runtime = new Runtime((many: Array<Msg>): void => this.dispatchMany(many));

        this.runtime.execute(initialCmd, subscriptions(initialModel));
    }

    public getModel(): Model {
        return this.model;
    }

    public dispatch(msg: Msg): void {
        this.dispatchMany([ msg ]);
    }

    public subscribe(subscriber: () => void): () => void {
        let index: number = this.subscribers.length;

        this.subscribers.push(subscriber);

        return (): void => {
            if (index !== -1) {
                this.subscribers.splice(index, 1);
                index = -1;
            }
        };
    }

    private dispatchMany(many: Array<Msg>): void {
        if (many.length === 0) {
            return;
        }

        for (const msg of many) {
            const [ nextModel, cmd ] = this.update(msg, this.model);

            this.model = nextModel;
            this.runtime.execute(cmd, this.subscriptions(nextModel));
        }
    }
}

/**
 * T A S K
 */

export class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new Task(() => Promise.resolve(value));
    }

    public static fail<E>(error: E): Task<E, never> {
        return new Task(() => Promise.reject(error));
    }

    protected static toPromise<E, T>(task: Task<E, T>): Promise<T> {
        return task.promise();
    }

    protected constructor(private readonly promise: () => Promise<T>) {}

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return new Task(
            () => this.promise().then(fn)
        );
    }

    public chain<R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return new Task(
            () => this.promise().then((value: T): Promise<R> => fn(value).promise())
        );
    }

    public mapError<G>(fn: (error: E) => G): Task<G, T> {
        return new Task(
            () => this.promise().catch((error: E): Promise<T> => Promise.reject(fn(error)))
        );
    }

    public chainError<G>(fn: (error: E) => Task<G, T>): Task<G, T> {
        return new Task(
            () => this.promise().catch((error: E): Promise<T> => fn(error).promise())
        );
    }
}

abstract class Promisify<E, T> extends Task<E, T> {
    public static toPromise<E, T>(task: Task<E, T>): Promise<T> {
        return super.toPromise(task);
    }
}
