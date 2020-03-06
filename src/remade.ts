import { Either, Left, Right } from './Either';

/**
 * E F F E C T S
 */

interface Bag<Msg> {
    commands: Array<Cmd<Msg>>;
}

abstract class Effect<Msg> {
    protected static collect<Msg>(
        effect: Effect<Msg>,
        managers: Array<Manager<Msg>>,
        bags: {[ key: number ]: Bag<Msg> }
    ): void {
        effect.collect(managers, bags);
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
        super.collect(effect, managers, bags);
    }
}

const None = new class None<Msg> extends Effect<Msg> {
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
            // None is a singleton
            if (effect !== None) {
                notNone.push(effect);
            }
        }

        switch (notNone.length) {
            case 0: return None;
            case 1: return notNone[ 0 ];
            default: return new Batch(notNone);
        }
    }

    private constructor(private readonly effects: Array<Effect<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Effect<R> {
        const nextEffects: Array<Effect<R>> = new Array(this.effects.length);

        for (let i = 0; i < nextEffects.length; i++) {
            nextEffects[ i ] = this.effects[ i ].map(fn);
        }

        return new Batch(nextEffects);
    }

    protected collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void {
        for (const effect of this.effects) {
            Effect.collect(effect, managers, bags);
        }
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    protected abstract manager: Manager<Msg>;

    public abstract map<R>(fn: (value: Msg) => R): Cmd<R>;

    protected collect(managers: Array<Manager<Msg>>, bags: {[ key: number ]: Bag<Msg> }): void {
        const bag = bags[ this.manager.id ];

        if (typeof bag === 'undefined') {
            managers.push(this.manager);
            bags[ this.manager.id ] = {
                commands: [ this ]
            };
        } else {
            bag.commands.push(this);
        }
    }
}

export namespace Cmd {
    export const none = None as unknown as Cmd<never>;

    export const batch = Batch.of as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;
}

/**
 * M A N A G E R
 */

interface Router<AppMsg, SelfMsg> {
    sendToApp(messages: Array<AppMsg>): Task<never, null>;

    sendToSelf(selfMsg: SelfMsg): Task<never, null>;
}

export abstract class Manager<AppMsg, SelfMsg = unknown, State = unknown> {
    public static register<AppMsg, SelfMsg, State>(
        Constructor: new () => Manager<AppMsg, SelfMsg, State>
    ): Manager<AppMsg, SelfMsg, State> {
        return new Constructor();
    }

    private static count = 0;

    public readonly id: number;

    public abstract readonly init: Task<never, State>;

    public constructor() {
        this.id = Manager.count++;
    }

    public abstract onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Cmd<AppMsg>>,
        state: State
    ): Task<never, State>;

    public abstract onSelfMsg(
        sendToApp: Router<AppMsg, SelfMsg>,
        selfMsg: SelfMsg,
        state: State
    ): Task<never, State>;
}

/**
 * T A S K
 */

export abstract class Task<E, T> {
    public abstract map<R>(fn: (value: T) => R): Task<E, R>;
    public abstract chain<R>(fn: (value: T) => Task<E, R>): Task<E, R>;
    public abstract mapError<G>(fn: (error: E) => G): Task<G, T>;
    public abstract chainError<G>(fn: (error: E) => Task<G, T>): Task<G, T>;
    public abstract attempt<Msg>(tagger: (result: Either<E, T>) => Msg): Cmd<Msg>;
    public abstract spawn(): Task<never, Process>;

    public tap<R>(fn: (task: Task<E, T>) => R): R {
        return fn(this);
    }
}

export namespace Task {
    export const combine = <E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> => {
        throw new Error(tasks + '');
    };

    export const sequence = <E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> => {
        throw new Error(tasks + '');
    };

    export const succeed = <T>(value: T): Task<never, T> => {
        throw new Error(value + '');
    };

    const manager = Manager.register(class TaskManager<AppMsg> extends Manager<AppMsg, never, null> {
        public init = Task.succeed(null);

        public onEffects(router: Router<AppMsg, never>, commands: Array<Attempt<AppMsg>>): Task<never, null> {
            const tasks: Array<Task<never, null>> = new Array(commands.length);

            for (let i = 0; i < tasks.length; i++) {
                tasks[ i ] = commands[ i ].run(router);
            }

            return Task.sequence(tasks).map(() => null);
        }

        public onSelfMsg(): Task<never, null> {
            return Task.succeed(null);
        }
    });

    class Attempt<Msg> extends Cmd<Msg> {
        protected manager: Manager<Msg, never, null> = manager;

        public constructor(
            private readonly task: Task<never, Msg>
        ) {
            super();
        }

        public map<R>(fn: (msg: Msg) => R): Cmd<R> {
            return new Attempt(this.task.map(fn));
        }

        public run(router: Router<Msg, never>): Task<never, null> {
            return this.task.chain(msg => router.sendToApp([ msg ]));
        }
    }
}

/**
 * P R O C E S S
 */

export class Process {
    public kill(): Task<never, null> {
        throw new Error();
    }
}

/**
 * P R O G R A M
 */

class Runtime<AppMsg, SelfMsg, State> {
    private readonly office: Array<Manager<AppMsg, SelfMsg, State>> = [];
    private readonly states: {[ key: number ]: Task<never, State> } = {};

    public constructor(
        private readonly dispatch: (messages: Array<AppMsg>) => void
    ) {}

    public runEffects(cmd: Cmd<AppMsg>): Promise<null> {
        const managers: Array<Manager<AppMsg, SelfMsg, State>> = [];
        const bags: {[ key: number ]: Bag<AppMsg> } = {};

        Collector.collect(cmd, managers, bags);

        for (const manager of managers) {
            const stateTask = this.states[ manager.id ] || this.hireManager(manager);
            const bag = bags[ manager.id ] || { commands: [] };


        }
    }

    private hireManager(manager: Manager<AppMsg, SelfMsg, State>): Task<never, State> {
        throw new Error(manager + '');
    }
}

export interface Program<Msg, Model> {
    getModel(): Model;
    dispatch(msg: Msg): void;
    subscribe(subscriber: () => void): () => void;
}

export namespace Program {
    export const client = <Flags, Msg, Model>({ flags, init, update }: {
        flags: Flags;
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    }): Program<Msg, Model> => {
        return new ClientProgram(init(flags), update);
    };

    export const server = <Flags, Msg, Model>({ flags, init, update }: {
        flags: Flags;
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    }): Promise<Model> => {
        return new ServerProgram(init(flags), update).toPromise();
    };
}

class ClientProgram<Msg, Model> implements Program<Msg, Model> {
    private model: Model;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialEffects ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.executeCmd(initialEffects);
    }

    public dispatch = (msg: Msg): void => {
        const [ nextModel, effects ] = this.update(msg, this.model);

        this.model = nextModel;
        this.executeCmd(effects);

        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }

    public getModel(): Model {
        return this.model;
    }

    public subscribe(subscriber: () => void): () => void {
        let subscribed = true;

        this.subscribers.push(subscriber);

        return (): void => {
            if (subscribed) {
                subscribed = false;
                this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
            }
        };
    }

    private executeCmd(cmd: Cmd<Msg>): void {
        Collector.toPromise(cmd, this.dispatch);
    }
}

class ServerProgram<Msg, Model> {
    private model: Model;
    private effects: Cmd<Msg>;

    public constructor(
        [ initialModel, initialEffects ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.effects = initialEffects;
    }

    public toPromise(): Promise<Model> {
        return this.executeCmd(this.effects);
    }

    private dispatch = (msg: Msg): Promise<Model> => {
        const [ nextModel, effects ] = this.update(msg, this.model);

        this.model = nextModel;
        return this.executeCmd(effects);
    }

    private executeCmd(cmd: Cmd<Msg>): Promise<Model> {
        return Collector.toPromise(cmd, this.dispatch).then(() => this.model);
    }
}
