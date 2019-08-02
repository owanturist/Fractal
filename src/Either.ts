import {
    Arg,
    Return,
    IsNever,
    WhenNever,
    Cata,
    identity
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

type Wrap<E, T> = IsNever<T, never, Either<E, T>>;

export namespace Either {
    export type Pattern<E, T, R> = Cata<{
        Left(error: E): R;
        Right(value: T): R;
    }>;
}

export type Pattern<E, T, R> = Either.Pattern<E, T, R>;

export abstract class Either<E, T> {
    public static Left<E>(error: E): Either<E, never> {
        return new Variants.Left(error);
    }

    public static Right<T>(value: T): Either<never, T> {
        return new Variants.Right(value);
    }

    public static fromNullable<E, T>(
        error: E, value: T | null | undefined
    ): Either<E, T extends null | undefined ? never : T> {
        return value == null
            ? Left(error)
            : Right(value as T extends null | undefined ? never : T);
    }

    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.fold((): Either<E, T> => Left(error), Right);
    }

    public static merge<T>(either: Either<T, T>): T {
        return either.fold(identity, identity);
    }

    /**
     * @todo fix the `E` calculation. Now it's always `unknown`.
     */
    public static props<E, O extends {}>(config: {[ K in keyof O ]: Either<E, O[ K ]>}): Either<E, O> {
        const acc: O = {} as O;

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[ key ];

                if (value.isLeft()) {
                    return value as Either<E, never>;
                }

                acc[ key ] = value.getOrElse(null as never /* don't use this hack */);
            }
        }

        return Right(acc);
    }

    public static combine<E, T>(array: Array<Either<E, T>>): Either<
        unknown extends E ? never : E,
        Array<unknown extends T ? never : T>
    > {
        const acc: Array<T> = [];

        for (const item of array) {
            if (item.isLeft()) {
                return item as Either<unknown extends E ? never : E, never>;
            }

            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }

        return Right(acc as Array<unknown extends T ? never : T>);
    }

    public isLeft(): boolean {
        return false;
    }

    public isRight(): boolean {
        return false;
    }

    public abstract isEqual<E_, T_>(another: Either<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    public abstract map<R>(fn: (value: T) => R): Either<E, R>;

    public abstract mapLeft<S>(fn: (error: E) => S): Either<S, T>;

    public abstract chain<E_, R>(
        fn: (value: T) => Either<WhenNever<E, E_>, R>
    ): Either<WhenNever<E, E_>, R>;

    public abstract ap<E_, R = never>(
        eitherFn: Either<WhenNever<E, E_>, (value: T) => R>
    ): Either<WhenNever<E, E_>, WhenNever<R, T>>;

    public abstract pipe<E_>(either: Wrap<WhenNever<E, E_>, Arg<T>>): Either<WhenNever<E, E_>, Return<T>>;

    public abstract orElse<E_, T_>(
        fn: (error: WhenNever<E, E_>) => Either<WhenNever<E, E_>, WhenNever<T, T_>>
    ): Either<WhenNever<E, E_>, WhenNever<T, T_>>;

    public abstract getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

    public mapBoth<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R> {
        return this.map(rightFn).mapLeft(leftFn);
    }

    public swap(): Either<T, E> {
        return this.fold(
            Right as (value: E) => Either<T, E>,
            Left as (error: T) => Either<T, E>
        );
    }

    public extract(fn: (error: E) => T): T {
        return this.fold(fn, identity);
    }

    public fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R {
        return this.cata({
            Left: leftFn,
            Right: rightFn
        });
    }

    public cata<R>(pattern: Pattern<E, T, R>): R {
        return (pattern._ as () => R)();
    }

    public touch<R>(fn: (that: Either<E, T>) => R): R {
        return fn(this);
    }

    public toMaybe(): Maybe<T> {
        return this.fold(() => Nothing, Just);
    }
}

namespace Variants {
    export class Left<E> extends Either<E, never> {
        public constructor(private readonly error: E) {
            super();
        }

        public isLeft(): boolean {
            return true;
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

        public chain<E_>(): Either<WhenNever<E, E_>, never> {
            return this as unknown as Either<WhenNever<E, E_>, never>;
        }

        public ap<E_>(): Either<WhenNever<E, E_>, never> {
            return this as unknown as Either<WhenNever<E, E_>, never>;
        }

        public pipe<E_>(): Either<WhenNever<E, E_>, never> {
            return this as unknown as Either<WhenNever<E, E_>, never>;
        }

        public orElse<E_>(
            fn: (error: WhenNever<E, E_>) => Either<WhenNever<E, E_>, never>
        ): Either<WhenNever<E, E_>, never> {
            return fn(this.error as WhenNever<E, E_>);
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public cata<R>(pattern: Pattern<E, never, R>): R {
            if (typeof pattern.Left === 'function') {
                return pattern.Left(this.error);
            }

            return super.cata(pattern);
        }
    }

    export class Right<T> extends Either<never, T> {
        public constructor(private readonly value: T) {
            super();
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

        public chain<R>(fn: (value: T) => Either<never, R>): Either<never, R> {
            return fn(this.value);
        }

        public pipe(either: Wrap<never, Arg<T>>): Either<never, Return<T>> {
            return either.map(this.value as unknown as (value: Arg<T>) => Return<T>);
        }

        public ap<R>(
            eitherFn: Either<never, (value: T) => R>
        ): Either<never, WhenNever<R, T>> {
            return eitherFn.pipe(
                this as unknown as IsNever<T, never, Either<never, T>>
            ) as Either<never, WhenNever<R, T>>;
        }

        public orElse<T_>(): Either<never, WhenNever<T, T_>> {
            return this as unknown as Either<never, WhenNever<T, T_>>;
        }

        public getOrElse<T_>(): WhenNever<T, T_> {
            return this.value as WhenNever<T, T_>;
        }

        public cata<R>(pattern: Pattern<never, T, R>): R {
            if (typeof pattern.Right === 'function') {
                return pattern.Right(this.value);
            }

            return super.cata(pattern);
        }
    }
}

export const Left = Either.Left;

export const Right = Either.Right;

export const fromNullable = Either.fromNullable;

export const fromMaybe = Either.fromMaybe;

export const merge = Either.merge;

export const props = Either.props;

export const combine = Either.combine;

export default Either;
