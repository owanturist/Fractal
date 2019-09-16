import {
    WhenNever,
    identity
} from '../Basics';
import Maybe, { Nothing, Just } from '../Maybe';
import {
    Either,
    Pattern
} from './index';

export class Left<E> implements Either<E, never> {
    public constructor(private readonly error: E) {}

    public isLeft(): boolean {
        return true;
    }

    public isRight(): boolean {
        return false;
    }

    public isEqual<E_>(another: Either<WhenNever<E, E_>, never>): boolean {
        return another.fold(
            (error: WhenNever<E, E_>): boolean => this.error === error,
            (): boolean => false
        );
    }

    public map(): Either<E, never> {
        return this;
    }

    public mapLeft<S>(fn: (error: E) => S): Either<S, never> {
        return new Left(fn(this.error));
    }

    public mapBoth<S>(onLeft: (error: E) => S): Either<S, never> {
        return this.mapLeft(onLeft);
    }

    public chain<E_>(): Either<WhenNever<E, E_>, never> {
        return this as unknown as Either<WhenNever<E, E_>, never>;
    }

    public orElse<E_, T>(
        fn: (error: WhenNever<E, E_>) => Either<WhenNever<E, E_>, T>
    ): Either<WhenNever<E, E_>, T> {
        return fn(this.error as WhenNever<E, E_>);
    }

    public getOrElse<T>(defaults: T): T {
        return defaults;
    }

    public swap(): Either<never, E> {
        return new Right(this.error);
    }

    public extract<T>(fn: (error: E) => T): T {
        return fn(this.error);
    }

    public fold<R>(onLeft: (error: E) => R): R {
        return onLeft(this.error);
    }

    public cata<R>(pattern: Pattern<E, never, R>): R {
        if (typeof pattern.Left === 'function') {
            return pattern.Left(this.error);
        }

        return (pattern._ as () => R)();
    }

    public tap<R>(fn: (that: Either<E, never>) => R): R {
        return fn(this);
    }

    public toMaybe(): Maybe<never> {
        return Nothing;
    }
}

export class Right<T> implements Either<never, T> {
    public constructor(private readonly value: T) {}

    public isLeft(): boolean {
        return false;
    }

    public isRight(): boolean {
        return true;
    }

    public isEqual<T_>(another: Either<never, WhenNever<T, T_>>): boolean {
        return another.fold(
            (): boolean => false,
            (value: WhenNever<T, T_>): boolean => this.value === value
        );
    }

    public map<R>(fn: (value: T) => R): Either<never, R> {
        return new Right(fn(this.value));
    }

    public mapLeft(): Either<never, T> {
        return this;
    }

    public mapBoth<R>(_onLeft: (error: never) => never, onRight: (value: T) => R): Either<never, R> {
        return this.map(onRight);
    }

    public chain<R>(fn: (value: T) => Either<never, R>): Either<never, R> {
        return fn(this.value);
    }

    public orElse<T_>(): Either<never, WhenNever<T, T_>> {
        return this as unknown as Either<never, WhenNever<T, T_>>;
    }

    public getOrElse<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public swap(): Either<T, never> {
        return new Left(this.value);
    }

    public extract<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public fold<R>(_onLeft: (error: never) => R, onRight: (value: T) => R): R {
        return onRight(this.value);
    }

    public cata<R>(pattern: Pattern<never, T, R>): R {
        if (typeof pattern.Right === 'function') {
            return pattern.Right(this.value);
        }

        return (pattern._ as () => R)();
    }

    public tap<R>(fn: (that: Either<never, T>) => R): R {
        return fn(this);
    }

    public toMaybe(): Maybe<T> {
        return Just(this.value);
    }
}

export const fromNullable = <E, T>(
    error: E,
    value: T | null | undefined
): Either<E, T extends null | undefined ? never : T> => {
    return value == null
        ? new Left(error)
        : new Right(value as T extends null | undefined ? never : T);
};

export const fromMaybe = <E, T>(error: E, maybe: Maybe<T>): Either<E, T> => {
    return maybe.fold(
        (): Either<E, T> => new Left(error),
        (value: T): Either<E, T> => new Right(value)
    );
};

export const merge = <T>(either: Either<T, T>): T => either.fold(identity, identity);

export const shape = <E, O extends {}>(object: {[ K in keyof O ]: Either<E, O[ K ]>}): Either<E, O> => {
    const acc: O = {} as O;

    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const value = object[ key ];

            if (value.isLeft()) {
                return value as Either<E, never>;
            }

            acc[ key ] = value.getOrElse(null as never /* don't use this hack */);
        }
    }

    return new Right(acc);
};

export const combine = <E, T>(array: Array<Either<E, T>>): Either<
    unknown extends E ? never : E,
    Array<unknown extends T ? never : T>
> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isLeft()) {
            return item as Either<unknown extends E ? never : E, never>;
        }

        acc.push(item.getOrElse(null as never /* don't use this hack */));
    }

    return new Right(acc as Array<unknown extends T ? never : T>);
};
