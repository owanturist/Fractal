import {
    IsNever,
    WhenNever
} from '../Basics';
import {
    Either,
    Left,
    Right
} from '../Either';
import * as Scheduler from './Scheduler';

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
        let acc: Task<E, Array<T>> = Task.succeed([]);

        for (const task of tasks) {
            acc = acc.chain(
                (arr: Array<T>): Task<E, Array<T>> => task.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public static binding<E, T>(callback: (done: (task: Task<E, T>) => void) => void | (() => void)): Task<E, T> {
        return new Task(Scheduler.binding(
            (done: (task: Scheduler.Task<E, T>) => void): void | (() => void) => callback(
                (task: Task<E, T>): void => done(task.internal)
            )
        ));
    }

    protected static execute<E, T>(task: Task<E, T>): Scheduler.Task<E, T> {
        return task.internal;
    }

    protected constructor(protected internal: Scheduler.Task<E, T>) {}

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

        return registerCmd('TASK', result);
    }

    public attempt<Msg>(tagger: (either: Either<E, T>) => Msg): Cmd<Msg> {
        const result = this
            .map((value: T): Msg => tagger(Right(value)))
            .onError((error: E): Task<never, Msg> => Task.succeed(tagger(Left(error))));

        return registerCmd('TASK', result);
    }

    public spawn(): Task<never, Process> {
        return new Task(
            Scheduler.chain(
                (process: Scheduler.Process): Scheduler.Task<never, Process> => {
                    return Scheduler.succeed(new InternalProcess(process));
                },
                Scheduler.spawn(this.internal)
            )
        );
    }
}

class InternalTask<E, T> extends Task<E, T> {
    public static execute<E, T>(task: Task<E, T>): Scheduler.Task<E, T> {
        return super.execute(task);
    }

    public constructor(task: Scheduler.Task<E, T>) {
        super(task);
    }
}

export class Process {
    public static sleep(time: number): Task<never, void> {
        return Task.binding(callback => {
            const id = setTimeout(() => {
                callback(Task.succeed(undefined));
            }, time);

            return () => { clearTimeout(id); };
        });
    }

    protected static execute(process: Process): Scheduler.Process {
        return process.internal;
    }

    protected constructor(protected readonly internal: Scheduler.Process) {}

    public kill(): Task<never, void> {
        return new InternalTask(
            Scheduler.kill(this.internal)
        );
    }
}

class InternalProcess extends Process {
    public static execute(process: Process): Scheduler.Process {
        return super.execute(process);
    }

    public constructor(process: Scheduler.Process) {
        super(process);
    }
}

// PROGRAMS

interface Program<Model, Msg> {
}


// INITIALIZE A PROGRAM


export const worker = <Model, Msg>(config: {
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}): Program<Model, Msg> => {
    const [ initialModel, initialCmd ] = config.init();

    const managers: Map<string, Scheduler.Process> = new Map();
    let model = initialModel;

    const ports = _setupEffects(managers, dispatch);

    function dispatch(msg: Msg): void {
        const [nextModel, nextCmd] = config.update(msg, model);

        model = nextModel;

        _dispatchEffects(managers, nextCmd, config.subscriptions(model));
    }

    _dispatchEffects(managers, initialCmd, config.subscriptions(model));

    return ports ? { ports } : {};
};


// EFFECT MANAGERS

type Command<Msg> = Task<never, Msg>;

const spawnCmd = <Msg>(router: Router<Msg, never>, command: Command<Msg>): Task<never, Process> => {
    return command
        .chain((msg: Msg) => sendToApp(router, msg))
        .spawn();
};

export const home = createManager<unknown, never, null, Command<unknown>, never>({
    init: Task.succeed(null),
    onEffects<Msg>(router: Router<Msg, never>, commands: Array<Command<Msg>>): Task<never, null> {
        return Task.sequence(
            commands.map((command: Command<Msg>): Task<never, Process> => spawnCmd(router, command))
        ).map(() => null);
    },
    onSelfMsg(): Task<never, null> {
        return Task.succeed(null);
    },
    cmdMap<T, R>(tagger: (value: T) => R, command: Command<T>): Command<R> {
        return(new InternalTask(command)).map(tagger);
    },
    subMap<T, R>(_tagger: (value: T) => R, subscription: never): never {
        return subscription;
    }
});

const effectManagers: {
    [ key: string ]: Manager<unknown, unknown, unknown, unknown, unknown>;
} = {
    TASK: home
};

function _setupEffects<Msg>(managers: Map<string, Scheduler.Process>, sendToApp: (msg: Msg) => void) {
    let ports;

    // setup all necessary effect managers
    // tslint:disable-next-line:forin
    for (const key in effectManagers) {
        const manager = effectManagers[key];

        if (manager.__portSetup) {
            ports = ports || {};
            ports[key] = manager.__portSetup(key, sendToApp);
        }

        managers.set(key, _instantiateManager(manager, sendToApp));
    }

    return ports;
}

interface Effects<AppMsg> {
    commands: Array<AppMsg>;
    subscriptions: Array<AppMsg>;
}

type InternalMsg<AppMsg, SelfMsg>
    = { $: '_INTERNAL_MSG__APP_MSG_'; effects: Effects<AppMsg> }
    | { $: '_INTERNAL_MSG__SELF_MSG_'; msg: SelfMsg }
    ;

const appMsg = <AppMsg, SelfMsg>(effects: Effects<AppMsg>): InternalMsg<AppMsg, SelfMsg> => ({
    $: '_INTERNAL_MSG__APP_MSG_',
    effects
});

const selfMsg = <AppMsg, SelfMsg>(msg: SelfMsg): InternalMsg<AppMsg, SelfMsg> => ({
    $: '_INTERNAL_MSG__SELF_MSG_',
    msg
});

export interface Router<AppMsg, SelfMsg> {
    __selfProcess: Scheduler.Process;
    __sendToApp(msg: AppMsg): void;
}

interface Manager<AppMsg, SelfMsg, State, Command, Subscription> {
    init: Task<never, State>;
    onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Command>,
        subscriptions: Array<Subscription>,
        state: State
    ): Task<never, State>;
    onSelfMsg(router: Router<AppMsg, SelfMsg>, msg: SelfMsg, state: State): Task<never, State>;
    cmdMap<R>(tagger: (command: Command) => R, command: Command): R;
    subMap<R>(tagger: (subscription: Subscription) => R, subscription: Subscription): R;
}

export function createManager<AppMsg, SelfMsg, State, Command, Subscription>(
    config: Manager<AppMsg, SelfMsg, State, Command, Subscription>
) {
    return config;
}

function _instantiateManager<AppMsg, SelfMsg, State, Command, Subscription>(
    manager: Manager<AppMsg, SelfMsg, State, Command, Subscription>,
    sendToApp: (msg: AppMsg) => void
): Scheduler.Process {
    const router: Router<AppMsg, SelfMsg> = {
        __sendToApp: sendToApp,
        __selfProcess: Scheduler.rawSpawn(Scheduler.chain(loop, InternalTask.execute(manager.init)))
    };

    function loop(state: State): Scheduler.Task<never, State> {
        return Scheduler.chain(loop, Scheduler.receive((msg: InternalMsg<AppMsg, SelfMsg>) => {
            switch (msg.$) {
                case '_INTERNAL_MSG__APP_MSG_': {
                    return InternalTask.execute(
                        manager.onEffects(router, msg.effects.commands, msg.effects.subscriptions, state)
                    );
                }

                case '_INTERNAL_MSG__SELF_MSG_': {
                    return InternalTask.execute(
                        manager.onSelfMsg(router, msg.msg, state)
                    );
                }
            }
        }));
    }

    return router.__selfProcess;
}


// ROUTING


export const sendToApp = <AppMsg, SelfMsg>(
    router: Router<AppMsg, SelfMsg>,
    msg: AppMsg
): Task<never, void> => new InternalTask(
    Scheduler.binding(callback => {
        router.__sendToApp(msg);

        callback(Scheduler.succeed(undefined));
    })
);


export const sendToSelf = <AppMsg, SelfMsg>(
    router: Router<AppMsg, SelfMsg>,
    msg: SelfMsg
): Task<never, void> => new InternalTask(
    Scheduler.send(router.__selfProcess, selfMsg(msg))
);

abstract class Bag<T> {
    public static get none(): Bag<never> {
        return new Batch([]);
    }

    public static batch<T>(bags: Array<Bag<T>>): Bag<T> {
        if (bags.length === 1) {
            return bags[ 0 ];
        }

        return new Batch(bags);
    }

    protected static gather<T>(effectDict: Map<string, Effects<T>>, bag: Bag<T>): void {
        bag.gather(effectDict);
    }

    public abstract map<R>(fn: (effect: T) => R): Bag<R>;


    protected abstract gather(effectDict: Map<string, Effects<T>>): void;
}

abstract class BagInternal<T> extends Bag<T> {
    public static gather<T>(effectDict: Map<string, Effects<T>>, bag: Bag<T>): void {
        super.gather(effectDict, bag);
    }
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

    protected gather(effectDict: Map<string, Effects<T>>): void {
        for (const bag of this.bags) {
            BagInternal.gather(effectDict, bag);
        }
    }
}

export class Cmd<T> extends Bag<T> {
    public static get none(): Cmd<never> {
        return Bag.none as Cmd<never>;
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return Bag.batch(cmds as Array<Bag<T>>) as Cmd<T>;
    }

    protected constructor(
        private readonly manager: string,
        private readonly effect: T
    ) {
        super();
    }

    public map<R>(fn: (effect: T) => R): Cmd<R> {
        return new Cmd(this.manager, fn(this.effect));
    }

    protected gather(effectDict: Map<string, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
            effectDict.set(this.manager, {
                commands: [ this.effect ],
                subscriptions: []
            });
        } else {
            effects.commands.push(this.effect);
        }
    }
}

abstract class CmdInternal<T> extends Cmd<T> {
    public static of<T>(manager: string, effect: T): Cmd<T> {
        return new Cmd(manager, effect);
    }
}

export const registerCmd = <T>(manager: string, effect: T): Cmd<T> => {
    return CmdInternal.of(manager, effect);
};

export class Sub<T> extends Bag<T> {
    public static get none(): Sub<never> {
        return Bag.none as Sub<never>;
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return Bag.batch(cmds as Array<Bag<T>>) as Sub<T>;
    }

    protected constructor(
        private readonly manager: string,
        private readonly effect: T
    ) {
        super();
    }

    public map<R>(fn: (effect: T) => R): Sub<R> {
        return new Sub(this.manager, fn(this.effect));
    }

    protected gather(effectDict: Map<string, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
            effectDict.set(this.manager, {
                commands: [],
                subscriptions: [ this.effect ]
            });
        } else {
            effects.subscriptions.push(this.effect);
        }
    }
}

abstract class SubInternal<T> extends Sub<T> {
    public static of<T>(manager: string, effect: T): Sub<T> {
        return new Sub(manager, effect);
    }
}

export const registerSub = <T>(manager: string, effect: T): Sub<T> => {
    return SubInternal.of(manager, effect);
};

const foo = Sub.batch([
    Cmd.none,
    Sub.none,
    registerSub('', 1),
    Sub.batch([
        Sub.none,
        registerSub('', 1)
    ])
])


// PIPE BAGS INTO EFFECT MANAGERS


function _dispatchEffects<Msg>(managers: Map<string, Scheduler.Process>, cmdBag: Cmd<Msg>, subBag: Sub<Msg>) {
    const effectsDict: Map<string, Effects<Msg>> = new Map();

    BagInternal.gather(effectsDict, cmdBag);
    BagInternal.gather(effectsDict, subBag);

    for (const [ home, manager ] of managers) {
        Scheduler.rawSend(manager, appMsg(effectsDict.get(home) || {
            commands: [],
            subscriptions: []
        }));
    }
}


// PORTS

function _checkPortName(name) {
    if (effectManagers[name]) {
        // tslint:disable-next-line:no-console
        console.error(`The port '${name}' already exists.`);
    }
}


// OUTGOING PORTS


export function outgoingPort(name) {
    _checkPortName(name);

    effectManagers[name] = {
        cmdMap: _outgoingPortMap,
        __portSetup: _setupOutgoingPort
    };

    return value => registerCmd(name, value);
}


const _outgoingPortMap = (_tagger, value) => value;

function _setupOutgoingPort(name) {
    let subs = [];

    // CREATE MANAGER

    const init = Process.sleep(0);

    effectManagers[name].init = init;
    effectManagers[name].onEffects = (router, cmdList, state) => {
        for (const cmd of cmdList) {
            // grab a separate reference to subs in case unsubscribe is called
            const currentSubs = subs;

            for (const sub of currentSubs) {
                sub(cmd);
            }
        }
        return init;
    };

    // PUBLIC API

    function subscribe(callback) {
        subs.push(callback);
    }

    function unsubscribe(callback) {
        // copy subs into a new array in case unsubscribe is called within a
        // subscribed callback
        subs = subs.slice();

        const index = subs.indexOf(callback);

        if (index >= 0) {
            subs.splice(index, 1);
        }
    }

    return { subscribe, unsubscribe };
}


// INCOMING PORTS


export function incomingPort(name) {
    _checkPortName(name);

    effectManagers[name] = {
        subMap: _incomingPortMap,
        __portSetup: _setupIncomingPort
    };

    return value => registerSub(name, value);
}


function _incomingPortMap(tagger, finalTagger) {
    return value => tagger(finalTagger(value));
}


function _setupIncomingPort(name, sendToApp) {
    let subs = [];

    // CREATE MANAGER

    const init = Task.succeed(null);

    effectManagers[name].init = init;
    effectManagers[name].onEffects = (router, cmdList, subList, state) => {
        subs = subList;

        return init;
    };

    // PUBLIC API

    function send(incomingValue) {
        for (const sub of subs) {
            sendToApp(sub(incomingValue));
        }
    }

    return { send };
}
