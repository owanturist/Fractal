import {
    Either
} from '../Either';
import {
    Task
} from '../Task';

export abstract class Sub<T> {
    public static of<E, T, M>(
        task: Task<E, T>,
        tagger: (either: Either<E, T>) => M
    ): Sub<M> {
        return new Single(task, tagger);
    }

    public static batch<T>(cmds: Array<Sub<T>>): Sub<T> {
        return new Batch(cmds);
    }

    public static none<T>(): Sub<T> {
        return new None();
    }

    public abstract map<R>(fn: (value: T) => R): Sub<R>;
}

class Single<E, T, M> extends Sub<M> {
    constructor(
        private readonly task: Task<E, T>,
        private readonly tagger: (either: Either<E, T>) => M
    ) {
        super();
    }

    public map<R>(fn: (value: M) => R): Sub<R> {
        return new Single(
            this.task,
            (either: Either<E, T>): R => fn(this.tagger(either))
        );
    }
}

class Batch<T> extends Sub<T> {
    constructor(private readonly cmds: Array<Sub<T>>) {
        super();
    }

    public map<R>(fn: (value: T) => R): Sub<R> {
        const nextCmds: Array<Sub<R>> = [];

        for (const cmd of this.cmds) {
            nextCmds.push(cmd.map(fn));
        }

        return new Batch(nextCmds);
    }
}

class None<T> extends Sub<T> {
    public map<R>(): Sub<R> {
        return this as any as Sub<R>;
    }
}
