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

abstract class Bag<T> {
    public static gather<T>(effectDict: Map<number, Effects<T>>, bag: Bag<T>): void {
        bag.gather(effectDict);
    }

    public abstract map<R>(fn: (effect: T) => R): Bag<R>;

    protected abstract gather(effectDict: Map<number, Effects<T>>): void;
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

    protected gather(effectDict: Map<number, Effects<T>>): void {
        for (const bag of this.bags) {
            Bag.gather(effectDict, bag);
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

    protected abstract readonly manager: Manager<T, unknown, unknown>;

    public abstract map<R>(fn: (effect: T) => R): Cmd<R>;

    protected gather(effectDict: Map<number, Effects<T>>): void {
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
        return none as Sub<never>;
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return batch(cmds) as Sub<T>;
    }

    protected abstract readonly manager: Manager<T, unknown, unknown>;

    public abstract map<R>(fn: (effect: T) => R): Sub<R>;

    protected gather(effectDict: Map<number, Effects<T>>): void {
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

        Cmd.gather(effectsDict, cmd);
        Sub.gather(effectsDict, sub);

        for (const [ id, process ] of this.processes) {
            Scheduler.rawSend(process, new AM<Msg, unknown>(effectsDict.get(id) || {
                commands: [],
                subscriptions: []
            }));
        }
    }
}

export const createManager = <AppMsg, SelfMsg, State>(
    factory: new (id: number) => Manager<AppMsg, SelfMsg, State>
): Manager<AppMsg, SelfMsg, State> => Runtime.createManager(factory);
