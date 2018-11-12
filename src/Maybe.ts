import {
    WhenNever,
    DefaultCase,
    WithDefaultCase
} from './Basics';
import {
    Either,
    Left,
    Right
} from './Either';

export type Pattern<T, R> = WithDefaultCase<{
    Nothing(): R;
    Just(value: T): R;
}, R>;

export abstract class Maybe<T> {
    public static fromNullable<T>(value: T | null | undefined): Maybe<T extends null | undefined ? never : T> {
        return value == null ? Nothing : Just(value as T extends null | undefined ? never : T);
    }

    public static fromEither<E, T>(either: Either<E, T>): Maybe<T> {
        return either.fold(() => Nothing, Just);
    }

    public static props<T extends object>(config: {[ K in keyof T ]: Maybe<T[ K ]>}): Maybe<T> {
        let acc: Maybe<T> = Just({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Maybe<T> => config[ key ].map(
                        (value: T[ Extract<keyof T, string> ]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }

    public static sequence<T>(array: Array<Maybe<T>>): Maybe<Array<T>> {
        let acc: Maybe<Array<T>> = Just([]);

        for (const item of array) {
            acc = acc.chain(
                (arr: Array<T>): Maybe<Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isNothing: boolean;
    public abstract isJust: boolean;
    public abstract isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean;

    public abstract getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D>;

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public abstract orElse<D>(fn: () => Maybe<WhenNever<T, D>>): Maybe<WhenNever<T, D>>;
    public abstract pipe(
        maybe: T extends (value: infer A) => unknown ? Maybe<A> : never
    ): Maybe<T extends (value: unknown) => infer U ? U : T>;

    public abstract fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public abstract toEither<E>(error: E): Either<E, T>;
}

namespace Internal {
    export class Nothing<T> extends Maybe<T> {
        public isNothing: boolean = true;

        public isJust: boolean = false;

        public isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean {
            return another.isNothing;
        }

        public getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D> {
            return defaults;
        }

        public ap<R>(): Maybe<R> {
            return this as unknown as Maybe<R>;
        }

        public map<R>(): Maybe<R> {
            return this as unknown as Maybe<R>;
        }

        public chain<R>(): Maybe<R> {
            return this as unknown as Maybe<R>;
        }

        public orElse<D>(fn: () => Maybe<WhenNever<T, D>>): Maybe<WhenNever<T, D>> {
            return fn();
        }

        public pipe<U>(): Maybe<T extends (value: unknown) => U ? U : T> {
            return this as unknown as Maybe<T extends (value: unknown) => U ? U : T>;
        }

        public fold<R>(nothingFn: () => R): R {
            return nothingFn();
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Nothing === 'function') {
                return pattern.Nothing();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toEither<E>(error: E): Either<E, T> {
            return Left(error);
        }
    }

    export class Just<T> extends Maybe<T> {
        public isNothing: boolean = false;

        public isJust: boolean = true;

        constructor(private readonly value: T) {
            super();
        }

        public isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean {
            return another.fold(
                (): boolean => false,
                (value: WhenNever<T, D>): boolean => value === this.value
            );
        }

        public getOrElse<D>(): WhenNever<T, D> {
            return this.value as unknown as WhenNever<T, D>;
        }

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public orElse<D>(): Maybe<WhenNever<T, D>> {
            return this as unknown as Maybe<WhenNever<T, D>>;
        }

        public pipe<A, U>(maybe: T extends (value: A) => unknown ? Maybe<A> : never): Maybe<U> {
            return maybe.map(this.value as unknown as (value: A) => U);
        }

        public fold<R>(_nothingFn: () => R, justFn: (value: T) => R): R {
            return justFn(this.value);
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Just === 'function') {
                return pattern.Just(this.value);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toEither<E>(): Either<E, T> {
            return Right(this.value);
        }
    }
}

export const Nothing: Maybe<never> = new Internal.Nothing();

export const Just = <T>(value: T): Maybe<T> => new Internal.Just(value);
