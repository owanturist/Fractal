import {
    noop,
    WhenUnknown,
    Unit
} from './Basics';
import Either, { Left, Right } from './Either';
import Maybe, { Nothing, Just } from './Maybe';
import Dict from './Dict';

const unit = () => Unit;

/**
 * E F F E C T S
 */

interface Bag<AppMsg, SelfMsg, State> {
    readonly manager: Manager<AppMsg, SelfMsg, State>;
    readonly commands: Array<Cmd<AppMsg>>;
}

abstract class Effect<Msg> {
    protected static collect<Msg, State>(effect: Effect<Msg>, bags: Map<number, Bag<Msg, unknown, State>>): void {
        effect.collect(bags);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    protected abstract collect(bags: Map<number, Bag<Msg, unknown, unknown>>): void;
}

abstract class Collector<Msg> extends Effect<Msg> {
    public static collect<Msg, State>(effect: Effect<Msg>, bags: Map<number, Bag<Msg, unknown, State>>): void {
        super.collect(effect, bags);
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

    protected collect(bags: Map<number, Bag<Msg, unknown, unknown>>): void {
        for (const effect of this.effects) {
            Effect.collect(effect, bags);
        }
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    public static none = None as unknown as Cmd<never>;

    public static batch = Batch.of as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;

    public abstract map<R>(fn: (value: Msg) => R): Cmd<R>;

    protected abstract getManager(): Manager<unknown, unknown, unknown>;

    protected collect(bags: Map<number, Bag<Msg, unknown, unknown>>): void {
        const manager = this.getManager();

        const bag = bags.get(manager.id);

        if (bag == null) {
            bags.set(manager.id, {
                commands: [ this ],
                manager
            });
        } else {
            bag.commands.push(this);
        }
    }
}

/**
 * M A N A G E R
 */

export abstract class Manager<AppMsg, SelfMsg, State> {
    private static count = 0;

    public readonly id: number;

    public abstract init: Task<never, State>;

    public constructor() {
        this.id = Manager.count++;
    }

    public abstract onEffects(
        router: Router<AppMsg, SelfMsg>,
        commands: Array<Cmd<AppMsg>>,
        state: State
    ): Task<never, State>;

    public abstract onSelfMsg(
        router: Router<AppMsg, SelfMsg>,
        selfMsg: SelfMsg,
        state: State
    ): Task<never, State>;
}

/**
 * T A S K
 */

interface Context {
    contracts: Array<Contract<never, Unit>>;
}

export abstract class Task<E, T> {
    protected static execute<E, T>(task: Task<E, T>, context: Context): Contract<E, T> {
        return task.execute(context);
    }

    public attempt<Msg>(tagger: (result: Either<E, T>) => Msg): Cmd<Msg> {
        const task = this
            .map(value => tagger(Right(value)))
            .chainError(error => Task.succeed(tagger(Left(error))));

        return new Perform(task);
    }

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return new Mapper(fn, this);
    }

    public chain<R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return new Chainer(fn, this);
    }

    public mapError<Y>(fn: (error: E) => Y): Task<Y, T> {
        return new ErrorMapper(fn, this);
    }

    public chainError<Y>(fn: (error: E) => Task<Y, T>): Task<Y, T> {
        return new ErrorChainer(fn, this);
    }

    public spawn(): Task<never, Process> {
        return Process.spawn(this);
    }

    public tap<R>(fn: (task: Task<E, T>) => R): R {
        return fn(this);
    }

    protected abstract execute(context: Context): Contract<E, T>;
}

export namespace Task {
    export const succeed = <T>(value: T): Task<never, T> => {
        return new Succeed(value);
    };

    export const fail = <E>(error: E): Task<E, never> => {
        return new Fail(error);
    };

    export const custom = <E, T>(
        executor: (executor: {
            reject(error: E): void;
            resolve(value: T): void;
            onCancel(abort: () => void): void;
        }) => void
    ): Task<E, T> => {
        return new Custom((reject, resolve, onCancel) => executor({ reject, resolve, onCancel }));
    };

    export const all = <E, T>(tasks: Array<Task<E, T>>): Task<WhenUnknown<E, never> , Array<T>> => {
        return new All(tasks) as unknown as Task<WhenUnknown<E, never>, Array<T>>;
    };

    export const shape = <E, O>(object: {[ K in keyof O ]: Task<E, O[ K ]>}): Task<WhenUnknown<E, never>, O> => {
        const tasks: Array<Task<E, O[ Extract<keyof O, string> ]>> = [];
        const indexToKey: Array<Extract<keyof O, string>> = [];

        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                tasks.push(object[ key ]);
                indexToKey.push(key);
            }
        }

        return new All(tasks).map(values => {
            const acc = {} as O;

            for (let index = 0; index < values.length; index++) {
                const value = values[ index ];
                const key = indexToKey[ index ];

                acc[ key ] = value;
            }

            return acc;
        }) as unknown as Task<WhenUnknown<E, never>, O>;
    };

    export const perform = <T, Msg>(tagger: (value: T) => Msg, task: Task<never, T>): Cmd<Msg> => {
        return new Perform(task.map(tagger));
    };
}

class Custom<E, T> extends Task<E, T> {
    public constructor(
        private readonly executor: (
            reject: (error: E) => void,
            resolve: (value: T) => void,
            onCancel: (cancel: () => void) => void
        ) => void
    ) {
        super();
    }

    protected execute(): Contract<E, T> {
        return Contract.create(this.executor);
    }
}

class Succeed<T> extends Task<never, T> {
    public constructor(
        private readonly value: T
    ) {
        super();
    }

    protected execute(): Contract<never, T> {
        return Contract.resolve(this.value);
    }
}

class Fail<E> extends Task<E, never> {
    public constructor(
        private readonly error: E
    ) {
        super();
    }

    protected execute(): Contract<E, never> {
        return Contract.reject(this.error);
    }
}

class Identity<T> extends Task<never, T> {
    public constructor(
        private readonly contract: Contract<never, T>
    ) {
        super();
    }

    public execute(): Contract<never, T> {
        return this.contract;
    }
}

class All<E, T> extends Task<E, Array<T>> {
    public constructor(
        private readonly tasks: Array<Task<E, T>>
    ) {
        super();
    }

    protected execute(context: Context): Contract<E, Array<T>> {
        return Contract.all(this.tasks.map(task => Task.execute(task, context)));
    }
}

class Mapper<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => R,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(context: Context): Contract<E, R> {
        return Task.execute(this.task, context).map(this.fn);
    }
}

class ErrorMapper<E, T, Y> extends Task<Y, T> {
    public constructor(
        private readonly fn: (error: E) => Y,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(context: Context): Contract<Y, T> {
        return Task.execute(this.task, context).mapError(this.fn);
    }
}

class Chainer<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => Task<E, R>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(context: Context): Contract<E, R> {
        return Task.execute(this.task, context).chain(value => Task.execute(this.fn(value), context));
    }
}

class ErrorChainer<E, T, Y> extends Task<Y, T> {
    public constructor(
        private readonly fn: (error: E) => Task<Y, T>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(context: Context): Contract<Y, T> {
        return Task.execute(this.task, context).chainError(error => Task.execute(this.fn(error), context));
    }
}

class Spawn<E, T> extends Task<never, Process> {
    public constructor(
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(context: Context): Contract<never, Process> {
        const contract = Task.execute(this.task, context);

        context.contracts.push(contract.finally(unit));

        return Contract.resolve(new AsyncProcess(contract.cancel));
    }
}

export interface Process {
    kill(): Cmd<never>;
}

export namespace Process {
    export const spawn = <E, T>(task: Task<E, T>): Task<never, Process> => {
        return new Spawn(task);
    };

    export const sleep = (milliseconds: number): Task<never, Unit> => {
        return Task.custom(({ resolve, onCancel }) => {
            const timeoutID = setTimeout(() => resolve(Unit), milliseconds);

            onCancel(() => clearTimeout(timeoutID));
        });
    };
}

class AsyncProcess implements Process {
    public constructor(
        private readonly cancel: () => void
    ) {}

    public kill(): Cmd<never> {
        return new Kill(this.cancel);
    }
}

export interface Router<AppMsg, SelfMsg> {
    sendToApp(messages: Array<AppMsg>): Task<never, Unit>;
    sendToSelf(selfMsg: SelfMsg): Task<never, Unit>;
}

class TaskState<AppMsg> {
    public static initial: TaskState<unknown> = new TaskState(Dict.empty as Dict<number, Array<unknown>>);

    private constructor(
        private readonly processes: Dict<number, Array<AppMsg>>
    ) {}

    public scheduleLetter(pid: number, msg: AppMsg): TaskState<AppMsg> {
        return this.processes.get(pid).map(mailbox => new TaskState(
            this.processes.insert(pid, [ ...mailbox, msg ])
        )).getOrElse(this);
    }

    public releaseLetters(pid: number): Maybe<[ Array<AppMsg>, TaskState<AppMsg> ]> {
        return this.processes.get(pid).map(mailbox => [
            mailbox,
            this.removeProcess(pid)
        ]);
    }

    public removeProcess(pid: number): TaskState<AppMsg> {
        return new TaskState(this.processes.remove(pid));
    }
}

const taskManager = new class TaskManager<AppMsg> extends Manager<AppMsg, number, TaskState<AppMsg>> {
    public readonly init = Task.succeed(TaskState.initial as TaskState<AppMsg>);

    public onEffects(
        router: Router<AppMsg, number>,
        commands: Array<TaskCmd<AppMsg>>,
        state: TaskState<AppMsg>
    ): Task<never, TaskState<AppMsg>> {
        let result = Task.succeed(state);

        for (const cmd of commands) {
            result = result.chain(nextState => cmd.onEffects(router, nextState));
        }

        return result;
    }

    public onSelfMsg(
        router: Router<AppMsg, number>,
        pid: number,
        state: TaskState<AppMsg>
    ): Task<never, TaskState<AppMsg>> {
        return state.releaseLetters(pid).fold(
            () => Task.succeed(state),
            ([ letters, nextState ]) => router.sendToApp(letters).map(() => nextState)
        );
    }
}();

abstract class TaskCmd<AppMsg> extends Cmd<AppMsg> {
    public abstract onEffects(
        router: Router<AppMsg, number>,
        state: TaskState<AppMsg>
    ): Task<never, TaskState<AppMsg>>;

    protected getManager(): Manager<AppMsg, number, TaskState<AppMsg>> {
        return taskManager as Manager<AppMsg, number, TaskState<AppMsg>>;
    }
}

class Perform<AppMsg> extends TaskCmd<AppMsg> {
    public constructor(
        private readonly task: Task<never, AppMsg>
    ) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): Cmd<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<AppMsg, number>, state: TaskState<AppMsg>): Task<never, TaskState<AppMsg>> {
        return this.task.chain(msg => router.sendToApp([ msg ])).spawn().map(() => state);
    }
}

class Kill<AppMsg> extends TaskCmd<AppMsg> {
    public constructor(private readonly cancel: () => void) {
        super();
    }

    public map(): Cmd<never> {
        return this;
    }

    public onEffects(_router: Router<AppMsg, number>, state: TaskState<AppMsg>): Task<never, TaskState<AppMsg>> {
        this.cancel();

        return Task.succeed(state);
    }
}

/**
 * R U N T I M E
 */

abstract class TaskRunner<E, T> extends Task<E, T> {
    public static execute<E, T>(task: Task<E, T>, context: Context): Contract<E, T> {
        return super.execute(task, context);
    }
}

class Runtime<AppMsg, SelfMsg, State> {
    private readonly router: Router<AppMsg, SelfMsg>;
    private readonly states: Map<number, Contract<never, State>> = new Map();

    public constructor(
        dispatch: (messages: Array<AppMsg>) => Contract<never, Unit>
    ) {
        this.router = {
            sendToApp: (messages: Array<AppMsg>): Task<never, Unit> => new Identity(dispatch(messages)),
            sendToSelf: (_selfMsg: SelfMsg): Task<never, Unit> => Task.succeed(Unit)
        };
    }

    public runEffects(cmd: Cmd<AppMsg>): Contract<never, Unit> {
        const bags: Map<number, Bag<AppMsg, SelfMsg, State>> = new Map();
        const nextStateContracts: Array<Contract<never, State>> = [];
        const context: Context = {
            contracts: []
        };

        Collector.collect(cmd, bags);

        for (const bag of bags.values()) {
            const contract = this.getManagerState(bag.manager, context)
                .map(state => bag.manager.onEffects(this.router, bag.commands, state))
                .chain(task => TaskRunner.execute(task, context));

            nextStateContracts.push(contract);
            this.states.set(bag.manager.id, contract);
        }

        return Contract.all(nextStateContracts)
            .chain(() => Contract.all(context.contracts).finally(unit));
    }

    private getManagerState(manager: Manager<AppMsg, SelfMsg, State>, context: Context): Contract<never, State> {
        const stateContract = this.states.get(manager.id);

        if (stateContract != null) {
            return stateContract;
        }

        return TaskRunner.execute(manager.init, context);
    }
}

/**
 * P R O G R A M
 */

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
        return new ServerProgram(init(flags), update).collect();
    };
}

class ClientProgram<Msg, Model> implements Program<Msg, Model> {
    private model: Model;
    private readonly runtime: Runtime<Msg, unknown, unknown>;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.runtime = new Runtime(messages => {
            this.dispatchMany(messages);

            return Contract.resolve(Unit);
        });

        this.runtime.runEffects(initialCmd);
    }

    public readonly dispatch = (msg: Msg): void => this.dispatchMany([ msg ]);

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

    private dispatchMany(messages: Array<Msg>): void {
        if (messages.length === 0) {
            return;
        }

        const initialModel = this.model;
        const cmds: Array<Cmd<Msg>> = [];

        for (const msg of messages) {
            const [ nextModel, cmd ] = this.update(msg, this.model);

            this.model = nextModel;
            cmds.push(cmd);
        }

        this.runtime.runEffects(Cmd.batch(cmds));

        // prevents subscribers call when model not changed
        if (initialModel === this.model) {
            return;
        }

        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }
}

class ServerProgram<Msg, Model> {
    private model: Model;
    private cmd: Cmd<Msg>;
    private readonly runtime: Runtime<Msg, unknown, unknown>;

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.cmd = initialCmd;
        this.runtime = new Runtime(this.dispatch);
    }

    public collect(): Promise<Model> {
        return this.runtime.runEffects(this.cmd).then(() => this.model);
    }

    private dispatch = (messages: Array<Msg>): Contract<never, Unit> => {
        const cmds: Array<Cmd<Msg>> = [];

        for (const msg of messages) {
            const [ nextModel, cmd ] = this.update(msg, this.model);

            this.model = nextModel;
            cmds.push(cmd);
        }

        return this.runtime.runEffects(Cmd.batch(cmds));
    }
}

/**
 * C O N T R A C T
 */

class Contract<E, T> {
    public static resolve<E, T>(value: T): Contract<E, T> {
        return new Contract(
            noop,
            Promise.resolve(Right(value))
        );
    }

    public static reject<E, T>(error: E): Contract<E, T> {
        return new Contract(
            noop,
            Promise.resolve(Left(error))
        );
    }

    public static create<E, T>(executor: (
        reject: (error: E) => void,
        resolve: (value: T) => void,
        onCancel: (cancel: () => void) => void
    ) => void): Contract<E, T> {
        let cancelPromise = noop;

        return new Contract(
            () => cancelPromise(),
            new Promise((resolve: (value: Either<E, T>) => void, reject: (error: Error) => void): void => {
                executor(
                    error => resolve(Left(error)),
                    value => resolve(Right(value)),
                    cancel => {
                        cancelPromise = () => {
                            cancelPromise = noop;
                            cancel();
                            reject(Contract.CANCEL);
                        };
                    }
                );
            }).then(result => {
                // do not cancel when async is done
                cancelPromise = noop;

                return result;
            })
        );
    }

    public static all<E, T>(contracts: Array<Contract<E, T>>): Contract<E, Array<T>> {
        const N = contracts.length;
        const cancels: Array<() => void> = new Array(N);
        const promises: Array<Promise<Maybe<Either<E, T>>>> = new Array(N);

        for (let i = 0; i < N; i++) {
            const contract = contracts[ i ];

            cancels[ i ] = contract.cancel;
            // prevent canceling of all contracts if one canceled
            promises[ i ] = contract.root.then(Just).catch(Contract.catchAllCancel);
        }

        let cancelPromise = noop;

        return new Contract(
            () => cancelPromise(),
            new Promise((resolve: (value: Either<E, Array<T>>) => void, reject: (error: Error) => void) => {
                Promise.all(promises).then(Maybe.values).then(Either.combine).then(resolve).catch(reject);

                cancelPromise = () => {
                    cancelPromise = noop;

                    for (const cancel of cancels) {
                        cancel();
                    }

                    reject(Contract.CANCEL);
                };
            }).then(result => {
                // do not cancel when async is done
                cancelPromise = noop;

                return result;
            })
        );
    }

    private static CANCEL = new Error('Contract canceled.');

    private static catchAllCancel(error: Error): Promise<Maybe<never>> {
        if (error === Contract.CANCEL) {
            return Promise.resolve(Nothing);
        }

        return Promise.reject(error);
    }

    private static catchCancel(error: Error): Promise<Unit> {
        if (error === Contract.CANCEL) {
            return Promise.resolve(Unit);
        }

        return Promise.reject(error);
    }

    private constructor(
        public readonly cancel: () => void,
        private readonly root: Promise<Either<E, T>>
    ) {}

    public map<R>(fn: (value: T) => R): Contract<E, R> {
        return new Contract(
            this.cancel,
            this.root.then(result => result.map(fn))
        );
    }

    public mapError<Y>(fn: (error: E) => Y): Contract<Y, T> {
        return new Contract(
            this.cancel,
            this.root.then(result => result.mapLeft(fn))
        );
    }

    public chain<R>(fn: (value: T) => Contract<E, R>): Contract<E, R> {
        let cancelPromise = this.cancel;

        const promise = this.root.then(result => result.fold(
            error => Promise.resolve(Left(error)),
            value => {
                const contract = fn(value);

                cancelPromise = contract.cancel;

                return contract.root;
            }
        ));

        return new Contract(() => cancelPromise(), promise);
    }

    public chainError<Y>(fn: (error: E) => Contract<Y, T>): Contract<Y, T> {
        let cancelPromise = this.cancel;

        const promise = this.root.then(result => result.fold(
            error => {
                const contract = fn(error);

                cancelPromise = contract.cancel;

                return contract.root;
            },
            value => Promise.resolve(Right(value))
        ));

        return new Contract(() => cancelPromise(), promise);
    }

    public finally<R>(fn: () => R): Contract<never, R> {
        return new Contract(
            this.cancel,
            this.then(fn).then(Right)
        );
    }

    public then<T>(fn: () => T): Promise<T> {
        return this.root.catch(Contract.catchCancel).then(fn);
    }
}
