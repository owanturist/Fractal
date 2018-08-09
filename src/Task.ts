import {
    Either
} from './Either';
import {
    Cmd
} from './Platform/Cmd';

export abstract class Task<E, T> {
    public abstract map<R>(fn: (value: T) => R): Task<E, R>;

    public abstract chain<R>(fn: (value: T) => Task<E, R>): Task<E, R>;

    public abstract errorMap<S>(fn: (error: E) => S): Task<S, T>;

    public abstract orElse(fn: (error: E) => Either<E, T>): Task<E, T>;

    public abstract attempt<M>(tagger: (result: Either<E, T>) => M): Cmd<M>;
}
