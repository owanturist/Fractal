import {
    Either
} from '../Either';
import {
    Task
} from '../Task';

export abstract class Cmd<T> {
    public static of<E, T, M>(
        task: Task<E, T>,
        tagger: (either: Either<E, T>) => M
    ): Cmd<M> {
        return new Single(task, tagger);
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return new Batch(cmds);
    }

    public static none<T>(): Cmd<T> {
        return new None();
    }

    public abstract map<R>(fn: (value: T) => R): Cmd<R>;
}

class Single<E, T, M> extends Cmd<M> {
    constructor(
        private readonly task: Task<E, T>,
        private readonly tagger: (either: Either<E, T>) => M
    ) {
        super();
    }

    public map<R>(fn: (value: M) => R): Cmd<R> {
        return new Single(
            this.task,
            (either: Either<E, T>): R => fn(this.tagger(either))
        );
    }
}

class Batch<T> extends Cmd<T> {
    constructor(private readonly cmds: Array<Cmd<T>>) {
        super();
    }

    public map<R>(fn: (value: T) => R): Cmd<R> {
        const nextCmds: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            nextCmds.push(cmd.map(fn));
        }

        return new Batch(nextCmds);
    }
}

class None<T> extends Cmd<T> {
    public map<R>(): Cmd<R> {
        return this as any as Cmd<R>;
    }
}
