import {
    Arg,
    Return,
    IsNever,
    WhenNever,
    Default,
    Cata
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

export interface Either<E, T> {
    isLeft(): boolean;
    isRight(): boolean;
    isEqual<E_ extends Default<E>, T_ extends Default<T>>(another: Either<E_, T_>): boolean;

    map<R>(fn: (value: T) => R): Either<E, R>;
    mapLeft<S>(fn: (error: E) => S): Either<S, T>;
    mapBoth<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    chain<E_ extends Default<E>, R>(fn: (value: T) => Either<E_, R>): Either<E_, R>;
    ap<E_ extends Default<E>, F extends (value: T) => unknown>(
        eitherFn: Either<E_, F>
    ): Either<E_, WhenNever<Return<F>, T>>;
    pipe<E_>(either: Wrap<WhenNever<E, E_>, Arg<T>>): Either<WhenNever<E, E_>, Return<T>>;
    swap(): Either<T, E>;
    orElse<E_, T_>(
        fn: () => Either<WhenNever<E, E_>, WhenNever<T, T_>>
    ): Either<WhenNever<E, E_>, WhenNever<T, T_>>;

    getOrElse<T_ extends Default<T>>(defaults: T_): T_;
    // extract(fn: (error: E) => T): T;
    fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    cata<R>(pattern: Pattern<E, T, R>): R;
    // touch<R>(fn: (that: Eith<E, T>) => R): R;

    toMaybe(): Maybe<T>;
}

namespace Variants {
    export class Left<E> implements Either<E, never> {
        public constructor(private readonly error: E) {}

        public isLeft(): boolean {
            return true;
        }

        public isRight(): boolean {
            return false;
        }

        public isEqual<E_ extends Default<E>>(another: Either<E_, never>): boolean {
            return another.fold(
                (error: E_): boolean => this.error === error,
                (): boolean => false
            );
        }

        public map(): Either<E, never> {
            return this;
        }

        public mapLeft<S>(fn: (error: E) => S): Either<S, never> {
            return new Left(fn(this.error));
        }

        public mapBoth<S>(leftFn: (error: E) => S): Either<S, never> {
            return this.mapLeft(leftFn);
        }

        public chain<E_ extends Default<E>>(): Either<E_, never> {
            return this as unknown as Either<E_, never>;
        }

        public ap<E_ extends Default<E>>(): Either<E_, never> {
            return this as unknown as Either<E_, never>;
        }

        public pipe<E_>(): Either<WhenNever<E, E_>, never> {
            return this as unknown as Either<WhenNever<E, E_>, never>;
        }

        public swap(): Either<never, E> {
            return new Right(this.error);
        }

        public orElse<E_>(fn: () => Either<WhenNever<E, E_>, never>): Either<WhenNever<E, E_>, never> {
            return fn();
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error);
        }

        public cata<R>(pattern: Pattern<E, never, R>): R {
            if (typeof pattern.Left === 'function') {
                return pattern.Left(this.error);
            }

            return (pattern._ as () => R)();
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

        public isEqual<T_ extends Default<T>>(another: Either<never, T_>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T_): boolean => this.value === value
            );
        }

        public map<R>(fn: (value: T) => R): Either<never, R> {
            return new Right(fn(this.value));
        }

        public mapLeft(): Either<never, T> {
            return this;
        }

        public mapBoth<R>(_leftFn: (error: never) => never, rightFn: (value: T) => R): Either<never, R> {
            return this.map(rightFn);
        }

        public chain<R>(fn: (value: T) => Either<never, R>): Either<never, R> {
            return fn(this.value);
        }

        public ap<F extends (value: T) => unknown>(eitherFn: Either<never, F>): Either<never, WhenNever<Return<F>, T>> {
            return eitherFn.pipe(
                this as unknown as IsNever<Arg<F>, never, Either<never, Arg<F>>>
            ) as unknown as Either<never, WhenNever<Return<F>, T>>;
        }

        public pipe(either: Wrap<never, Arg<T>>): Either<never, Return<T>> {
            return either.map(this.value as unknown as (value: Arg<T>) => Return<T>);
        }

        public swap(): Either<T, never> {
            return new Left(this.value);
        }

        public orElse<T_>(): Either<never, WhenNever<T, T_>> {
            return this as unknown as Either<never, WhenNever<T, T_>>;
        }

        public getOrElse<T_ extends Default<T>>(): T_ {
            return this.value as T_;
        }

        public fold<R>(_leftFn: (error: never) => R, rightFn: (value: T) => R): R {
            return rightFn(this.value);
        }

        public cata<R>(pattern: Pattern<never, T, R>): R {
            if (typeof pattern.Right === 'function') {
                return pattern.Right(this.value);
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Just(this.value);
        }
    }
}

export const Left = <E>(error: E): Either<E, never> => new Variants.Left(error);

export const Right = <T>(value: T): Either<never, T> => new Variants.Right(value);

export const fromNullable = <E, T>(
    error: E, value: T | null | undefined
): Either<E, T extends null | undefined ? never : T> => {
    return value == null
        ? Left(error)
        : Right(value as T extends null | undefined ? never : T);
};

export const fromMaybe = <E, T>(error: E, maybe: Maybe<T>): Either<E, T> => {
    return maybe.fold((): Either<E, T> => Left(error), Right);
};

// export const merge = () => {}

export const props = <E, O extends object>(config: {[ K in keyof O ]: Either<E, O[ K ]>}): Either<E, O> => {
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
};

export const combine = <E, T>(array: Array<Either<E, T>>): Either<E, Array<T>> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isLeft()) {
            return item as Either<E, never>;
        }

        acc.push(item.getOrElse(null as never /* don't use this hack */));
    }

    return Right(acc);
};

// export const test$isEqual$1 = Lef('').isEqual(Lef(''));
// export const test$isEqual$2 = Lef('').isEqual(Rig(1));
// export const test$isEqual$3 = Rig(1).isEqual(Lef(''));
// export const test$isEqual$4 = Rig(1).isEqual(Rig(1));

// export const test$chain$1 = Lef('').chain((a: boolean) => a ? Lef('') : Rig(1));
// export const test$chain$2 = Rig(true).chain((a: boolean) => a ? Lef('') : Rig(1));

// export const test$ap$1 = Lef('').ap(Lef(''));
// export const test$ap$2 = Lef('').ap(Rig((a: number) => a > 0));
// export const test$ap$3 = Rig(1).ap(Lef(''));
// export const test$ap$4 = Rig(1).ap(Rig((a: number) => a > 0));

// export const test$orElse1 = Lef('').orElse(() => Lef(''));
// export const test$orElse2 = Lef('').orElse(() => Rig(1));
// export const test$orElse3 = Rig(1).orElse(() => Lef(''));
// export const test$orElse4 = Rig(1).orElse(() => Rig(1));

// export const test$pipe$1 = Rig((a: number) => (b: string) => (c: boolean) => c ? b : a * 2 + '')
//     .pipe(Lef(1))
//     .pipe(Rig(''))
//     .pipe(Lef(1))
//     ;
