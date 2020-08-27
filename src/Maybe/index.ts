import {
    WhenNever,
    Cata,
    identity
} from '../Basics';
import Either from '../Either';
import * as _ from './Maybe';

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
     * ```typescript
     * Nothing.isNothing()  // true
     * Just(42).isNothing() // false
     * ```
     */
    isNothing(): boolean;

    /**
     * Conveniently check if a `Maybe` matches `Just<any>`.
     *
     * @example
     * ```typescript
     * Nothing.isJust()  // false
     * Just(42).isJust() // true
     * ```
     */
    isJust(): boolean;

    /**
     * Check if the `Maybe` equals to another `Maybe`.
     *
     * @param another `Maybe` to check equality.
     *
     * @example
     * ```typescript
     * Nothing.isEqual(Nothing)   // true
     * Nothing.isEqual(Just(42))  // false
     * Just(42).isEqual(Nothing)  // false
     * Just(42).isEqual(Just(13)) // false
     * Just(42).isEqual(Just(42)) // true
     * ```
     */
    isEqual<T_>(another: Maybe<WhenNever<T, T_>>): boolean;

    /**
     * Transform the `Maybe` value with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * ```typescript
     * Nothing.map((a: number) => a * 2) // Nothing
     * Just(3).map((a: number) => a * 2) // Just(6)
     * ```
     */
    map<R>(fn: (value: T) => R): Maybe<R>;

    /**
     * Chain together many computations that may fail.
     *
     * @param fn Chaining function.
     *
     * @example
     * ```typescript
     * Nothing.chain((a: number) => a > 0 ? Just(a * 2) : Nothing)  // Nothing
     * Just(3).chain((a: number) => a > 0 ? Just(a * 2) : Nothing)  // Just(6)
     * Just(-3).chain((a: number) => a > 0 ? Just(a * 2) : Nothing) // Nothing
     * ```
     */
    chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    /**
     * Transorm the `Maybe` into Nothing when filter returns `false`
     * otherwise keep the original `Maybe`.
     *
     * @param fn Filter function.
     *
     * @example
     * ```typescript
     * Nothing.filter((a: number) => a > 0)   // Nothing
     * Just(42).filter((a: number) => a > 0)  // Just(42)
     * Just(-42).filter((a: number) => a > 0) // Nothing
     * ```
     */
    filter<T_>(fn: (value: WhenNever<T, T_>) => boolean): Maybe<WhenNever<T, T_>>;

    /**
     * Like the boolean `||` this will return the first value that is `Just`.
     *
     * @param fn The function to return next `Maybe`.
     *
     * @example
     * ```typescript
     * Nothing.orElse(() => Nothing)   // Nothing
     * Nothing.orElse(() => Just(42))  // Just(42)
     * Just(13).orElse(() => Nothing)  // Just(13)
     * Just(13).orElse(() => Just(42)) // Just(13)
     * ```
     */
    orElse<T_>(fn: () => Maybe<WhenNever<T, T_>>): Maybe<WhenNever<T, T_>>;

    /**
     * Provide a `default` value, turning an optional value into a normal value.
     *
     * @param defaults The default `T`.
     *
     * @example
     * ```typescript
     * Nothing.getOrElse(42)  // 42
     * Just(13).getOrElse(42) // 13
     * ```
     */
    getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

    /**
     * Fold the current `Maybe` according variant.
     *
     * @param onNothing The function calls in `Nothing` case.
     * @param onJust    The function calls in `Just` case.
     *
     * @example
     * ```typescript
     * Nothing.fold(() => 0, (a: number) => a * 2) // 0
     * Just(3).fold(() => 0, (a: number) => a * 2) // 6
     * ```
     */
    fold<R>(onNothing: () => R, onJust: (value: T) => R): R;

    /**
     * Match the current `Maybe` to provided pattern.
     *
     * @param pattern Pattern matching.
     *
     * @example
     * ```typescript
     * Nothing.cata({
     *     Nothing: () => 0,
     *     Just: (a: number) => a * 2
     * }) // 0
     *
     * Just(3).cata({
     *     Nothing: () => 0,
     *     Just: (a: number) => a * 2
     * }) // 6
     * ```
     */
    cata<R>(pattern: Pattern<T, R>): R;

    /**
     * Convert to `Either`.
     *
     * @param error `Left` error when `Nothing`.
     *
     * @example
     * ```typescript
     * Nothing.toEither('error')  // Left('error')
     * Just(42).toEither('error') // Right(42)
     * ```
     */
    toEither<E>(error: E): Either<E, T>;

    /**
     * Apply the current `Maybe` to the predicate function.
     * Could be usefull to make code more "linear".
     *
     * @param fn Predicate function.
     *
     * @example
     * ```typescript
     * const helperFunction = (maybeNumber: Maybe<number>): number => {
     *     return maybeNumber
     *         .chain((a: number) => a < 100 ? Just(a) : Nothing)
     *         .map((a: number) => a * a)
     *         .getOrElse(100)
     * };
     *
     * Just(42)
     *     .chain((a: number) => a > 0 ? Just(42 / 2) : Nothing)
     *     .tap(helperFunction)
     *     .toFixed(2)
     *
     * // equals to
     *
     * helperFunction(
     *     Just(42).chain((a: number) => a > 0 ? Just(42 / 2) : Nothing)
     * ).toFixed(2)
     * ```
     */
    tap<R>(fn: (that: Maybe<T>) => R): R;
}

export namespace Maybe {
    /**
     * Pattern for matching the `Maybe` variants.
     */
    export type Pattern<T, R> = Cata<{
        Nothing(): R;
        Just(value: T): R;
    }>;

    /**
     * Represents a `Maybe` containing no value.
     */
    export const Nothing: Maybe<never> = _.Nothing;

    /**
     * Constructs a `Maybe` containing the `value`.
     *
     * @param value The `Maybe` value.
     */
    export const Just = <T>(value: T): Maybe<T> => new _.Just(value);

    /**
     * Converts nullable `value` into `Maybe`.
     * `null` and `undefined` become `Nothing` otherwise `Just(value)`
     *
     * @param value Nullable value.
     *
     * @example
     * ```typescript
     * fromNullable(null)                   // Nothing
     * fromNullable([ '0', '1', '2' ][ 3 ]) // Nothing
     * fromNullable([ '0', '1', '2' ][ 0 ]) // Just('0')
     * ```
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
     * ```typescript
     * fromEither(Left('error')) // Nothing
     * fromEither(Right(42))     // Just(42)
     * ```
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
     * ```typescript
     * join(Nothing)        // Nothing
     * join(Just(Nothing))  // Nothing
     * join(Just(Just(42))) // Just(42)
     *
     * Nothing.tap(join)              // Nothing
     * Just(42).tap(Just).tap(join) // Just(42)
     * ```
     */
    export const join = <T>(maybe: Maybe<Maybe<T>>): Maybe<T> => maybe.chain(identity);

    /**
     * Take an object of `Maybe`s and return a `Maybe` with an object of values.
     * Returns `Nothing` if at least one of the fields is `Nothing`.
     *
     * @param object Object of `Maybe`s.
     *
     * @example
     * ```typescript
     * shape({
     *     id: Just(0),
     *     title: Nothing
     * }) // Nothing
     *
     * shape({
     *     id: Just(0),
     *     title: Just('name')
     * }) // Just({ id: 0, title: 'name' })
     * ```
     */
    export const shape = <O extends {}>(object: {[ K in keyof O ]: Maybe<O[ K ]>}): Maybe<O> => {
        const acc: O = {} as O;

        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const maybe = object[ key ];

                if (maybe.isNothing()) {
                    return maybe as Maybe<never>;
                }

                acc[ key ] = maybe.getOrElse(null as never /* don't use this hack */);
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
     * ```typescript
     * combine([ Nothing, Just(42) ]) // Nothing
     * combine([ Just(1), Just(2) ])  // Just([ 1, 2 ])
     * ```
     */
    export const combine = <T>(array: Array<Maybe<T>>): Maybe<Array<unknown extends T ? never : T>> => {
        const acc: Array<T> = [];

        for (const maybe of array) {
            if (maybe.isNothing()) {
                return maybe as Maybe<never>;
            }

            acc.push(maybe.getOrElse(null as never /* don't use this hack */));
        }

        return Just((acc as Array<unknown extends T ? never : T>));
    };

    /**
     * Convert a list of `Maybe`s a to a list of a only for the values different from `Nothing`.
     *
     * @param array Array of `Maybe`s.
     *
     * @example
     * ```typescript
     * values([ Nothing, Just(42), Just(0) ]) // [ 42, 0 ]
     * values([ Just(1), Just(2), Nothing ])  // [ 1, 2 ]
     * ```
     */
    export const values = <T>(array: Array<Maybe<T>>): Array<unknown extends T ? never : T> => {
        const acc: Array<T> = [];

        for (const item of array) {
            if (item.isJust()) {
                acc.push(item.getOrElse(null as never /* don't use this hack */));
            }
        }

        return acc as Array<unknown extends T ? never : T>;
    };
}

/**
 * @alias {@linkcode Maybe.Pattern}
 */
export type Pattern<T, R> = Maybe.Pattern<T, R>;

/**
 * @alias {@linkcode Maybe.Nothing}
 */
export const Nothing = Maybe.Nothing;

/**
 * @alias {@linkcode Maybe.Just}
 */
export const Just = Maybe.Just;

/**
 * @alias {@linkcode Maybe.fromNullable}
 */
export const fromNullable = Maybe.fromNullable;

/**
 * @alias {@linkcode Maybe.fromEither}
 */
export const fromEither = Maybe.fromEither;

/**
 * @alias {@linkcode Maybe.join}
 */
export const join = Maybe.join;

/**
 * @alias {@linkcode Maybe.shape}
 */
export const shape = Maybe.shape;

/**
 * @alias {@linkcode Maybe.combine}
 */
export const combine = Maybe.combine;

/**
 * @alias {@linkcode Maybe.values}
 */
export const values = Maybe.values;

export default Maybe;
