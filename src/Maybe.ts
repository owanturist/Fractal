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
    /**
     * Pattern for matching the `Maybe` variants.
     */
    export type Pattern<T, R> = Cata<{
        Nothing(): R;
        Just(value: T): R;
    }>;
}

/**
 * Pattern for matching the `Maybe` variants.
 */
export type Pattern<T, R> = Maybe.Pattern<T, R>;

/**
 * A data structure that models the presence or absence of a value.
 * A `Maybe` can help you with optional arguments,
 * error handling, and records with optional fields.
 */
export interface Maybe<T> {
    /**
     * Conveniently check if a `Maybe` matches `Nothing`.
     *
     * @example
     * Nothing.isNothing()  // true
     * Just(42).isNothing() // false
     */
    isNothing(): boolean;

    /**
     * Conveniently check if a `Maybe` matches `Just<any>`.
     *
     * @example
     * Nothing.isJust()  // false
     * Just(42).isJust() // true
     */
    isJust(): boolean;

    /**
     * Check if the `Maybe` equals to another `Maybe`.
     *
     * @param another `Maybe` to check equality.
     *
     * @example
     * Nothing.isEqual(Nothing)   // true
     * Nothing.isEqual(Just(42))  // false
     * Just(42).isEqual(Nothing)  // false
     * Just(42).isEqual(Just(13)) // false
     * Just(42).isEqual(Just(42)) // true
     */
    isEqual<D>(another: Maybe<WhenNever<T, D>>): boolean;

    /**
     * Transform the `Maybe` value with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * Nohting.map((a: number) => a * 2) // Nothing
     * Just(3).map((a: number) => a * 2) // Just(6)
     */
    map<R>(fn: (value: T) => R): Maybe<R>;

    /**
     * Chain together many computations that may fail.
     *
     * @param fn Chaining function.
     *
     * @example
     * Nothing.chain((a: number) => a > 0 ? Just(a * 2) : Nothing)  // Nothing
     * Just(3).chain((a: number) => a > 0 ? Just(a * 2) : Nothing)  // Just(6)
     * Just(-3).chain((a: number) => a > 0 ? Just(a * 2) : Nothing) // Nothing
     */
    chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    /**
     * Transorm the `Maybe` into Nothing when filter returns `false`
     * otherwise keep the original `Maybe`.
     *
     * @param fn Filter function.
     *
     * @example
     * Nothing.filter((a: number) => a > 0)   // Nothing
     * Just(42).filter((a: number) => a > 0)  // Just(42)
     * Just(-42).filter((a: number) => a > 0) // Nothing
     */
    filter(fn: (value: T) => boolean): Maybe<T>;

    /**
     * Apply a `maybeFn` function to the `Maybe` value.
     *
     * @param maybeFn `Maybe` function.
     *
     * @example
     * Nothing.ap(Nothing)                    // Nothing
     * Just(3).ap(Nothing)                    // Nothing
     * Nothing.ap(Just((a: number) => a * 2)) // Nothing
     * Just(3).ap(Just((a: number) => a * 2)) // Just(6)
     */
    ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

    /**
     * Apply a `maybe` value into the inner function.
     *
     * @param maybe `Maybe` value to apply.
     *
     * @example
     * Just((a: number) => (b: boolean) => b ? 0 a * s)
     *     .pipe(Just(42))
     *     .pipe(Nothing)
     *     // Nothing
     *
     * Just((a: number) => (b: boolean) => b ? 0 : a * 2)
     *     .pipe(Just(3))
     *     .pipe(Just(true))
     *     // Just(6)
     */
    pipe(maybe: Wrap<Arg<T>>): Maybe<Return<T>>;

    /**
     * Like the boolean `||` this will return the first value that is `Just`.
     *
     * @param fn The function to return next `Maybe`.
     *
     * @example
     * Nothing.orElse(() => Nothing)   // Nothing
     * Nothing.orElse(() => Just(42))  // Just(42)
     * Just(13).orElse(() => Nothing)  // Just(13)
     * Just(13).orElse(() => Just(42)) // Just(13)
     */
    orElse<D>(fn: () => Maybe<WhenNever<T, D>>): Maybe<WhenNever<T, D>>;

    /**
     * Provide a `default` value, turning an optional value into a normal value.
     *
     * @param defaults The default `T`.
     *
     * @example
     * Nothing.getOrElse(42)  // 42
     * Just(13).getOrElse(42) // 13
     */
    getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D>;

    /**
     * Fold the current `Maybe` according variant.
     *
     * @param onNothing The function calls in `Nothing` case.
     * @param onJust    The function calls in `Just` case.
     *
     * @example
     * Nothing.fold(() => 0, (a: number) => a * 2) // 0
     * Just(3).fold(() => 0, (a: number) => a * 2) // 6
     */
    fold<R>(onNothing: () => R, onJust: (value: T) => R): R;

    /**
     * Match the current `Maybe` to provided pattern.
     *
     * @param pattern Pattern matching.
     *
     * @example
     * Nothing.cata({
     *     Nothing: () => 0,
     *     Just: (a: number) => a * 2
     * }) // 0
     *
     * Just(3).cata({
     *     Nothing: () => 0,
     *     Just: (a: number) => a * 2
     * }) // 6
     */
    cata<R>(pattern: Pattern<T, R>): R;

    /**
     * Apply the current `Maybe` to the predicate function.
     * Could be usefull to make code more "linear".
     *
     * @param fn Predicate function.
     *
     * @example
     * const helperFunction = (maybeNumber: Maybe<number>): number => {
     *     return maybeNumber
     *         .chain((a: number) => a < 100 ? Just(a) : Nothing)
     *         .map((a: number) => a * a)
     *         .getOrElse(100)
     * };
     *
     * Just(42)
     *     .chain((a: number) => a > 0 ? Just(42 / 2) : Nothing)
     *     .touch(helperFunction)
     *     .toFixed(2)
     *
     * // equals to
     *
     * helperFunction(
     *     Just(42).chain((a: number) => a > 0 ? Just(42 / 2) : Nothing)
     * ).toFixed(2)
     */
    touch<R>(fn: (that: Maybe<T>) => R): R;

    /**
     * Convert to `Either`.
     *
     * @param error `Left` error when `Nothing`.
     *
     * @example
     * Nothing.toEither('error')  // Left('error')
     * Just(42).toEither('error') // Right(42)
     */
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

        public filter<T>(): Maybe<T> {
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

        public touch<T, R>(fn: (that: Maybe<T>) => R): R {
            return fn(this);
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

        public filter(fn: (value: T) => boolean): Maybe<T> {
            return fn(this.value) ? this : Nothing;
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

        public touch<R>(fn: (that: Maybe<T>) => R): R {
            return fn(this);
        }

        public toEither<E>(): Either<E, T> {
            return Right(this.value);
        }
    }
}

/**
 * Represents a `Maybe` containing no value.
 */
export const Nothing: Maybe<never> = new MaybeVariants.Nohting();

/**
 * Constructs a `Maybe` containing the `value`.
 *
 * @param value The `Maybe` value.
 */
export const Just = <T>(value: T): Maybe<T> => new MaybeVariants.Just(value);

/**
 * Converts nullable `value` into `Maybe`.
 * `null` and `undefined` become `Nothing` otherwise `Just(value)`
 *
 * @param value Nullable value.
 *
 * @example
 * fromNullable(null)                   // Nothing
 * fromNullable([ '0', '1', '2' ][ 3 ]) // Nothing
 * fromNullable([ '0', '1', '2' ][ 0 ]) // Just('0')
 */
export const fromNullable = <T>(value: T | null | undefined): Maybe<T extends null | undefined ? never : T> => {
    return value == null ? Nothing : Just(value as T extends null | undefined ? never : T);
};

/**
 * Converts `Either` to `Maybe`.
 * `Left` becomes `Nothing`, `Reight(value)` becomes `Just(value)`.
 *
 * @param either Converted `Either`
 *
 * @example
 * fromEither(Left('error')) // Nothing
 * fromEither(Right(42))     // Just(42)
 */
export const fromEither = <E, T>(either: Either<E, T>): Maybe<T> => {
    return either.map(Just).getOrElse(Nothing);
};

/**
 * Flattens nested `Maybe`s.
 *
 * @param maybe `Maybe` with `Maybe` inside.
 *
 * @example
 * join(Nothing)        // Nothing
 * join(Just(Nothing))  // Nothing
 * join(Just(Just(42))) // Just(42)
 *
 * Nothing.touch(join)              // Nothing
 * Just(42).touch(Just).touch(join) // Just(42)
 */
export const join = <T>(maybe: Maybe<Maybe<T>>): Maybe<T> => {
    return maybe.chain((nested: Maybe<T>): Maybe<T> => nested);
};

/**
 * Take an object of `Maybe`s and return a `Maybe` with an object of values.
 * Returns `Nothing` if at least one of the fields is `Nothing`.
 *
 * @param config Object of `Maybe`s.
 *
 * @example
 * props({
 *     id: Just(0),
 *     title: Nothing
 * }) // Nothing
 *
 * props({
 *     id: Just(0),
 *     title: Just('name')
 * }) // Just({ id: 0, title: 'name' })
 */
export const props = <O extends object>(config: {[ K in keyof O ]: Maybe<O[ K ]>}): Maybe<O> => {
    const acc: O = {} as O;

    for (const key in config) {
        if (config.hasOwnProperty(key)) {
            if (config[ key ].isNothing()) {
                return Nothing;
            }

            acc[ key ] = config[ key ].getOrElse(null as never /* don't use this hack */);
        }
    }

    return Just(acc);
};

/**
 * Take an array of `Maybe`s and return a `Maybe` with an array of values.
 * Returns `Nothing` if at least one of the items is `Nothing`.
 *
 * @param array Array of `Maybe`s.
 *
 * @example
 * combine([ Nothing, Just(42) ]) // Nothing
 * combine([ Just(1), Just(2) ])  // Just([ 1, 2 ])
 */
export const combine = <T>(array: Array<Maybe<T>>): Maybe<Array<T>> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isNothing()) {
            return Nothing;
        }

        acc.push(item.getOrElse(null as never /* don't use this hack */));
    }

    return Just(acc);
};

/**
 * Convert a list of `Maybe`s a to a list of a only for the values different from `Nothing`.
 *
 * @param array Array of `Maybe`s.
 *
 * @example
 * combine([ Nothing, Just(42), Just(0) ]) // [ 42, 0 ]
 * combine([ Just(1), Just(2), Nothing ])  // [ 1, 2 ]
 */
export const values = <T>(array: Array<Maybe<T>>): Array<T> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isJust()) {
            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }
    }

    return acc;
};

export const Maybe = {
    Nothing,
    Just,
    fromNullable,
    fromEither,
    join,
    props,
    combine,
    values
};

export default Maybe;
