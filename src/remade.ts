import { Either, Left, Right } from './Either';
import { Unit } from './Basics';

/**
 * E F F E C T S
 */

interface Bag<Msg> {
    readonly manager: Manager<Msg>;
    readonly commands: Array<Cmd<Msg>>;
}

abstract class Effect<Msg> {
    protected static collect<Msg>(effect: Effect<Msg>, bags: Map<number, Bag<Msg>>): void {
        effect.collect(bags);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    protected abstract collect(bags: Map<number, Bag<Msg>>): void;
}

abstract class Collector<Msg> extends Effect<Msg> {
    public static collect<Msg>(effect: Effect<Msg>, bags: Map<number, Bag<Msg>>): void {
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

    protected collect(bags: Map<number, Bag<Msg>>): void {
        for (const effect of this.effects) {
            Effect.collect(effect, bags);
        }
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    public static none = None as unknown as Cmd<never>;

    public static batch = Batch.of as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;

    protected abstract manager: Manager<Msg>;

    public abstract map<R>(fn: (value: Msg) => R): Cmd<R>;

    protected collect(bags: Map<number, Bag<Msg>>): void {
        const bag = bags.get(this.manager.id);

        if (typeof bag === 'undefined') {
            bags.set(this.manager.id, {
                commands: [ this ],
                manager: this.manager
            });
        } else {
            bag.commands.push(this);
        }
    }
}

/**
 * M A N A G E R
 */

export interface Manager<Msg> {
    readonly id: number;
    onEffects(router: Router<Msg>, commands: Array<Cmd<Msg>>): Task<never, Unit>;
}

namespace Manager {
    export const register = <Msg>(create: () => {
        onEffects(router: Router<Msg>, commands: Array<Cmd<Msg>>): Task<never, Unit>;
    }): Manager<Msg> => {
        const { onEffects } = create();

        return new ManagerImpl(onEffects);
    };
}

class ManagerImpl<Msg> {
    private static count = 0;

    public readonly id: number;

    public constructor(
        public readonly onEffects: (router: Router<Msg>, commands: Array<Cmd<Msg>>) => Task<never, Unit>
    ) {
        this.id = ManagerImpl.count++;
    }
}

/**
 * T A S K
 */

export interface Router<Msg> {
    sendToApp(msg: Msg): Task<never, Unit>;
}

const taskManager: Manager<unknown> = Manager.register(<Msg>() => ({
    onEffects(router: Router<Msg>, commands: Array<Perform<Msg>>): Task<never, Unit> {
        return Task.all(commands.map(cmd => cmd.onEffects(router))).map(() => Unit);
    }
}));

class Perform<Msg> extends Cmd<Msg> {
    protected readonly manager = taskManager;

    public constructor(
        private readonly task: Task<never, Msg>
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<Msg>): Task<never, Unit> {
        return this.task.chain(router.sendToApp);
    }
}

export abstract class Task<E, T> {
    protected static toPromise<E, T>(task: Task<E, T>): Promise<T> {
        return task.toPromise();
    }

    public attempt<Msg>(tagger: (result: Either<E, T>) => Msg): Cmd<Msg> {
        const task: Task<never, Msg> = this
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

    public spawn(): Task<never, Process> {
        return Process.spawn(this);
    }

    public tap<R>(fn: (task: Task<E, T>) => R): R {
        return fn(this);
    }

    protected abstract toPromise(): Promise<T>;
}

export namespace Task {
    export const succeed = <T>(value: T): Task<never, T> => {
        return new Succeed(value);
    };

    export const fail = <E>(error: E): Task<E, never> => {
        return new Fail(error);
    };

    export const sequence = <E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> => {
        return new Sequence(tasks);
    };

    export const all = <E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> => {
        return new All(tasks);
    };

    export const perform = <T, Msg>(tagger: (value: T) => Msg, task: Task<never, T>): Cmd<Msg> => {
        return new Perform(task.map(tagger));
    };
}

abstract class TaskRunner<E, T> extends Task<E, T> {
    public static toPromise<E, T>(task: Task<E, T>): Promise<T> {
        return super.toPromise(task);
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

    protected toPromise(): Promise<T> {
        return Promise.resolve(this.value);
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

    protected toPromise(): Promise<never> {
        return Promise.reject(this.error);
    }
}

class Identity<T> extends Task<never, T> {
    public constructor(private readonly promise: Promise<T>) {
        super();
    }

    protected toPromise(): Promise<T> {
        return this.promise;
    }
}

class Sequence<E, T> extends Task<E, Array<T>> {
    public constructor(private readonly tasks: Array<Task<E, T>>) {
        super();
    }

    protected toPromise(): Promise<Array<T>> {
        let root: Promise<Array<T>> = Promise.resolve([]);

        for (const task of this.tasks) {
            root = root.then(acc => TaskRunner.toPromise(task).then(value => {
                acc.push(value);

                return acc;
            }));
        }

        return root;
    }
}

class All<E, T> extends Task<E, Array<T>> {
    public constructor(private readonly tasks: Array<Task<E, T>>) {
        super();
    }

    protected toPromise(): Promise<Array<T>> {
        return Promise.all(this.tasks.map(TaskRunner.toPromise));
    }
}

class Mapper<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => R,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected toPromise(): Promise<R> {
        return TaskRunner.toPromise(this.task).then(this.fn);
    }
}

class Chainer<E, T, R> extends Task<E, R> {
    public constructor(
        private readonly fn: (value: T) => Task<E, R>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected toPromise(): Promise<R> {
        return TaskRunner.toPromise(this.task).then((value: T) => TaskRunner.toPromise(this.fn(value)));
    }
}

class Spawn extends Task<never, Process> {
    public constructor(private readonly process: Process) {
        super();
    }

    protected toPromise(): Promise<Process> {
        return ProcessRunner.toPromise(this.process);
    }
}

class Sleep extends Task<never, Unit> {
    public constructor(private readonly milliseconds: number) {
        super();
    }

    protected toPromise(): Promise<Unit> {
        return new Promise(resolve => {
            setTimeout(() => resolve(Unit), this.milliseconds);
        });
    }
}

class Kill extends Task<never, Unit> {
    public constructor(private readonly killer: () => Unit) {
        super();
    }

    protected toPromise(): Promise<Unit> {
        return Promise.resolve(this.killer());
    }
}

export class Process {
    public static spawn<E, T>(task: Task<E, T>): Task<never, Process> {
        return new Spawn(new Process(task));
    }

    public static sleep(milliseconds: number): Task<never, Unit> {
        return new Sleep(milliseconds);
    }

    protected static toPromise(process: Process): Promise<Process> {
        return process.toPromise();
    }

    protected constructor(private readonly task: Task<unknown, unknown>) {}

    public kill(): Task<never, Unit> {
        return new Kill(() => Unit);
    }

    public tap<R>(fn: (process: Process) => R): R {
        return fn(this);
    }

    private toPromise(): Promise<Process> {
        return TaskRunner.toPromise(this.task).then(() => this);
    }
}

abstract class ProcessRunner extends Process {
    public static toPromise(process: Process): Promise<Process> {
        return super.toPromise(process);
    }
}

/**
 * R U N T I M E
 */

class Runtime<Msg> {
    private readonly router: Router<Msg>;

    public constructor(
        dispatch: (msg: Msg) => Promise<Unit>
    ) {
        this.router = {
            sendToApp: (msg: Msg): Task<never, Unit> => new Identity(dispatch(msg))
        };
    }

    public runEffects(cmd: Cmd<Msg>): Promise<Unit> {
        const bags: Map<number, Bag<Msg>> = new Map();
        const promises: Array<Promise<Unit>> = [];

        Collector.collect(cmd, bags);

        for (const bag of bags.values()) {
            const task = bag.manager.onEffects(this.router, bag.commands);

            promises.push(TaskRunner.toPromise(task));
        }

        return Promise.all(promises).then(() => Unit);
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
    private readonly runtime: Runtime<Msg>;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.runtime = new Runtime(msg => {
            this.dispatch(msg);

            return Promise.resolve(Unit);
        });

        this.runtime.runEffects(initialCmd);
    }

    public dispatch = (msg: Msg): void => {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        this.model = nextModel;
        this.runtime.runEffects(cmd);

        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }

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
}

class ServerProgram<Msg, Model> {
    private model: Model;
    private cmd: Cmd<Msg>;
    private runtime: Runtime<Msg>;

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

    private dispatch = (msg: Msg): Promise<Unit> => {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        this.model = nextModel;

        return this.runtime.runEffects(cmd);
    }
}
