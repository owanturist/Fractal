import {
    Readonly,
    PartialPattern
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

type Pattern<E, T, R> = Readonly<{
    Succeed(value: T): R;
    Fail(error: E): R;
    Chain(
        callback: (error: E) => Task<E, T>,
        task: Maybe<Task<E, T>>,
        rest: Maybe<Task<E, T>>
    ): R;
    OnError(
        callback: (value: T) => Task<E, T>,
        task: Maybe<Task<E, T>>,
        rest: Maybe<Task<E, T>>
    ): R;
    Binding(
        callback: (fn: (root: Task<E, T>) => void) => () => void,
        cancel: Maybe<(() => void)>
    ): R;
    Receive(callback: (msg: T) => Task<E, T>): R;
}>;

export const Scheduler = new (class <E, T> {
    private readonly MAX_STEPS = 1000;

    private pid = 0;
    private working = false;
    private readonly queue: Array<Process<E, T>> = [];

    public upid(): number {
        return this.pid++;
    }

    private enqueue(process: Process<E, T>): void {
        this.queue.push(process);

        if (!this.working) {
            setTimeout(() => this.work(), 0);
            this.working = true;
        }
    }

    private work() {}

    private step(initialCount: number, process: Process<E, T>): number {
        return process.getRoot().map((root: Task<E, T>): number => {
            let count = initialCount;

            for (; count < this.MAX_STEPS; count++) {
                const keepItGoing = root.cata({
                    Succeed: process.applyOnError,

                    Fail: process.applyChain,

                    Chain: (
                        callback: (error: E) => Task<E, T>,
                        task: Maybe<Task<E, T>>,
                        rest: Maybe<Task<E, T>>
                    ): boolean => {
                        process.setStack(
                            new Chain(callback, Nothing(), process.getStack())
                        );
                        task.cata({
                            Nothing: () => {
                                process.kill();
                            },
                            Just: process.setRoot
                        });

                        return true;
                    },

                    OnError: (
                        callback: (value: T) => Task<E, T>,
                        task: Maybe<Task<E, T>>,
                        rest: Maybe<Task<E, T>>
                    ) => {
                        process.setStack(
                            new OnError(callback, Nothing(), process.getStack())
                        );
                        task.cata({
                            Nothing: () => {
                                process.kill();
                            },
                            Just: process.setRoot
                        });

                        return true;
                    },

                    Binding: (callback: (fn: (root: Task<E, T>) => void) => () => void): boolean => {
                        process.setRoot(
                            new Binding(
                                callback,
                                Just(callback((newRoot: Task<E, T>) => {
                                    process.setRoot(newRoot);
                                    this.enqueue(process);
                                }))
                            )
                        );

                        return true;
                    },

                    Receive: (callback: (msg: T) => Task<E, T>): boolean => process.shift(callback),
                });

                if (!keepItGoing) {
                    break;
                }
            }

            if (count < this.MAX_STEPS) {
                return count + 1;
            }

            this.enqueue(process);

            return count;
        }).getOrElse(initialCount);
    }
})();

const MAX_STEPS = 10000;

export abstract class Task<E, T> {
    public abstract cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R;

    public abstract liftChain(): Maybe<Task<E, T>>;

    public abstract liftOnError(): Maybe<Task<E, T>>;
}

class Succeed<E, T> extends Task<E, T> {
    constructor(private readonly value: T) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.Succeed === 'function') {
            return pattern.Succeed(this.value);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return Nothing();
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return Nothing();
    }
}

class Fail<E, T> extends Task<E, T> {
    constructor(private readonly error: E) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.Fail === 'function') {
            return pattern.Fail(this.error);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return Nothing();
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return Nothing();
    }
}

class Binding<E, T> extends Task<E, T> {
    constructor(
        private readonly callback: (fn: (root: Task<E, T>) => void) => () => void,
        private readonly cancel: Maybe<() => void>
    ) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.Binding === 'function') {
            return pattern.Binding(this.callback, this.cancel);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return Nothing();
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return Nothing();
    }
}

class Chain<E, T> extends Task<E, T> {
    constructor(
        private readonly callback: (error: E) => Task<E, T>,
        private readonly task: Maybe<Task<E, T>>,
        private readonly rest: Maybe<Task<E, T>>
    ) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.Chain === 'function') {
            return pattern.Chain(this.callback, this.task, this.rest);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return this.rest.chain(
            (rest: Task<E, T>) =>
                rest
                    .liftChain()
                    .orElse(() => Just(rest))
        );
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return Nothing();
    }
}

class OnError<E, T> extends Task<E, T> {
    constructor(
        private readonly callback: (value: T) => Task<E, T>,
        private readonly task: Maybe<Task<E, T>>,
        private readonly rest: Maybe<Task<E, T>>
    ) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.OnError === 'function') {
            return pattern.OnError(this.callback, this.task, this.rest);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return Nothing();
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return this.rest.chain(
            (rest: Task<E, T>) =>
                rest
                    .liftOnError()
                    .orElse(() => Just(rest))
        );
    }
}

class Receive<E, T> extends Task<E, T> {
    constructor(private readonly callback: (msg: T) => Task<E, T>) {
        super();
    }

    public cata<R>(pattern: PartialPattern<Pattern<E, T, R>, R> | Pattern<E, T, R>): R {
        if (typeof pattern.Receive === 'function') {
            return pattern.Receive(this.callback);
        }

        return (pattern as PartialPattern<Pattern<E, T, R>, R>)._();
    }

    public liftChain(): Maybe<Task<E, T>> {
        return Nothing();
    }

    public liftOnError(): Maybe<Task<E, T>> {
        return Nothing();
    }
}

class Process<E, T> {
    public static of<E, T>(task: Task<E, T>) {
        return new Process(Scheduler.upid(), Just(task), Nothing());
    }

    private readonly mailbox: Array<T> = [];

    constructor(
        private readonly id: number,
        private root: Maybe<Task<E, T>>,
        private stack: Maybe<Task<E, T>>
    ) {}

    public applyChain = (error: E): boolean => {
        this.stack = this.stack.chain((stack: Task<E, T>) => stack.liftChain());

        return this.stack.cata({
            Nothing: () => false,

            Just: (stack: Task<E, T>): boolean => stack.cata({
                Chain: (
                    callback: (error: E) => Task<E, T>,
                    task: Maybe<Task<E, T>>,
                    rest: Maybe<Task<E, T>>
                ) => {
                    this.root = Just(callback(error));
                    this.stack = rest;

                    return true;
                },

                _: () => false
            })
        });
    }

    public applyOnError = (value: T): boolean => {
        this.stack = this.stack.chain((stack: Task<E, T>) => stack.liftOnError());

        return this.stack.cata({
            Nothing: () => false,

            Just: (stack: Task<E, T>): boolean => stack.cata({
                OnError: (
                    callback: (value: T) => Task<E, T>,
                    task: Maybe<Task<E, T>>,
                    rest: Maybe<Task<E, T>>
                ) => {
                    this.root = Just(callback(value));
                    this.stack = rest;

                    return true;
                },

                _: () => false
            })
        });
    }

    public getRoot = (): Maybe<Task<E, T>> => {
        return this.root;
    }

    public setRoot = (nextRoot: Task<E, T>): void => {
        this.root = Just(nextRoot);
    }

    public getStack = (): Maybe<Task<E, T>> => {
        return this.stack;
    }

    public setStack = (nextStack: Task<E, T>): void => {
        this.stack = Just(nextStack);
    }

    public kill = (): void => {
        this.root = Nothing();
    }

    public push = (msg: T): void => {
        this.mailbox.push(msg);
    }

    public shift = (callback: (msg: T) => Task<E, T>): boolean => {
        return Maybe.fromNullable(this.mailbox.shift()).cata({
            Nothing: () => false,
            Just: (msg: T) => {
                this.root = Just(callback(msg));

                return true;
            }
        });
    }
}
