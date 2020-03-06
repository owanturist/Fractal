import {
    IsNever,
    WhenNever
} from './Basics';
import Either, { Left, Right } from './Either';
import * as Scheduler from './Scheduler';

export interface Router<AppMsg, SelfMsg> {
    sendToApp(msgs: Array<AppMsg>): Task<never, void>;

    sendToSelf(msg: SelfMsg): Task<never, void>;
}

class RouterImpl<AppMsg, SelfMsg, State> implements Router<AppMsg, SelfMsg> {
    public constructor(
        private readonly process: Scheduler.Process<never, State, Dealer<AppMsg, SelfMsg, State>>,
        private readonly dispatch: (msgs: Array<AppMsg>) => void
    ) {}

    public sendToApp(msgs: Array<AppMsg>): Task<never, void> {
        return new Task(
            Scheduler.binding((done: (task: Scheduler.Task<never, void>) => void): void => {
                done(Scheduler.succeed(this.dispatch(msgs)));
            })
        );
    }

    public sendToSelf(msg: SelfMsg): Task<never, void> {
        return new Task(
            Scheduler.send(this.process, new SelfDealer(msg))
        );
    }
}

export interface Manager<AppMsg, SelfMsg, State> {
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
    readonly commands: Array<Cmd<AppMsg>>;
    readonly subscriptions: Array<Sub<AppMsg>>;
}

abstract class Bag<AppMsg> {
    protected static gather<T>(
        bag: Bag<T>,
        managers: Array<Manager<T, unknown, unknown>>,
        effectsOfManagers: WeakMap<Manager<T, unknown, unknown>, Effects<T>>
    ): void {
        bag.gather(managers, effectsOfManagers);
    }

    public abstract map<R>(fn: (effect: AppMsg) => R): Bag<R>;

    protected abstract gather(
        managers: Array<Manager<AppMsg, unknown, unknown>>,
        effectsOfManagers: WeakMap<Manager<AppMsg, unknown, unknown>, Effects<AppMsg>>
    ): void;
}

abstract class Gatherer<AppMsg> extends Bag<AppMsg> {
    public static gather<AppMsg>(
        bag: Bag<AppMsg>,
        managers: Array<Manager<AppMsg, unknown, unknown>>,
        effectsOfManagers: WeakMap<Manager<AppMsg, unknown, unknown>, Effects<AppMsg>>
    ): void {
        super.gather(bag, managers, effectsOfManagers);
    }
}

const none = new class None<AppMsg> extends Bag<AppMsg> {
    public map<R>(): Bag<R> {
        return this;
    }

    protected gather(): void {
        // do nothing
    }
}<never>();

class Batch<AppMsg> extends Bag<AppMsg> {
    public constructor(private readonly bags: Array<Bag<AppMsg>>) {
        super();
    }

    public map<R>(fn: (effect: AppMsg) => R): Bag<R> {
        const result: Array<Bag<R>> = [];

        for (const bag of this.bags) {
            result.push(bag.map(fn));
        }

        return new Batch(result);
    }

    protected gather(
        managers: Array<Manager<AppMsg, unknown, unknown>>,
        effectsOfManagers: Map<Manager<AppMsg, unknown, unknown>, Effects<AppMsg>>
    ): void {
        for (const bag of this.bags) {
            Bag.gather(bag, managers, effectsOfManagers);
        }
    }
}

const batch = <AppMsg>(bags: Array<Bag<AppMsg>>): Bag<AppMsg> => {
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

export abstract class Cmd<AppMsg> extends Bag<AppMsg> {
    public static none = none as unknown as Cmd<never>;

    public static batch = batch as <T>(cmds: Array<Cmd<T>>) => Cmd<T>;

    protected abstract readonly manager: Manager<AppMsg, unknown, unknown>;

    public abstract map<R>(fn: (effect: AppMsg) => R): Cmd<R>;

    protected gather(
        managers: Array<Manager<AppMsg, unknown, unknown>>,
        effectsOfManagers: WeakMap<Manager<AppMsg, unknown, unknown>, Effects<AppMsg>>
    ): void {
        const effects = effectsOfManagers.get(this.manager);

        if (typeof effects === 'undefined') {
            managers.push(this.manager);
            effectsOfManagers.set(this.manager, {
                commands: [ this ],
                subscriptions: []
            });
        } else {
            effects.commands.push(this);
        }
    }
}

export abstract class Sub<AppMsg> extends Bag<AppMsg> {
    public static none = none as unknown as Sub<never>;

    public static batch = batch as <T>(subs: Array<Sub<T>>) => Sub<T>;

    protected abstract readonly manager: Manager<AppMsg, unknown, unknown>;

    public abstract map<R>(fn: (effect: AppMsg) => R): Sub<R>;

    protected gather(
        sequence: Array<Manager<AppMsg, unknown, unknown>>,
        effectDict: WeakMap<Manager<AppMsg, unknown, unknown>, Effects<AppMsg>>
    ): void {
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

interface Dealer<AppMsg, SelfMsg, State> {
    deal(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State>;
}

class EffectsDealer<AppMsg, SelfMsg, State> implements Dealer<AppMsg, SelfMsg, State> {
    public constructor(private readonly effects: Effects<AppMsg>) {}

    public deal(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State> {
        return manager.onEffects(router, this.effects.commands, this.effects.subscriptions, state);
    }
}

class SelfDealer<AppMsg, SelfMsg, State> implements Dealer<AppMsg, SelfMsg, State> {
    public constructor(private readonly msg: SelfMsg) {}

    public deal(
        manager: Manager<AppMsg, SelfMsg, State>,
        router: Router<AppMsg, SelfMsg>,
        state: State
    ): Task<never, State> {
        return manager.onSelfMsg(router, this.msg, state);
    }
}

class Runtime<AppMsg, SelfMsg, State> {
    private readonly office: Array<Manager<AppMsg, SelfMsg, State>> = [];
    private readonly processes: WeakMap<Manager<AppMsg, SelfMsg, State>, Scheduler.Process> = new WeakMap();

    public constructor(
        private readonly dispatch: (msgs: Array<AppMsg>) => void
    ) {}

    public dispatchEffects(cmd: Cmd<AppMsg>, sub: Sub<AppMsg>) {
        const managers: Array<Manager<AppMsg, SelfMsg, State>> = [];
        const effectsOfManagers: WeakMap<Manager<AppMsg, SelfMsg, State>, Effects<AppMsg>> = new WeakMap();

        Gatherer.gather(cmd, managers, effectsOfManagers);
        Gatherer.gather(sub, managers, effectsOfManagers);

        for (const manager of managers) {
            const process: Scheduler.Process = this.processes.get(manager) || this.registerManager(manager);

            const effects = effectsOfManagers.get(manager) || {
                commands: [],
                subscriptions: []
            };

            Scheduler.rawSend(process, new EffectsDealer<AppMsg, SelfMsg, State>(effects));
        }

        for (const id of this.office) {
            if (effectsOfManagers.has(id)) {
                continue;
            }

            const process = this.processes.get(id);

            if (typeof process === 'undefined') {
                continue;
            }

            Scheduler.rawSend(process, new EffectsDealer<AppMsg, SelfMsg, State>({
                commands: [],
                subscriptions: []
            }));
        }
    }

    private registerManager(
        manager: Manager<AppMsg, SelfMsg, State>
    ): Scheduler.Process<never, State, Dealer<AppMsg, SelfMsg, State>> {
        const loop = (state: State): Scheduler.Task<never, State> => Scheduler.chain(
            loop,
            Scheduler.receive((dealer: Dealer<AppMsg, SelfMsg, State>) => dealer.deal(manager, router, state).execute())
        );

        const process = Scheduler.rawSpawn<never, State, Dealer<AppMsg, SelfMsg, State>>(
            Scheduler.chain(loop, manager.init.execute())
        );

        const router = new RouterImpl<AppMsg, SelfMsg, State>(process, this.dispatch);

        this.office.push(manager);
        this.processes.set(manager, process);

        return process;
    }
}

export class Worker<Model, Msg> {
    private model: Model;
    private readonly runtime: Runtime<Msg, unknown, unknown>;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        this.model = initialModel;
        this.runtime = new Runtime((msgs: Array<Msg>): void => this.dispatchMany(msgs));

        this.runtime.dispatchEffects(
            initialCmd,
            this.subscriptions(initialModel)
        );
    }

    public getModel(): Model {
        return this.model;
    }

    public dispatch(msg: Msg): void {
        this.dispatchMany([ msg ]);
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

    private dispatchMany(msgs: Array<Msg>): void {
        if (msgs.length === 0) {
            return;
        }

        for (const msg of msgs) {
            const [ nextModel, nextCmd ] = this.update(msg, this.model);

            this.model = nextModel;

            this.runtime.dispatchEffects(nextCmd, this.subscriptions(nextModel));
        }

        for (const subscriber of this.subscribers) {
            subscriber();
        }
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
                process => Scheduler.succeed(new Process(process)),
                Scheduler.spawn(this.internal)
            )
        );
    }

    public execute(): Scheduler.Task<E, T> {
        return this.internal;
    }
}

class CoreManager<AppMsg> implements Manager<AppMsg, never, void> {
    public readonly init = Task.succeed(undefined);

    public onEffects(router: Router<AppMsg, never>, commands: Array<Perform<AppMsg>>): Task<never, void> {
        return Task.sequence(
            commands.map(command => command.onEffects(router))
        ).map(() => undefined);
    }

    public onSelfMsg(): Task<never, void> {
        return Task.succeed(undefined);
    }
}

class Perform<AppMsg> extends Cmd<AppMsg> {
    private static readonly manager: Manager<unknown, never, void> = new CoreManager();

    protected readonly manager = Perform.manager;

    public constructor(protected readonly task: Task<never, AppMsg>) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): Perform<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<AppMsg, never>): Task<never, Process> {
        return this.task
            .chain((msg: AppMsg): Task<never, void> => router.sendToApp([ msg ]))
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
}
