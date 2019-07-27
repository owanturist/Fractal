import {
    Arg,
    Return,
    IsNever,
    WhenNever,
    Cata
} from './Basics';
import {
    Either,
    Left,
    Right
} from './Either';

type Wrap<T> = IsNever<T, never, Maybe<T>>;

export namespace Maybe {
    export type Pattern<T, R> = Cata<{
        Nothing(): R;
        Just(value: T): R;
    }>;
}

export type Pattern<T, R> = Maybe.Pattern<T, R>;

export interface Maybe<T> {
    isNothing(): boolean;
    isJust(): boolean;
    isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean;

    map<R>(fn: (value: T) => R): Maybe<R>;
    chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;
    pipe(maybe: Wrap<Arg<T>>): Maybe<Return<T>>;
    orElse<D>(fn: () => Maybe<WhenNever<T, D>>): Maybe<WhenNever<T, D>>;

    getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D>;
    fold<R>(onNothing: () => R, onJust: (value: T) => R): R;
    cata<R>(pattern: Pattern<T, R>): R;

    toEither<E>(error: E): Either<E, T>;
}

namespace MaybeVariants {
    export class Nohting implements Maybe<never> {
        public isNothing(): boolean {
            return true;
        }

        public isJust(): boolean {
            return false;
        }

        public isEqual<T>(another: Maybe<T>): boolean {
            return another.isNothing();
        }

        public map<R>(): Maybe<R> {
            return this;
        }

        public chain<R>(): Maybe<R> {
            return this;
        }

        public ap<R>(): Maybe<R> {
            return this;
        }

        public pipe<R>(): Maybe<R> {
            return this;
        }

        public orElse<T>(fn: () => Maybe<T>): Maybe<T> {
            return fn();
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public fold<R>(onNothing: () => R): R {
            return onNothing();
        }

        public cata<T, R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Nothing === 'function') {
                return pattern.Nothing();
            }

            return (pattern._ as () => R)();
        }

        public toEither<E, T>(error: E): Either<E, T> {
            return Left(error);
        }
    }

    export class Just<T> implements Maybe<T> {
        public constructor(private readonly value: T) {}

        public isNothing(): boolean {
            return false;
        }

        public isJust(): boolean {
            return true;
        }

        public isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean {
            return another.fold(
                (): boolean => false,
                (value: WhenNever<T, D>): boolean => this.value === value
            );
        }

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(fn(this.value));
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.pipe(this as unknown as Wrap<T>);
        }

        public pipe(maybe: Wrap<Arg<T>>): Maybe<Return<T>> {
            return maybe.map(this.value as unknown as (value: Arg<T>) => Return<T>);
        }

        public orElse<D>(): Maybe<WhenNever<T, D>> {
            return this as unknown as Maybe<WhenNever<T, D>>;
        }

        public getOrElse<D>(): WhenNever<T, D> {
            return this.value as WhenNever<T, D>;
        }

        public fold<R>(_onNothing: () => R, onJust: (value: T) => R): R {
            return onJust(this.value);
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Just === 'function') {
                return pattern.Just(this.value);
            }

            return (pattern._ as () => R)();
        }

        public toEither<E>(): Either<E, T> {
            return Right(this.value);
        }
    }
}

export const Nothing: Maybe<never> = new MaybeVariants.Nohting();

export const Just = <T>(value: T): Maybe<T> => new MaybeVariants.Just(value);

export const fromNullable = <T>(value: T | null | undefined): Maybe<T extends null | undefined ? never : T> => {
    return value == null ? Nothing : Just(value as T extends null | undefined ? never : T);
};

export const fromEither = <E, T>(either: Either<E, T>): Maybe<T> => {
    return either.map(Just).getOrElse(Nothing);
};

export const props = <O extends object>(config: {[ K in keyof O ]: Maybe<O[ K ]>}): Maybe<O> => {
    const acc: O = {} as O;

    for (const key in config) {
        if (config.hasOwnProperty(key)) {
            if (config[ key ].isNothing()) {
                return Nothing;
            }

            acc[ key ] = config[ key ].getOrElse(null as never);
        }
    }

    return Just(acc);
};

export const list = <T>(array: Array<Maybe<T>>): Maybe<Array<T>> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isNothing()) {
            return Nothing;
        }

        acc.push(item.getOrElse(null as never));
    }

    return Just(acc);
};

export const Maybe = {
    fromNullable,
    fromEither,
    props,
    list,
    Nothing,
    Just
};

export default Maybe;
