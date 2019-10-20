import {
    IsNever,
    WhenNever
} from './Basics';
import Either, { Left, Right } from './Either';
import * as Scheduler from './Scheduler';

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

        this.office.push(manager);
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

// T A S K


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

const manager: Manager = {
    init: Task.succeed(undefined),

    onEffects<AppMsg>(router: Router<AppMsg, never>, commands: Array<Perform<AppMsg>>): Task<never, void> {
        return Task.sequence(
            commands.map((command: Perform<AppMsg>): Task<never, Process> => command.onEffects(router))
        ).map(() => undefined);
    },

    onSelfMsg(): Task<never, void> {
        return Task.succeed(undefined);
    }
};

class Perform<AppMsg> extends Cmd<AppMsg> {
    protected readonly manager = manager;

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

// P R O C E S S

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
