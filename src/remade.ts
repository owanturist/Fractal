import {
    WhenUnknown,
    Unit
} from './Basics';
import Either, { Left, Right } from './Either';
import Maybe, { Nothing, Just } from './Maybe';
import Dict from './Dict';

const noop = () => {/* do nothing */};

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
}

/**
 * T A S K
 */

interface Context<Msg> {
    promises: Array<Promise<Unit>>;
    processes: Map<number, Processing<Msg>>;
    generatePID(): number;
    dispatch(messages: Array<Msg>): Promise<Unit>;
}

export abstract class Task<E, T> {
    protected static toPromise<E, T, Msg>(task: Task<E, T>, context: Context<Msg>): Promise<Either<E, T>> {
        return task.toPromise(context);
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
        throw new Error(fn + '');
    }

    public chainError<Y>(fn: (error: E) => Task<Y, T>): Task<Y, T> {
        throw new Error(fn + '');
    }

    public spawn<Msg>(): Task<never, Process<Msg>> {
        return Process.spawn(this);
    }

    public tap<R>(fn: (task: Task<E, T>) => R): R {
        return fn(this);
    }

    protected abstract toPromise<Msg>(context: Context<Msg>): Promise<Either<E, T>>;
}

export namespace Task {
    export const succeed = <T>(value: T): Task<never, T> => {
        return new Succeed(value);
    };

    export const fail = <E>(error: E): Task<E, never> => {
        return new Fail(error);
    };

    export const custom = <E, T>(
        callback: (done: (task: Task<E, T>) => void, cancel: (abort: () => void) => void) => void
    ): Task<E, T> => {
        return new Custom(callback);
    };

    export const all = <E, T>(tasks: Array<Task<E, T>>): Task<WhenUnknown<E, never> , Array<T>> => {
        return new All(tasks) as unknown as Task<WhenUnknown<E, never>, Array<T>>;
    };

    export const perform = <T, Msg>(tagger: (value: T) => Msg, task: Task<never, T>): Cmd<Msg> => {
        return new Perform(task.map(tagger));
    };
}

abstract class TaskRunner<E, T> extends Task<E, T> {
    public static toPromise<E, T, Msg>(task: Task<E, T>, context: Context<Msg>): Promise<Either<E, T>> {
        return super.toPromise(task, context);
    }
}

class Custom<E, T> extends Task<E, T> {
    public abort = noop;

    public constructor(
        private readonly callback: (
            done: (task: Task<E, T>) => void,
            cancel: (abort: () => void) => void
        ) => void
    ) {
        super();
    }

    protected toPromise<Msg>(context: Context<Msg>): Promise<Either<E, T>> {
        return new Promise((resolve: (task: Task<E, T>) => void, reject: (unit: Unit) => void) => {
            this.callback(resolve, abort => {
                this.abort = () => {
                    abort();
                    reject(Unit);
                };
            });
        }).then(task => Task.toPromise(task, context));
    }
}

class Succeed<T> extends Task<never, T> {
    public constructor(private readonly value: T) {
        super();
    }

    public map<R>(fn: (value: T) => R): Task<never, R> {
        return new Succeed(fn(this.value));
    }

    public chain<E, R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return fn(this.value);
    }

    public mapError(): Task<never, T> {
        return this;
    }

    public chainError(): Task<never, T> {
        return this;
    }

    protected toPromise(): Promise<Either<never, T>> {
        return Promise.resolve(Right(this.value));
    }
}

class Fail<E> extends Task<E, never> {
    public constructor(private readonly error: E) {
        super();
    }

    public map(): Task<E, never> {
        return this;
    }

    public chain(): Task<E, never> {
        return this;
    }

    public mapError<T, Y>(fn: (error: E) => Y): Task<Y, T> {
        return new Fail(fn(this.error));
    }

    public chainError<T, Y>(fn: (error: E) => Task<Y, T>): Task<Y, T> {
        return fn(this.error);
    }

    protected toPromise(): Promise<Either<E, never>> {
        return Promise.resolve(Left(this.error));
    }
}

class Identity<T> extends Task<never, T> {
    public constructor(
        private readonly promise: Promise<T>
    ) {
        super();
    }

    public toPromise(): Promise<Either<never, T>> {
        return this.promise.then(Right);
    }
}

class All<E, T> extends Task<E, Array<T>> {
    private static catchCancel(error: Unit): Promise<Maybe<never>> {
        return error === Unit ? Promise.resolve(Nothing) : Promise.reject(error);
    }

    public constructor(private readonly tasks: Array<Task<E, T>>) {
        super();
    }

    protected toPromise<Msg>(context: Context<Msg>): Promise<Either<E, Array<T>>> {
        return Promise.all(this.tasks.map((task): Promise<Maybe<Either<E, T>>> => {
            return Task.toPromise(task, context).then(Just).catch(All.catchCancel);
        })).then(promises => Maybe.combine(promises).fold(
            () => Promise.reject(),
            value => Promise.resolve(Either.combine(value))
        ));
    }
}

class Mapper<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => R,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public map<P>(fn: (value: R) => P): Task<E, P> {
        return new Mapper(
            value => fn(this.fn(value)),
            this.task
        );
    }

    public chain<P>(fn: (value: R) => Task<E, P>): Task<E, P> {
        return new Chainer(
            value => fn(this.fn(value)),
            this.task
        );
    }

    protected toPromise<Msg>(context: Context<Msg>): Promise<Either<E, R>> {
        return Task.toPromise(this.task, context).then(result => result.map(this.fn));
    }
}

class Chainer<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => Task<E, R>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public map<P>(fn: (value: R) => P): Task<E, P> {
        return new Chainer(
            value => this.fn(value).map(fn),
            this.task
        );
    }

    public chain<P>(fn: (value: R) => Task<E, P>): Task<E, P> {
        return new Chainer(
            value => this.fn(value).chain(fn),
            this.task
        );
    }

    protected toPromise<Msg>(context: Context<Msg>): Promise<Either<E, R>> {
        return Task.toPromise(this.task, context).then(result => result.map(this.fn).fold(
            error => Promise.resolve(Left(error)),
            task => Task.toPromise(task, context)
        ));
    }
}

class Spawn<Msg> extends Task<never, Process<Msg>> {
    public constructor(
        private readonly createProcess: (pid: number) => Process<Msg>,
        private readonly task: Task<unknown, unknown>
    ) {
        super();
    }

    protected toPromise<M>(context: Context<M>): Promise<Either<never, Process<Msg>>>;
    protected toPromise(context: Context<Msg>): Promise<Either<never, Process<Msg>>> {
        const pid = context.generatePID();

        context.processes.set(pid, {
            mailbox: [],
            kill: noop
        });

        const promise = TaskRunner.toPromise(this.task, context).then(() => {
            const processing = context.processes.get(pid);

            if (processing != null) {
                return context.dispatch(processing.mailbox);
            }

            return Promise.resolve(Unit);
        });

        context.promises.push(promise);

        return Promise.resolve(Right(this.createProcess(pid)));
    }
}

export class Process<Msg> {
    public static spawn<E, T, Msg>(task: Task<E, T>): Task<never, Process<Msg>> {
        return new Spawn(Process.create, task);
    }

    public static sleep(milliseconds: number): Task<never, Unit> {
        return Task.custom((done, cancel) => {
            const timeoutID = setTimeout(() => done(Task.succeed(Unit)), milliseconds);

            cancel(() => clearTimeout(timeoutID));
        });
    }

    private static create<Msg>(id: number): Process<Msg> {
        return new Process(id);
    }

    private constructor(private readonly id: number) {}

    public send(msg: Msg): Cmd<Msg> {
        return new Send(this.id, msg);
    }

    public kill(): Cmd<never> {
        return new Kill(this.id);
    }
}

export interface Router<AppMsg, SelfMsg> {
    sendToApp(messages: Array<AppMsg>): Task<never, Unit>;
    sendToSelf(selfMsg: SelfMsg): Task<never, Unit>;
}

interface Processing<Msg> {
    mailbox: Array<Msg>;
    kill: Task<never, Unit>;
}

class TaskState<AppMsg> {
    public static initial: TaskState<unknown> = new TaskState(Dict.empty as Dict<number, Processing<unknown>>);

    private constructor(
        private readonly processes: Dict<number, Processing<AppMsg>>
    ) {}

    public scheduleLetter(pid: number, msg: AppMsg): TaskState<AppMsg> {
        return this.processes.get(pid).map(processing => new TaskState(
            this.processes.insert(pid, {
                ...processing,
                mailbox: [ ...processing.mailbox, msg ]
            })
        )).getOrElse(this);
    }

    public releaseLetters(pid: number): Maybe<[ Array<AppMsg>, TaskState<AppMsg> ]> {
        return this.processes.get(pid).map(processing => [
            processing.mailbox,
            this.removeProcess(pid)
        ]);
    }

    public killProcess(pid: number): Maybe<[ Task<never, Unit>, TaskState<AppMsg> ]> {
        return this.processes.get(pid).map(processing => [
            processing.kill,
            this.removeProcess(pid)
        ]);
    }

    public removeProcess(pid: number): TaskState<AppMsg> {
        return new TaskState(this.processes.remove(pid));
    }
}

const taskManager = new class TaskManager<AppMsg> extends Manager<AppMsg, number, TaskState<AppMsg>> {
    public init = Task.succeed(TaskState.initial as TaskState<AppMsg>);

    public onEffects(
        router: Router<AppMsg, number>,
        commands: Array<Perform<AppMsg>>,
        state: TaskState<AppMsg>
    ): Task<never, TaskState<AppMsg>> {
        let nextState = Task.succeed(state);

        for (const cmd of commands) {
            nextState = nextState.chain(acc => cmd.onEffects(router, acc));
        }

        return nextState;
    }
}();

abstract class TaskCmd<AppMsg> extends Cmd<AppMsg> {
    public abstract onEffects(router: Router<AppMsg, number>, state: TaskState<AppMsg>): Task<never, TaskState<AppMsg>>;

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

class Send<AppMsg> extends TaskCmd<AppMsg> {
    public constructor(
        private readonly pid: number,
        private readonly msg: AppMsg
    ) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): Cmd<R> {
        return new Send(this.pid, fn(this.msg));
    }

    public onEffects(_router: Router<AppMsg, number>, state: TaskState<AppMsg>): Task<never, TaskState<AppMsg>> {
        return Task.succeed(state.scheduleLetter(this.pid, this.msg));
    }
}

class Kill<AppMsg> extends TaskCmd<AppMsg> {
    public constructor(private readonly pid: number) {
        super();
    }

    public map(): Cmd<never> {
        return this;
    }

    public onEffects(_router: Router<AppMsg, number>, state: TaskState<AppMsg>): Task<never, TaskState<AppMsg>> {
        return state.killProcess(this.pid).fold(
            () => Task.succeed(state),
            ([ kill, nextState ]) => kill.map(() => nextState)
        );
    }
}

/**
 * R U N T I M E
 */

class Runtime<AppMsg, SelfMsg, State> {
    private static catchCancel(error: Unit): Promise<Unit> {
        return error === Unit ? Promise.resolve(Unit) : Promise.reject(error);
    }

    private pid = 0;
    private readonly router: Router<AppMsg, SelfMsg>;
    private readonly states: Map<number, Promise<State>> = new Map();
    private readonly processes: Map<number, Processing<AppMsg>> = new Map();

    public constructor(
        private readonly dispatch: (messages: Array<AppMsg>) => Promise<Unit>
    ) {
        this.router = {
            sendToApp: (messages: Array<AppMsg>): Task<never, Unit> => new Identity(dispatch(messages)),
            sendToSelf: (selfMsg: SelfMsg): Task<never, Unit> => Task.succeed(Unit)
        };
    }

    public runEffects(cmd: Cmd<AppMsg>): Promise<Unit> {
        const bags: Map<number, Bag<AppMsg, SelfMsg, State>> = new Map();
        const nextStatePromises: Array<Promise<State>> = [];
        const processPromises: Array<Promise<Unit>> = [];

        Collector.collect(cmd, bags);

        for (const bag of bags.values()) {
            const statePromise = this.states.get(bag.manager.id)
                || TaskRunner.toPromise(bag.manager.init, {
                    promises: processPromises,
                    processes: this.processes,
                    generatePID: this.generatePID,
                    dispatch: this.dispatch
                })
                    .then(result => result.fold(
                        // Manager.init always Task<never, State>
                        () => Promise.reject(),
                        state => Promise.resolve(state)
                    ));

            const promise = statePromise.then(state => {
                return TaskRunner.toPromise(
                    bag.manager.onEffects(this.router, bag.commands, state),
                    {
                        promises: processPromises,
                        processes: this.processes,
                        generatePID: this.generatePID,
                        dispatch: this.dispatch
                    }
                );
            }).then(result => result.fold(
                () => statePromise,
                state => Promise.resolve(state))
            ).catch(() => statePromise);

            nextStatePromises.push(promise);
            this.states.set(bag.manager.id, promise);
        }

        return Promise.all(nextStatePromises)
            // individual process cancelation should not affect to the rest
            .then(() => Promise.all(processPromises.map(processPromise => {
                return processPromise.then(unit).catch(Runtime.catchCancel);
            })))
            .then(unit);
    }

    private readonly generatePID = () => {
        return this.pid++;
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

            return Promise.resolve(Unit);
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
    private runtime: Runtime<Msg, unknown, unknown>;

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

    private dispatch = (messages: Array<Msg>): Promise<Unit> => {
        const cmds: Array<Cmd<Msg>> = [];

        for (const msg of messages) {
            const [ nextModel, cmd ] = this.update(msg, this.model);

            this.model = nextModel;
            cmds.push(cmd);
        }

        return this.runtime.runEffects(Cmd.batch(cmds));
    }
}
