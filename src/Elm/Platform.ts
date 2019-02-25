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

    public abstract map<R>(fn: (effect: T) => R): Bag<R>;

    public abstract gather(effectDict: Map<string, Effects<T>>): void;
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

    public gather(effectDict: Map<string, Effects<T>>): void {
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

    protected abstract readonly manager: string;

    public gather(effectDict: Map<string, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
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
        return Bag.none as Sub<never>;
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return Bag.batch(cmds) as Sub<T>;
    }

    protected abstract readonly manager: string;

    public gather(effectDict: Map<string, Effects<T>>): void {
        const effects = effectDict.get(this.manager);

        if (typeof effects === 'undefined') {
            effectDict.set(this.manager, {
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


export const worker = <Model, Msg>(config: {
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}) => {
    const [ initialModel, initialCmd ] = config.init();

    const managers: Map<string, Scheduler.Process> = new Map();
    let model = initialModel;

    _setupEffects(managers, dispatch);


    function dispatch(msg: Msg): void {
        const [nextModel, nextCmd] = config.update(msg, model);

        console.log(msg, model, nextModel)

        model = nextModel;

        _dispatchEffects(managers, nextCmd, config.subscriptions(model));
    }

    let k;

    _dispatchEffects(
        managers,
        Cmd.batch([
            initialCmd,
            Port.baz((send: (name: string, value: Value) => void) => {
                k = send
            })
        ]),
        config.subscriptions(model)
    );

    return {
        ports: {
            send(name: string, value: Value): void {
                k(name, value);
            }
        }
    };
};


// EFFECT MANAGERS

class Perform<Msg> extends Cmd<Msg> {
    protected readonly manager = 'TASK';

    public constructor(protected readonly task: Task<never, Msg>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Perform<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<Msg, never>): Task<never, Process> {
        return this.task
            .chain((msg: Msg): Task<never, void> => sendToApp(router, msg))
            .spawn();
    }
}

export const home = (<AppMsg>() => createManager<AppMsg, never, null>({
    init: Task.succeed(null),
    onEffects(router: Router<AppMsg, never>, commands: Array<Perform<AppMsg>>): Task<never, null> {
        return Task.sequence(
            commands.map((command: Perform<AppMsg>): Task<never, Process> => command.onEffects(router))
        ).map(() => null);
    },
    onSelfMsg(): Task<never, null> {
        return Task.succeed(null);
    }
}))();

// PORTS

namespace Port {
    type PortsDict<T> = Map<string, Array<(value: Value) => T>>;

    interface State<AppMsg> {
        incoming: PortsDict<AppMsg>;
    }

    interface SelfMsg {
        name: string;
        value: Value;
    }

    class Incoming<AppMsg> extends Sub<AppMsg> {
        protected readonly manager = 'PORT';

        public constructor(
            protected readonly name: string,
            protected readonly tagger: (value: Value) => AppMsg
        ) {
            super();
        }

        public map<R>(fn: (msg: AppMsg) => R): Incoming<R> {
            return new Incoming(this.name, (value: Value) => fn(this.tagger(value)));
        }

        public register(incoming: PortsDict<AppMsg>): void {
            const taggers = incoming.get(this.name);

            if (typeof taggers === 'undefined') {
                incoming.set(this.name, [ this.tagger ]);
            } else {
                taggers.push(this.tagger);
            }
        }
    }

    const foo = (send: (callback: (name: string, value: Value) => void) => void): Task<never, SelfMsg> => {
        return Task.binding((callback: (task: Task<never, SelfMsg>) => void): void => {
            send((name: string, value: Value): void => {
                callback(Task.succeed({ name, value }));
            });
        });
    };

    const bar = <AppMsg>(
        router: Router<AppMsg, SelfMsg>,
        send: (callback: (name: string, value: Value) => void) => void
    ): Task<never, void> => {
        return foo(send).chain((msg: SelfMsg) => sendToSelf(router, msg));
    };

    class Send<AppMsg> extends Cmd<AppMsg> {
        protected readonly manager = 'PORT';

        public constructor(
            protected readonly send: (callback: (name: string, value: Value) => void) => void
        ) {
            super();
        }

        public map<R>(): Send<R> {
            return new Send(this.send);
        }

        public register(router: Router<AppMsg, SelfMsg>): Task<never, void> {
            return bar(router, this.send);
        }
    }

    export const baz = <AppMsg>(send: (callback: (name: string, value: Value) => void) => void): Cmd<AppMsg> => {
        return new Send(send);
    };

    export const port = <AppMsg>(name: string, tagger: (value: Value) => AppMsg): Sub<AppMsg> => {
        return new Incoming(name, tagger);
    };

    export const home = (<AppMsg>() => createManager<AppMsg, SelfMsg, State<AppMsg>>({
        init: Task.succeed({
            incoming: new Map()
        }),
        onEffects(
            router: Router<AppMsg, SelfMsg>,
            commands: Array<Send<AppMsg>>,
            subscriptions: Array<Incoming<AppMsg>>
        ): Task<never, State<AppMsg>> {
            const incoming: PortsDict<AppMsg> = new Map();

            for (const sub of subscriptions) {
                sub.register(incoming);
            }

            return Task.sequence(
                commands.map((cmd: Send<AppMsg>) => cmd.register(router))
            ).map(() => ({ incoming }));
        },
        onSelfMsg(
            router: Router<AppMsg, SelfMsg>,
            msg: SelfMsg,
            state: State<AppMsg>
        ): Task<never, State<AppMsg>> {
            const taggers = state.incoming.get(msg.name);

            if (typeof taggers === 'undefined') {
                return Task.succeed(state);
            }

            return Task.sequence(
                taggers.map((tagger: (value: Value) => AppMsg) => sendToApp(router, tagger(msg.value)))
            ).map(() => state);
        }
    }))();
}

export const port = Port.port;

const effectManagers: {
    [ key: string ]: Manager<unknown, unknown, unknown>;
} = {
    TASK: home,
    PORT: Port.home
};

function _setupEffects<Msg>(managers: Map<string, Scheduler.Process>, sendToApp: (msg: Msg) => void) {
    // setup all necessary effect managers
    // tslint:disable-next-line:forin
    for (const key in effectManagers) {
        const manager = effectManagers[key];

        managers.set(key, _instantiateManager(manager, sendToApp));
    }
}

interface Effects<AppMsg> {
    commands: Array<Cmd<AppMsg>>;
    subscriptions: Array<Sub<AppMsg>>;
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

interface Manager<AppMsg, SelfMsg, State> {
    init: Task<never, State>;
    onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Cmd<AppMsg>>,
        subscriptions: Array<Sub<AppMsg>>,
        state: State
    ): Task<never, State>;
    onSelfMsg(router: Router<AppMsg, SelfMsg>, msg: SelfMsg, state: State): Task<never, State>;
}

export function createManager<AppMsg, SelfMsg, State>(
    config: Manager<AppMsg, SelfMsg, State>
) {
    return config;
}

function _instantiateManager<AppMsg, SelfMsg, State>(
    manager: Manager<AppMsg, SelfMsg, State>,
    sendToApp: (msg: AppMsg) => void
): Scheduler.Process {
    const router: Router<AppMsg, SelfMsg> = {
        __sendToApp: sendToApp,
        __selfProcess: Scheduler.rawSpawn(Scheduler.chain(loop, manager.init.execute()))
    };

    function loop(state: State): Scheduler.Task<never, State> {
        return Scheduler.chain(loop, Scheduler.receive((msg: InternalMsg<AppMsg, SelfMsg>) => {
            switch (msg.$) {
                case '_INTERNAL_MSG__APP_MSG_': {
                    return manager
                        .onEffects(router, msg.effects.commands, msg.effects.subscriptions, state)
                        .execute();
                }

                case '_INTERNAL_MSG__SELF_MSG_': {
                    return manager.onSelfMsg(router, msg.msg, state).execute();
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
): Task<never, void> => new Task(
    Scheduler.binding(callback => {
        callback(Scheduler.succeed(router.__sendToApp(msg)));
    })
);

export const sendToSelf = <AppMsg, SelfMsg>(
    router: Router<AppMsg, SelfMsg>,
    msg: SelfMsg
): Task<never, void> => new Task(
    Scheduler.send(router.__selfProcess, selfMsg(msg))
);


// PIPE BAGS INTO EFFECT MANAGERS


function _dispatchEffects<Msg>(managers: Map<string, Scheduler.Process>, cmdBag: Cmd<Msg>, subBag: Sub<Msg>) {
    const effectsDict: Map<string, Effects<Msg>> = new Map();

    cmdBag.gather(effectsDict);
    subBag.gather(effectsDict);

    for (const [ home, manager ] of managers) {
        Scheduler.rawSend(manager, appMsg(effectsDict.get(home) || {
            commands: [],
            subscriptions: []
        }));
    }
}



// OUTGOING PORTS


function outgoingPort(name) {
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
            for (const sub of subs) {
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


function incomingPort(name) {
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
