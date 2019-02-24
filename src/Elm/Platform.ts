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

    public onError<S>(fn: (error: E) => Task<S, T>): Task<S, T> {
        return new Task(
            Scheduler.onError(
                (error: E): Scheduler.Task<S, T> => fn(error).internal,
                this.internal
            )
        );
    }

    public perform<Msg>(tagger: IsNever<E, (value: T) => Msg, never>): Bag<Msg> {
        const rawTask: Scheduler.Task<never, Msg> = Scheduler.chain(
            (value: T): Scheduler.Task<never, Msg> => Scheduler.succeed(tagger(value)),
            this.internal as Scheduler.Task<never, T>
        );

        return leaf('TASK', rawTask);
    }

    public attempt<Msg>(tagger: (either: Either<E, T>) => Msg): Bag<Msg> {
        const rawTask: Scheduler.Task<never, Msg> = Scheduler.onError(
            (error: E): Scheduler.Task<never, Msg> => Scheduler.succeed(tagger(Left(error))),
            Scheduler.chain(
                (value: T): Scheduler.Task<never, Msg> => Scheduler.succeed(tagger(Right(value))),
                this.internal
            )
        );

        return leaf('TASK', rawTask);
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

const __2_SELF = 'SELF';

// PROGRAMS

interface Program<Model, Msg> {
}

type Cmd<Msg> = Array<Msg>;
type Sub<Msg> = Array<Msg>;


// INITIALIZE A PROGRAM


export const worker = <Model, Msg>(config: {
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}): Program<Model, Msg> => {
    const [ initialModel, initialCmd ] = config.init();

    const managers = {};
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

export const home = createManager({
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


const effectManagers = {
    TASK: home
};


function _setupEffects(managers, sendToApp) {
    let ports;

    // setup all necessary effect managers
    // tslint:disable-next-line:forin
    for (const key in effectManagers) {
        const manager = effectManagers[key];

        if (manager.__portSetup) {
            ports = ports || {};
            ports[key] = manager.__portSetup(key, sendToApp);
        }

        managers[key] = _instantiateManager(manager, sendToApp);
    }

    return ports;
}

export interface Router<AppMsg, SelfMsg> {
    __selfProcess: Scheduler.Process;
    __sendToApp(msg: AppMsg): void;
}

interface Manager<AppMsg, SelfMsg = unknown, State = unknown> {
    init: Task<never, State>;
    onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<AppMsg>,
        subscriptions: Array<AppMsg>,
        state: State
    ): Task<never, State>;
    onSelfMsg(router: Router<AppMsg, SelfMsg>, msg: SelfMsg, state: State): Task<never, State>;
    cmdMap<R>(tagger: (msg: AppMsg) => R, cmd: SelfMsg): SelfMsg;
    subMap<R>(tagger: (msg: AppMsg) => R, sub: SelfMsg): SelfMsg;
}

export function createManager<AppMsg, SelfMsg, State>(config: Manager<AppMsg, SelfMsg, State>) {
    return config;
}

function _instantiateManager<AppMsg, SelfMsg, State>(
    manager: Manager<AppMsg, SelfMsg, State>,
    sendToApp: (msg: AppMsg) => void
): Scheduler.Process {

    const router: Router<AppMsg, SelfMsg> = {
        __sendToApp: sendToApp,
        __selfProcess: Scheduler.rawSpawn(Scheduler.chain(loop, InternalTask.execute(manager.init)))
    };

    function loop(state: State): Scheduler.Task<never, State> {
        return Scheduler.chain(loop, Scheduler.receive(msg => {
            const value = msg.a;

            if (msg.$ === __2_SELF) {
                return InternalTask.execute(
                    manager.onSelfMsg(router, value, state)
                );
            }

            return InternalTask.execute(
                manager.onEffects(router, value.__cmds, value.__subs, state)
            );
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
) => new InternalTask(
    Scheduler.send(router.__selfProcess, {
        $: __2_SELF,
        a: msg
    })
);


// BAGS

type Bag<T>
    = BagLeaf<T>
    | BagBatch<T>
    | BagMap<unknown, T>
    ;

interface BagLeaf<T> {
    $: '_BAG__LEAF_';
    __home: string;
    __value: Scheduler.Task<never, T>;
}

export const leaf = <T>(home: string, value: Scheduler.Task<never, T>): Bag<T> => ({
    $: '_BAG__LEAF_',
    __home: home,
    __value: value
});

interface BagBatch<T> {
    $: '_BAG__BATCH_';
    __bags: Array<Scheduler.Task<never, T>>;
}

export const batch = <T>(bags: Array<Scheduler.Task<never, T>>): Bag<T> => ({
    $: '_BAG__BATCH_',
    __bags: bags
});

interface BagMap<T, R> {
    $: '_BAG__MAP_';
    __bag: Bag<T>;
    __func(msg: T): R;
}

export const map = <T, R>(tagger: (msg: T) => R, bag: Bag<T>): Bag<R> => ({
    $: '_BAG__MAP_',
    __bag: bag,
    __func: tagger
});


// PIPE BAGS INTO EFFECT MANAGERS


function _dispatchEffects(managers, cmdBag, subBag) {
    const effectsDict = {};

    _gatherEffects(true, cmdBag, effectsDict, null);
    _gatherEffects(false, subBag, effectsDict, null);

    // tslint:disable-next-line:forin
    for (const home in managers) {
        Scheduler.rawSend(managers[home], {
            $: 'fx',
            a: effectsDict[home] || { __cmds: [], __subs: [] }
        });
    }
}


function _gatherEffects<T>(isCmd: boolean, bag: Bag<T>, effectsDict, taggers) {
    switch (bag.$) {
        case '_BAG__LEAF_':
            const home = bag.__home;
            const effect = _toEffect(isCmd, home, taggers, bag.__value);
            effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
            return;

        case '_BAG__BATCH_':
            for (const leaf of bag.__bags) {
                _gatherEffects(isCmd, leaf, effectsDict, taggers);
            }
            return;

        case '_BAG__MAP_':
            _gatherEffects(isCmd, bag.__bag, effectsDict, {
                __tagger: bag.__func,
                __rest: taggers
            });
            return;
    }
}


function _toEffect(isCmd, home, taggers, value) {
    function applyTaggers(x) {
        let y = x;

        for (let temp = taggers; temp; temp = temp.__rest) {
            y = temp.__tagger(y);
        }
        return y;
    }

    const map = isCmd
        ? effectManagers[home].cmdMap
        : effectManagers[home].subMap;

    return map(applyTaggers, value);
}


function _Platform_insert(isCmd, newEffect, effects) {
    const effects_ = effects || { __cmds: [], __subs: [] };

    if (isCmd) {
        effects_.__cmds.push(newEffect);
    } else {
        effects_.__subs.push(newEffect);
    }

    return effects_;
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

    return value => leaf(name, value);
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

    return value => leaf(name, value);
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
