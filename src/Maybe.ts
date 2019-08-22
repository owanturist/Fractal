import {
    WhenNever,
    Cata,
    identity
} from './Basics';
import Either, { Left, Right } from './Either';

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
 * A data structure that models the presence or absence of a value.
 * A `Maybe` can help you with optional arguments,
 * error handling, and records with optional fields.
 */
export abstract class Maybe<T> {
    /**
     * Represents a `Maybe` containing no value.
     */
    public static Nothing: Maybe<never>;

    /**
     * Constructs a `Maybe` containing the `value`.
     *
     * @param value The `Maybe` value.
     */
    public static Just<T>(value: T): Maybe<T> {
        return new Variants.Just(value);
    }

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
    public static fromNullable<T>(value: T | null | undefined): Maybe<T extends null | undefined ? never : T> {
        return value == null ? Nothing : Just(value as T extends null | undefined ? never : T);
    }


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
    public static fromEither<E, T>(either: Either<E, T>): Maybe<T> {
        return either.map(Just).getOrElse(Nothing);
    }

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
     * Nothing.pipe(join)              // Nothing
     * Just(42).pipe(Just).pipe(join) // Just(42)
     */
    public static join<T>(maybe: Maybe<Maybe<T>>): Maybe<T> {
        return maybe.chain(identity);
    }

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
    public static props<O extends {}>(config: {[ K in keyof O ]: Maybe<O[ K ]>}): Maybe<O> {
        const acc: O = {} as O;

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[ key ];

                if (value.isNothing()) {
                    return value as Maybe<never>;
                }

                acc[ key ] = value.getOrElse(null as never /* don't use this hack */);
            }
        }

        return Just(acc);
    }

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
    public static combine<T>(array: Array<Maybe<T>>): Maybe<Array<unknown extends T ? never : T>> {
        const acc: Array<T> = [];

        for (const item of array) {
            if (item.isNothing()) {
                return item as Maybe<never>;
            }

            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }

        return Just((acc as Array<unknown extends T ? never : T>));
    }

    /**
     * Convert a list of `Maybe`s a to a list of a only for the values different from `Nothing`.
     *
     * @param array Array of `Maybe`s.
     *
     * @example
     * values([ Nothing, Just(42), Just(0) ]) // [ 42, 0 ]
     * values([ Just(1), Just(2), Nothing ])  // [ 1, 2 ]
     */
    public static values<T>(array: Array<Maybe<T>>): Array<unknown extends T ? never : T> {
        const acc: Array<T> = [];

        for (const item of array) {
            if (item.isJust()) {
                acc.push(item.getOrElse(null as never /* don't use this hack */));
            }
        }

        return acc as Array<unknown extends T ? never : T>;
    }

    /**
     * Conveniently check if a `Maybe` matches `Nothing`.
     *
     * @example
     * Nothing.isNothing()  // true
     * Just(42).isNothing() // false
     */
    public isNothing(): boolean {
        return false;
    }

    /**
     * Conveniently check if a `Maybe` matches `Just<any>`.
     *
     * @example
     * Nothing.isJust()  // false
     * Just(42).isJust() // true
     */
    public isJust(): boolean {
        return false;
    }

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
    public abstract isEqual<T_>(another: Maybe<WhenNever<T, T_>>): boolean;

    /**
     * Transform the `Maybe` value with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * Nothing.map((a: number) => a * 2) // Nothing
     * Just(3).map((a: number) => a * 2) // Just(6)
     */
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

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
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

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
    public abstract filter<T_>(fn: (value: WhenNever<T, T_>) => boolean): Maybe<WhenNever<T, T_>>;

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
    public abstract ap<R = never>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

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
    public abstract orElse<T_>(fn: () => Maybe<WhenNever<T, T_>>): Maybe<WhenNever<T, T_>>;

    /**
     * Provide a `default` value, turning an optional value into a normal value.
     *
     * @param defaults The default `T`.
     *
     * @example
     * Nothing.getOrElse(42)  // 42
     * Just(13).getOrElse(42) // 13
     */
    public abstract getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

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
    public fold<R>(onNothing: () => R, onJust: (value: T) => R): R {
        return this.cata({
            Nothing: onNothing,
            Just: onJust
        });
    }

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
    public cata<R>(pattern: Pattern<T, R>): R {
        return (pattern._ as () => R)();
    }

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
     *     .pipe(helperFunction)
     *     .toFixed(2)
     *
     * // equals to
     *
     * helperFunction(
     *     Just(42).chain((a: number) => a > 0 ? Just(42 / 2) : Nothing)
     * ).toFixed(2)
     */
    public pipe<R>(fn: (that: Maybe<T>) => R): R {
        return fn(this);
    }

    /**
     * Convert to `Either`.
     *
     * @param error `Left` error when `Nothing`.
     *
     * @example
     * Nothing.toEither('error')  // Left('error')
     * Just(42).toEither('error') // Right(42)
     */
    public toEither<E>(error: E): Either<E, T> {
        return this.cata({
            Nothing: () => Left(error),
            Just: Right as (value: T) => Either<E, T>
        });
    }
}

namespace Variants {
    export class Nothing extends Maybe<never> {
        public isNothing(): boolean {
            return true;
        }

        public isEqual(another: Maybe<never>): boolean {
            return this === another || another.isNothing();
        }

        public map(): Maybe<never> {
            return this;
        }

        public chain(): Maybe<never> {
            return this;
        }

        public filter(): Maybe<never> {
            return this;
        }

        public ap(): Maybe<never> {
            return this;
        }

        public orElse<T>(fn: () => Maybe<T>): Maybe<T> {
            return fn();
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public cata<R>(pattern: Pattern<never, R>): R {
            if (typeof pattern.Nothing === 'function') {
                return pattern.Nothing();
            }

            return super.cata(pattern);
        }
    }

    Maybe.Nothing = new Nothing();

    export class Just<T> extends Maybe<T> {
        public constructor(private readonly value: T) {
            super();
        }

        public isJust(): boolean {
            return true;
        }

        public isEqual<T_>(another: Maybe<WhenNever<T, T_>>): boolean {
            return another
                .map((value: WhenNever<T, T_>): boolean => this.value === value)
                .getOrElse(false);
        }

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(fn(this.value));
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public filter<T_>(fn: (value: WhenNever<T, T_>) => boolean): Maybe<WhenNever<T, T_>> {
            return (fn(this.value as WhenNever<T, T_>) ? this : Maybe.Nothing) as Maybe<WhenNever<T, T_>>;
        }

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.map((fn: (value: T) => R) => fn(this.value));
        }

        public orElse<T_>(): Maybe<WhenNever<T, T_>> {
            return this as unknown as Maybe<WhenNever<T, T_>>;
        }

        public getOrElse<T_>(): WhenNever<T, T_> {
            return this.value as WhenNever<T, T_>;
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
    }
}

/**
 * @alias `Maybe.Pattern`
 */
export type Pattern<T, R> = Maybe.Pattern<T, R>;

/**
 * @alias `Maybe.Nothing`
 */
export const Nothing: Maybe<never> = Maybe.Nothing;

/**
 * @alias `Maybe.Just`
 */
export const Just = Maybe.Just;

/**
 * @alias `Maybe.fromNullable`
 */
export const fromNullable = Maybe.fromNullable;

/**
 * @alias `Maybe.fromEither`
 */
export const fromEither = Maybe.fromEither;

/**
 * @alias `Maybe.join`
 */
export const join = Maybe.join;

/**
 * @alias `Maybe.props`
 */
export const props = Maybe.props;

/**
 * @alias `Maybe.combine`
 */
export const combine = Maybe.combine;

/**
 * @alias `Maybe.values`
 */
export const values = Maybe.values;

/**
 * @alias `Maybe`
 */
export default Maybe;
