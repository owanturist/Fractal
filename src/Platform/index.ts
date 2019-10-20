import * as Scheduler from './Scheduler';
import { Task } from '../Task';

export class Router<AppMsg, SelfMsg> {
    public constructor(
        private readonly process: Scheduler.Process<never, unknown, IM<AppMsg, SelfMsg>>,
        private readonly dispatch: (msg: AppMsg) => void
    ) {}

    public sendToApp(msg: AppMsg): Task<never, void> {
        return new Task(
            Scheduler.binding((done: (task: Scheduler.Task<never, void>) => void) => {
                done(Scheduler.succeed(this.dispatch(msg)));
            })
        );
    }

    public sendToSelf(msg: SelfMsg): Task<never, void> {
        return new Task(
            Scheduler.send(this.process, new SM(msg))
        );
    }
}

export interface Manager<AppMsg = unknown, SelfMsg = unknown, State = unknown> {
    init: Task<never, State>;

    onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Cmd<AppMsg>>,
        subscriptions: Array<Sub<AppMsg>>,
        state: State
    ): Task<never, State>;

    onSelfMsg(
        router: Router<AppMsg, SelfMsg>,
        msg: SelfMsg,
        state: State
    ): Task<never, State>;
}

interface Effects<AppMsg> {
    commands: Array<Cmd<AppMsg>>;
    subscriptions: Array<Sub<AppMsg>>;
}

abstract class Bag<T> {
    public static gather<T>(sequence: Array<Manager>, effectDict: WeakMap<Manager, Effects<T>>, bag: Bag<T>): void {
        bag.gather(sequence, effectDict);
    }

    public abstract map<R>(fn: (effect: T) => R): Bag<R>;

    protected abstract gather(sequence: Array<Manager>, effectDict: WeakMap<Manager, Effects<T>>): void;
}

class Batch<T> extends Bag<T> {
    public constructor(
        private readonly bags: Array<Bag<T>>
    ) {
        super();
    }

    public map<R>(fn: (effect: T) => R): Bag<R> {
        const result: Array<Bag<R>> = [];

        for (const bag of this.bags) {
            result.push(bag.map(fn));
        }

        return new Batch(result);
    }

    protected gather(sequence: Array<Manager>, effectDict: Map<Manager, Effects<T>>): void {
        for (const bag of this.bags) {
            Bag.gather(sequence, effectDict, bag);
        }
    }
}

const none: Bag<never> = new Batch([]);

const batch = <T>(bags: Array<Bag<T>>): Bag<T> => {
    switch (bags.length) {
        case 0: {
            return none;
        }

        case 1: {
            return bags[ 0 ];
        }

        default: {
            return new Batch(bags);
        }
    }
};

export abstract class Cmd<T> extends Bag<T> {
    public static get none(): Cmd<never> {
        return none as Cmd<never>;
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return batch(cmds) as Cmd<T>;
    }

    protected abstract readonly manager: Manager<T>;

    public abstract map<R>(fn: (effect: T) => R): Cmd<R>;

    protected gather(sequence: Array<Manager>, effectDict: WeakMap<Manager, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
            sequence.push(this.manager);
            effectDict.set(this.manager, {
                commands: [ this ],
                subscriptions: []
            });
        } else {
            effects.commands.push(this);
        }
    }
}

export abstract class Sub<T> extends Bag<T> {
    public static get none(): Sub<never> {
        return none as Sub<never>;
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return batch(cmds) as Sub<T>;
    }

    protected abstract readonly manager: Manager<T>;

    public abstract map<R>(fn: (effect: T) => R): Sub<R>;

    protected gather(sequence: Array<Manager>, effectDict: WeakMap<Manager, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
            sequence.push(this.manager);
            effectDict.set(this.manager, {
                commands: [],
                subscriptions: [ this ]
            });
        } else {
            effects.subscriptions.push(this);
        }
    }
}

abstract class IM<AppMsg, SelfMsg> {
    public abstract step<State>(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State>;
}

class AM<AppMsg, SelfMsg> extends IM<AppMsg, SelfMsg> {
    public constructor(private readonly effects: Effects<AppMsg>) {
        super();
    }

    public step<State>(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State> {
        return manager.onEffects(router, this.effects.commands, this.effects.subscriptions, state);
    }
}

class SM<AppMsg, SelfMsg> extends IM<AppMsg, SelfMsg> {
    public constructor(private readonly msg: SelfMsg) {
        super();
    }

    public step<State>(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State> {
        return manager.onSelfMsg(router, this.msg, state);
    }
}

class Runtime<AppMsg> {
    private readonly office: Array<Manager> = [];
    private readonly processes: WeakMap<Manager, Scheduler.Process> = new WeakMap();

    public constructor(
        private readonly dispatch: (msg: AppMsg) => void
    ) {}

    public dispatchEffects<Msg>(cmd: Cmd<Msg>, sub: Sub<Msg>) {
        const incoming: Array<Manager<AppMsg>> = [];
        const effectsDict: WeakMap<Manager, Effects<Msg>> = new WeakMap();

        Cmd.gather(incoming, effectsDict, cmd);
        Sub.gather(incoming, effectsDict, sub);

        for (const id of incoming) {
            const process = this.processes.get(id) || this.registerManager(id);

            const effects = effectsDict.get(id) || {
                commands: [],
                subscriptions: []
            };

            Scheduler.rawSend(process, new AM<Msg, unknown>(effects));
        }

        for (const id of this.office) {
            if (effectsDict.has(id)) {
                continue;
            }

            const process = this.processes.get(id);

            if (typeof process === 'undefined') {
                continue;
            }

            Scheduler.rawSend(process, new AM({
                commands: [],
                subscriptions: []
            }));
        }
    }

    private registerManager<SelfMsg, State>(
        manager: Manager<AppMsg, SelfMsg, State>
    ): Scheduler.Process<never, unknown, IM<AppMsg, SelfMsg>> {
        const loop = (state: State): Scheduler.Task<never, State> => {
            return Scheduler.chain(
                loop,
                Scheduler.receive((msg: IM<AppMsg, SelfMsg>) => msg.step(manager, router, state).execute())
            );
        };

        const process: Scheduler.Process<never, unknown, IM<AppMsg, SelfMsg>> = Scheduler.rawSpawn(
            Scheduler.chain(loop, manager.init.execute())
        );

        const router: Router<AppMsg, SelfMsg> = new Router(process, this.dispatch);

        this.processes.set(manager, process);

        return process;
    }
}

export class Worker<Model, Msg> {
    private model: Model;
    private readonly runtime: Runtime<Msg>;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        this.model = initialModel;
        this.runtime = new Runtime((msg: Msg): void => this.dispatch(msg));

        this.runtime.dispatchEffects(
            initialCmd,
            this.subscriptions(initialModel)
        );
    }

    public getModel(): Model {
        return this.model;
    }

    public dispatch(msg: Msg): void {
        const [ nextModel, nextCmd ] = this.update(msg, this.model);

        this.model = nextModel;

        this.runtime.dispatchEffects(nextCmd, this.subscriptions(nextModel));

        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }

    public subscribe(subscriber: () => void): () => void {
        let subscribed = true;

        this.subscribers.push(subscriber);

        return () => {
            if (subscribed) {
                this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
                subscribed = false;
            }
        };
    }
}

export class Program<Flags, Model, Msg> {
    public static worker<Flags, Model, Msg>(config: {
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
        subscriptions(model: Model): Sub<Msg>;
    }): Program<Flags, Model, Msg> {
        return new Program(config.init, config.update, config.subscriptions);
    }

    private constructor(
        private readonly init_: (flags: Flags) => [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {}

    public init(flags: Flags): Worker<Model, Msg> {
        return new Worker(this.init_(flags), this.update, this.subscriptions);
    }
}
