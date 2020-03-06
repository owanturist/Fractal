import { Either, Left, Right } from './Either';
import { Unit } from './Basics';

/**
 * E F F E C T S
 */

interface Bag<Msg> {
    readonly commands: Array<Cmd<Msg>>;
}

abstract class Effect<Msg> {
    protected static collect<Msg>(
        effect: Effect<Msg>,
        managers: Array<Manager<Msg>>,
        bags: Map<number, Bag<Msg>>
    ): void {
        effect.collect(managers, bags);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    protected abstract collect(managers: Array<Manager<Msg>>, bags: Map<number, Bag<Msg>>): void;
}

abstract class Collector<Msg> extends Effect<Msg> {
    public static collect<Msg>(effect: Effect<Msg>, managers: Array<Manager<Msg>>, bags: Map<number, Bag<Msg>>): void {
        super.collect(effect, managers, bags);
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

    protected collect(managers: Array<Manager<Msg>>, bags: Map<number, Bag<Msg>>): void {
        for (const effect of this.effects) {
            Effect.collect(effect, managers, bags);
        }
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    public static none = None as unknown as Cmd<never>;

    public static batch = Batch.of as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;

    protected abstract manager: Manager<Msg>;

    public abstract map<R>(fn: (value: Msg) => R): Cmd<R>;

    protected collect(managers: Array<Manager<Msg>>, bags: Map<number, Bag<Msg>>): void {
        const bag = bags.get(this.manager.id);

        if (typeof bag === 'undefined') {
            managers.push(this.manager);
            bags.set(this.manager.id, { commands: [ this ]});
        } else {
            bag.commands.push(this);
        }
    }
}

/**
 * M A N A G E R
 */

abstract class Manager<Msg> {
    private static count = 0;

    public readonly id: number;

    public constructor() {
        this.id = Manager.count++;
    }

    public abstract onEffects(
        sendToApp: (msg: Msg) => Task<never, Unit>,
        commands: Array<Cmd<Msg>>
    ): Task<never, Unit>;
}

/**
 * T A S K
 */

const taskManager = new class TaskManager<Msg> extends Manager<Msg> {
    public onEffects(
        sendToApp: (msg: Msg) => Task<never, Unit>,
        commands: Array<Perform<Msg>>
    ): Task<never, Unit> {
        return Task.sequence(commands.map(cmd => cmd.onEffects(sendToApp))).map(() => Unit);
    }
}();

class Perform<Msg> extends Cmd<Msg> {
    protected readonly manager: any = taskManager;

    public constructor(
        private readonly task: Task<never, Msg>
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(sendToApp: (msg: Msg) => Task<never, Unit>): Task<never, Process> {
        return this.task.chain(sendToApp).spawn();
    }
}

export abstract class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new Succeed(value);
    }

    public static fail<E>(error: E): Task<E, never> {
        return new Fail(error);
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        let acc: Task<E, Array<T>> = Task.succeed([]);

        for (const task of tasks) {
            acc = acc.chain(arr => task.map(value => {
                arr.push(value);

                return arr;
            }));
        }

        return acc;
    }

    public static perform<T, Msg>(tagger: (value: T) => Msg, task: Task<never, T>): Cmd<Msg> {
        return new Perform(task.map(tagger));
    }

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

abstract class TaskRunner<E, T> extends Task<E, T> {
    public static toPromise<E, T>(task: Task<E, T>): Promise<T> {
        return super.toPromise(task);
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

class Succeed<T> extends Task<never, T> {
    public constructor(private readonly value: T) {
        super();
    }

    protected toPromise(): Promise<T> {
        return Promise.resolve(this.value);
    }
}

class Fail<E> extends Task<E, never> {
    public constructor(private readonly error: E) {
        super();
    }

    protected toPromise(): Promise<never> {
        return Promise.reject(this.error);
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
        return Promise.resolve(this.process);
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

    protected static toPromise(process: Process): Promise<Unit> {
        return process.toPromise();
    }

    private constructor(private readonly task: Task<unknown, unknown>) {}

    public kill(): Task<never, Unit> {
        return new Kill(() => Unit);
    }

    private toPromise(): Promise<Unit> {
        return this.task.tap(TaskRunner.toPromise).then(() => Unit);
    }
}

/**
 * R U N T I M E
 */

class Runtime<Msg> {
    public constructor(
        private readonly dispatch: (msg: Msg) => Promise<Unit>
    ) {}

    public runEffects(cmd: Cmd<Msg>): Promise<Unit> {
        const managers: Array<Manager<Msg>> = [];
        const bags: Map<number, Bag<Msg>> = new Map();
        const promises: Array<Promise<Unit>> = [];

        Collector.collect(cmd, managers, bags);

        for (const manager of managers) {
            const bag = bags.get(manager.id) || { commands: [] };
            const promise = manager.onEffects(
                messages => new Identity(this.dispatch(messages)),
                bag.commands
            ).tap(TaskRunner.toPromise);

            promises.push(promise);
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
