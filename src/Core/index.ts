import {
    IsNever,
    WhenNever
} from '../Basics';
import {
    Either,
    Left,
    Right
} from '../Either';
import {
    Value
} from '../Json/Encode';
import * as Scheduler from './Scheduler';

export abstract class Manager<AppMsg, SelfMsg, State> {
    public abstract init: Task<never, State>;

    public constructor(private readonly id: number) {}

    public identity(): number {
        return this.id;
    }

    public abstract onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Cmd<AppMsg>>,
        subscriptions: Array<Sub<AppMsg>>,
        state: State
    ): Task<never, State>;

    public abstract onSelfMsg(
        router: Router<AppMsg, SelfMsg>,
        msg: SelfMsg,
        state: State
    ): Task<never, State>;
}

interface Effects<AppMsg> {
    commands: Array<Cmd<AppMsg>>;
    subscriptions: Array<Sub<AppMsg>>;
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

class Runtime<AppMsg> {
    public static createManager<AppMsg, SelfMsg, State>(
        factory: new (id: number) => Manager<AppMsg, SelfMsg, State>
    ): Manager<AppMsg, SelfMsg, State> {
        const id = Runtime.office.size;
        const manager = new factory(id);

        Runtime.office.set(id, manager);

        return manager;
    }

    private static readonly office: Map<number, Manager<unknown, unknown, unknown>> = new Map();

    private static initManager<AppMsg, SelfMsg, State>(
        manager: Manager<AppMsg, SelfMsg, State>,
        dispatch: (msg: AppMsg) => void
    ): Scheduler.Process<never, unknown, IM<AppMsg, SelfMsg>> {
        const loop = (state: State): Scheduler.Task<never, State> => {
            return Scheduler.chain(
                loop,
                Scheduler.receive((msg: IM<AppMsg, SelfMsg>) => msg.step(manager, router, state).execute())
            );
        };

        const process: Scheduler.Process<never, unknown, IM<AppMsg, SelfMsg>>
            = Scheduler.rawSpawn(Scheduler.chain(loop, manager.init.execute()));
        const router: Router<AppMsg, SelfMsg> = new Router(process, dispatch);

        return process;
    }

    private readonly processes: Map<number, Scheduler.Process> = new Map();

    public constructor(dispatch: (msg: AppMsg) => void) {
        for (const [key, manager] of Runtime.office) {
            this.processes.set(key, Runtime.initManager(manager, dispatch));
        }
    }

    public dispatchEffects<Msg>(cmd: Cmd<Msg>, sub: Sub<Msg>) {
        const effectsDict: Map<number, Effects<Msg>> = new Map();

        cmd.gather(effectsDict);
        sub.gather(effectsDict);

        for (const [ id, process ] of this.processes) {
            Scheduler.rawSend(process, new AM(effectsDict.get(id) || {
                commands: [],
                subscriptions: []
            }));
        }
    }
}

export const createManager = <AppMsg, SelfMsg, State>(
    factory: new (id: number) => Manager<AppMsg, SelfMsg, State>
): Manager<AppMsg, SelfMsg, State> => Runtime.createManager(factory);

abstract class Bag<T> {
    public static get none(): Bag<never> {
        return Batch.EMPTY;
    }

    public static batch<T>(bags: Array<Bag<T>>): Bag<T> {
        switch (bags.length) {
            case 0: {
                return Bag.none;
            }

            case 1: {
                return bags[ 0 ];
            }

            default: {
                return new Batch(bags);
            }
        }
    }

    public abstract map<R>(fn: (effect: T) => R): Bag<R>;

    public abstract gather(effectDict: Map<number, Effects<T>>): void;
}

class Batch<T> extends Bag<T> {
    public static EMPTY: Bag<never> = new Batch([]);

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

    public gather(effectDict: Map<number, Effects<T>>): void {
        for (const bag of this.bags) {
            bag.gather(effectDict);
        }
    }
}

export abstract class Cmd<T> extends Bag<T> {
    public static get none(): Cmd<never> {
        return Bag.none as Cmd<never>;
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return Bag.batch(cmds) as Cmd<T>;
    }

    protected abstract readonly manager: Manager<T, unknown, unknown>;

    public abstract map<R>(fn: (effect: T) => R): Cmd<R>;

    public gather(effectDict: Map<number, Effects<T>>): void {
        const effects = effectDict.get(this.manager.identity());

        if (typeof effects === 'undefined') {
            effectDict.set(this.manager.identity(), {
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
        return Bag.none as Sub<never>;
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return Bag.batch(cmds) as Sub<T>;
    }

    protected abstract readonly manager: Manager<T, unknown, unknown>;

    public abstract map<R>(fn: (effect: T) => R): Sub<R>;

    public gather(effectDict: Map<number, Effects<T>>): void {
        const effects = effectDict.get(this.manager.identity());

        if (typeof effects === 'undefined') {
            effectDict.set(this.manager.identity(), {
                commands: [],
                subscriptions: [ this ]
            });
        } else {
            effects.subscriptions.push(this);
        }
    }
}

export class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new Task(
            Scheduler.succeed(value)
        );
    }

    public static fail<E>(error: E): Task<E, never> {
        return new Task(
            Scheduler.fail(error)
        );
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        let acc: Scheduler.Task<E, Array<T>> = Scheduler.succeed([]);

        for (const task of tasks) {
            acc = Scheduler.chain(
                (arr: Array<T>): Scheduler.Task<E, Array<T>> => Scheduler.chain(
                    (value: T): Scheduler.Task<E, Array<T>> => {
                        arr.push(value);

                        return Scheduler.succeed(arr);
                    },
                    task.internal
                ),
                acc
            );
        }

        return new Task(acc);
    }

    public static binding<E, T>(callback: (done: (task: Task<E, T>) => void) => void | (() => void)): Task<E, T> {
        return new Task(Scheduler.binding(
            (done: (task: Scheduler.Task<E, T>) => void): void | (() => void) => callback(
                (task: Task<E, T>): void => done(task.internal)
            )
        ));
    }

    public constructor(protected internal: Scheduler.Task<E, T>) {}

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return this.chain((value: T): Task<E, R> => Task.succeed(fn(value)));
    }

    public chain<G, R>(fn: (value: T) => Task<WhenNever<E, G>, R>): Task<WhenNever<E, G>, R> {
        return new Task(
            Scheduler.chain(
                (value: T): Scheduler.Task<WhenNever<E, G>, R> => fn(value).internal,
                this.internal as Scheduler.Task<WhenNever<E, G>, T>
            )
        );
    }

    public mapError<S>(fn: (error: E) => S): Task<S, T> {
        return this.onError((error: E): Task<S, T> => Task.fail(fn(error)));
    }

    public onError<G, S>(fn: (error: E) => Task<S, WhenNever<T, G>>): Task<S, WhenNever<T, G>> {
        return new Task(
            Scheduler.onError(
                (error: E): Scheduler.Task<S, WhenNever<T, G>> => fn(error).internal,
                this.internal as Scheduler.Task<E, WhenNever<T, G>>
            )
        );
    }

    public perform<Msg>(tagger: IsNever<E, (value: T) => Msg, never>): Cmd<Msg> {
        const result = this.map((value: T): Msg => tagger(value)) as Task<never, Msg>;

        return new Perform(result);
    }

    public attempt<Msg>(tagger: (either: Either<E, T>) => Msg): Cmd<Msg> {
        const result = this
            .map((value: T): Msg => tagger(Right(value)))
            .onError((error: E): Task<never, Msg> => Task.succeed(tagger(Left(error))));

        return new Perform(result);
    }

    public spawn(): Task<never, Process> {
        return new Task(
            Scheduler.chain(
                (process: Scheduler.Process): Scheduler.Task<never, Process> => {
                    return Scheduler.succeed(new Process(process));
                },
                Scheduler.spawn(this.internal)
            )
        );
    }

    public execute(): Scheduler.Task<E, T> {
        return this.internal;
    }
}

const taskManager = createManager(class TaskManager<AppMsg> extends Manager<AppMsg, never, void> {
    public init = Task.succeed(undefined);

    public onEffects(router: Router<AppMsg, never>, commands: Array<Perform<AppMsg>>): Task<never, void> {
        return Task.sequence(
            commands.map((command: Perform<AppMsg>): Task<never, Process> => command.onEffects(router))
        ).map(() => undefined);
    }

    public onSelfMsg(): Task<never, void> {
        return Task.succeed(undefined);
    }
});

class Perform<AppMsg> extends Cmd<AppMsg> {
    protected readonly manager: Manager<AppMsg, never, void> = taskManager;

    public constructor(protected readonly task: Task<never, AppMsg>) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): Perform<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<AppMsg, never>): Task<never, Process> {
        return this.task
            .chain((msg: AppMsg): Task<never, void> => router.sendToApp(msg))
            .spawn();
    }
}

// PROCESS

export class Process {
    public static sleep(time: number): Task<never, void> {
        return Task.binding((callback: (task: Task<never, void>) => void) => {
            const id = setTimeout(() => {
                callback(Task.succeed(undefined));
            }, time);

            return () => { clearTimeout(id); };
        });
    }

    public constructor(protected readonly internal: Scheduler.Process) {}

    public kill(): Task<never, void> {
        return new Task(
            Scheduler.kill(this.internal)
        );
    }

    public execute(): Scheduler.Process {
        return this.internal;
    }
}

// PROGRAMS

export class Program<Model, Msg> {
    public static worker<Model, Msg>(config: {
        init(): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
        subscriptions(model: Model): Sub<Msg>;
    }): Program<Model, Msg> {
        return new Program(config.init, config.update, config.subscriptions);
    }

    public readonly ports: {
        send(name: string, value: Value): void;
        subscribe(name: string, listener: (value: Value) => void): void;
    };

    private model: Model;
    private readonly runtime: Runtime<Msg>;
    private readonly subscribers: Array<() => void> = [];

    private constructor(
        init: () => [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        const [ initialModel, initialCmd ] = init();
        const ports = Port.init();

        this.model = initialModel;
        this.ports = {
            send: ports.send,
            subscribe: ports.subscribe
        };

        this.runtime = new Runtime((msg: Msg): void => this.dispatch(msg));

        this.runtime.dispatchEffects(
            Cmd.batch([ initialCmd, ports.cmd ]),
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

// export const worker = <Model, Msg>(config: {
//     init(): [ Model, Cmd<Msg> ];
//     update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
//     subscriptions(model: Model): Sub<Msg>;
// }) => {
//     function dispatch(msg: Msg): void {
//         const [ nextModel, nextCmd ] = config.update(msg, model);

//         model = nextModel;

//         runtime.dispatchEffects(nextCmd, config.subscriptions(model));
//     }

//     const runtime = new Runtime(dispatch);
//     const [ initialModel, initialCmd ] = config.init();
//     let model = initialModel;

//     const ports = Port.init();

//     runtime.dispatchEffects(
//         Cmd.batch([ initialCmd, ports.cmd ]),
//         config.subscriptions(model)
//     );

//     return {
//         ports: {
//             send: ports.send,
//             subscribe: ports.subscribe
//         }
//     };
// };


// PORTS

export namespace Port {
    type PortsDict<T> = Map<string, Array<(value: Value) => T>>;

    interface State<AppMsg> {
        incoming: PortsDict<AppMsg>;
        outcoming: PortsDict<void>;
    }

    type SelfMsg
        = { type: 'SEND'; name: string; value: Value }
        | { type: 'OUTCOMING'; name: string; cb(value: Value): void }
        ;

    const portManager = createManager(class PortManager<AppMsg> extends Manager<AppMsg, SelfMsg, State<AppMsg>> {
        public init = Task.succeed({
            incoming: new Map(),
            outcoming: new Map()
        });

        public onEffects<AppMsg>(
            router: Router<AppMsg, SelfMsg>,
            commands: Array<PortCmd<AppMsg>>,
            subscriptions: Array<PortSub<AppMsg>>,
            state: State<AppMsg>
        ): Task<never, State<AppMsg>> {
            const nextState: State<AppMsg> = {
                incoming: new Map(),
                outcoming: state.outcoming
            };

            for (const sub of subscriptions) {
                sub.register(nextState);
            }

            for (const cmd of commands) {
                cmd.register(router, nextState);
            }

            return Task.succeed(nextState);
        }

        public onSelfMsg<AppMsg>(
            router: Router<AppMsg, SelfMsg>,
            msg: SelfMsg,
            state: State<AppMsg>
        ): Task<never, State<AppMsg>> {
            switch (msg.type) {
                case 'SEND': {
                    const taggers = state.incoming.get(msg.name);

                    if (typeof taggers === 'undefined') {
                        return Task.succeed(state);
                    }

                    return Task.sequence(
                        taggers.map((tagger: (value: Value) => AppMsg) => router.sendToApp(tagger(msg.value)))
                    ).map(() => state);
                }

                case 'OUTCOMING': {
                    const taggers = state.outcoming.get(msg.name);

                    if (typeof taggers === 'undefined') {
                        state.outcoming.set(msg.name, [ msg.cb ]);
                    } else {
                        taggers.push(msg.cb);
                    }

                    return Task.succeed(state);
                }
            }
        }
    });

    abstract class PortSub<AppMsg> extends Sub<AppMsg> {
        protected readonly manager: Manager<AppMsg, SelfMsg, State<AppMsg>> = portManager;

        public abstract map<R>(fn: (msg: AppMsg) => R): PortSub<R>;

        public abstract register(state: State<AppMsg>): void;
    }

    class Incoming<AppMsg> extends PortSub<AppMsg> {
        public constructor(
            protected readonly name: string,
            protected readonly tagger: (value: Value) => AppMsg
        ) {
            super();
        }

        public map<R>(fn: (msg: AppMsg) => R): Incoming<R> {
            return new Incoming(this.name, (value: Value) => fn(this.tagger(value)));
        }

        public register(state: State<AppMsg>): void {
            const taggers = state.incoming.get(this.name);

            if (typeof taggers === 'undefined') {
                state.incoming.set(this.name, [ this.tagger ]);
            } else {
                taggers.push(this.tagger);
            }
        }
    }

    abstract class PortCmd<AppMsg> extends Cmd<AppMsg> {
        protected readonly manager: Manager<AppMsg, SelfMsg, State<AppMsg>> = portManager;

        public map<R>(): PortCmd<R> {
            return this as unknown as PortCmd<R>;
        }

        public abstract register(router: Router<AppMsg, SelfMsg>, state: State<AppMsg>): void;
    }

    class Fire<AppMsg> extends PortCmd<AppMsg> {
        public constructor(
            private readonly name: string,
            private readonly value: Value
        ) {
            super();
        }

        public register(_router: Router<AppMsg, SelfMsg>, state: State<AppMsg>): void {
            const taggers = state.outcoming.get(this.name);

            if (typeof taggers !== 'undefined') {
                for (const tagger of taggers) {
                    tagger(this.value);
                }
            }
        }
    }

    class Outcoming<AppMsg> extends PortCmd<AppMsg> {
        public constructor(
            protected readonly send: (callback: (name: string, cb: (value: Value) => void) => void) => void
        ) {
            super();
        }

        public register(router: Router<AppMsg, SelfMsg>): void {
            this.send((name: string, cb: (value: Value) => void): void => {
                Scheduler.rawSpawn(router.sendToSelf({ type: 'OUTCOMING', name, cb }).execute());
            });
        }
    }

    class Send<AppMsg> extends PortCmd<AppMsg> {
        public constructor(
            private readonly send: (callback: (name: string, value: Value) => void) => void
        ) {
            super();
        }

        public register(router: Router<AppMsg, SelfMsg>): void {
            this.send((name: string, value: Value): void => {
                Scheduler.rawSpawn(router.sendToSelf({ type: 'SEND', name, value }).execute());
            });
        }
    }

    export const init = <AppMsg>(): {
        cmd: Cmd<AppMsg>;
        send(name: string, value: Value): void;
        subscribe(name: string, cb: (value: Value) => void): void;
    } => {
        let send: (name: string, value: Value) => void;
        let subscribe: (name: string, cb: (value: Value) => void) => void;

        return {
            send: (name: string, value: Value): void => send(name, value),
            cmd: Cmd.batch([
                new Send((callback: (name: string, value: Value) => void): void => {
                    send = callback;
                }),
                new Outcoming((callback: (name: string, cb: (value: Value) => void) => void): void => {
                    subscribe = callback;
                })
            ]),
            subscribe: (name: string, cb: (value: Value) => void): void => subscribe(name, cb)
        };
    };

    export const listen = <AppMsg>(name: string, tagger: (value: Value) => AppMsg): Sub<AppMsg> => {
        return new Incoming(name, tagger);
    };

    export const fire = <AppMsg>(name: string, value: Value): Cmd<AppMsg> => {
        return new Fire(name, value);
    };
}
