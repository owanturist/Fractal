import {
    WhenNever,
    Cata,
    identity
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

export namespace Either {
    /**
     * Pattern for matching the `Either` variants.
     */
    export type Pattern<E, T, R> = Cata<{
        Left(error: E): R;
        Right(value: T): R;
    }>;
}

/**
 * A data structure that models the result of operations that may fail.
 * A `Either` helps with representing errors and propagating them,
 * giving users a more controllable form of sequencing operations
 * than that offered by constructs like `try/catch`.
 */
export abstract class Either<E, T> {
    /**
     * Represents a `Either` containing the failure `error`.
     *
     * @param error
     */
    public static Left<E>(error: E): Either<E, never> {
        return new Variants.Left(error);
    }

    /**
     * Represents a `Either` containing the successful `value`.
     *
     * @param value
     */
    public static Right<T>(value: T): Either<never, T> {
        return new Variants.Right(value);
    }

    /**
     * Converts nullable `value` into `Either`.
     * `null` and `undefined` become `Left(error)` otherwise `Right(value)`
     *
     * @param error Failure error.
     * @param value Nullable value.
     *
     * @example
     * fromNullable('Error', null)                          // Left('Error')
     * fromNullable('undefined', JSON.stringify(undefined)) // Left('undefined')
     * fromNullable('undefined', JSON.stringify('valid'))   // Right('"valid"')
     */
    public static fromNullable<E, T>(
        error: E,
        value: T | null | undefined
    ): Either<E, T extends null | undefined ? never : T> {
        return value == null
            ? Left(error)
            : Right(value as T extends null | undefined ? never : T);
    }

    /**
     * Converts `Maybe` to `Either`.
     * `Nothing` becomes `Left(error)`, `Just(value)` becomes `Right(value)`.
     *
     * @param error  Failure error.
     * @param either Converted `Either`.
     *
     * @example
     * fromEither('error', Nothing) // Left('error')
     * fromEither(Just(42))         // Right(42)
     */
    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.fold((): Either<E, T> => Left(error), Right);
    }

    /**
     * Eliminate `Either` when error and success have been mapped to the same type.
     *
     * @param either
     *
     * @example
     * merge(Left('error'))                                    // 'error'
     * merge(Right('value'))                                   // 'value'
     * merge(Left('error').orElse(() => Right('value')))       // 'value'
     * Left('error').chain(() => Right('value')).pipe(merge)   // 'error'
     */
    public static merge<T>(either: Either<T, T>): T {
        return either.fold(identity, identity);
    }

    /**
     * Take an object of `Either`s and return a `Either` with an object of values.
     * Returns `Left` if at least one of the fields is `Left`.
     *
     * @param config Object of `Either`s.
     *
     * @example
     * props({
     *     id: Right(0),
     *     title: Left('error')
     * }) // Left('error')
     *
     * props({
     *     id: Right(0),
     *     title: Right('name')
     * }) // Right({ id: 0, title: 'name' })
     *
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

    /**
     * Take an array of `Either`s and return a `Either` with an array of values.
     * Returns `Left` if at least one of the items is `Left`.
     *
     * @param array Array of `Either`s.
     *
     * @example
     * combine([ Left('error'), Right(42) ]) // Left('error')
     * combine([ Right(1), Right(2) ])       // Right([ 1, 2 ])
     */
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

    /**
     * Conveniently check if a `Either` matches as `Left`.
     *
     * @example
     * Left('error').isLeft() // true
     * Right(42).isLeft()     // false
     */
    public isLeft(): boolean {
        return false;
    }

    /**
     * Conveniently check if a `Either` matches as `Right`.
     *
     * @example
     * Left('error').isRight() // false
     * Right(42).isRight()     // true
     */
    public isRight(): boolean {
        return false;
    }

    /**
     * Check if the `Either` equals to another `Either`.
     *
     * @param another `Either` to check equality.
     *
     * @example
     * Left('error').isEqual(Left('error'))   // true
     * Left('error').isEqual(Left('message')) // false
     * Left('error').isEqual(Right(42))       // false
     * Right(42).isEqual(Left('message'))     // false
     * Right(42).isEqual(Right(13))           // false
     * Right(42).isEqual(Right(42))           // true
     */
    public abstract isEqual<E_, T_>(another: Either<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    /**
     * Transform the `Either` value with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * Left('error').map((a: number) => a > 0) // Left('error')
     * Right(3).map((a: number) => a > 0)    // Right(true)
     */
    public abstract map<R>(fn: (value: T) => R): Either<E, R>;

    /**
     * Transform the `Either` error with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * Left('error').mapLeft((a: string) => a.length) // Left(5)
     * Right(true).mapLeft((a: string) => a.length)   // Right(true)
     */
    public abstract mapLeft<S>(fn: (error: E) => S): Either<S, T>;

    /**
     * Chain together many computations that may fail.
     *
     * @param fn Chaining function.
     *
     * @example
     * Left('error').chain((a: number) => a > 0 ? Right(a < 2) : Left('negate'))  // Left('error')
     * Just(3).chain((a: number) => a > 0 ? Right(a < 2) : Left('negate'))        // Right(false)
     * Just(1).chain((a: number) => a > 0 ? Right(a < 2) : Left('negate'))        // Right(true)
     * Just(-3).chain((a: number) => a > 0 ? Right(a < 2) : Left('negate'))       // Left('negate')
     */
    public abstract chain<E_, R>(fn: (value: T) => Either<WhenNever<E, E_>, R>): Either<WhenNever<E, E_>, R>;

    /**
     * Apply a `eitherFn` function to the `Either` value.
     *
     * @param eitherFn `Either` function.
     *
     * @example
     * Left('1').ap(Left('2'))                   // Left('1')
     * Left('1').ap(Right((a: number) => a > 0)) // Left('1')
     * Right(1).ap(Left('1'))                    // Left('1')
     * Right(1).ap(Right((a: number) => a > 0))  // Right(true)
     */
    public abstract ap<E_, R = never>(
        eitherFn: Either<WhenNever<E, E_>, (value: T) => R>
    ): Either<WhenNever<E, E_>, WhenNever<R, T>>;

    /**
     * Like the boolean `||` this will return the first value that is `Right`.
     *
     * @param fn The function to return next `Right`.
     *
     * @example
     * Left('error').orElse(e => Left(e + '_'))      // Left('error_')
     * Right(1).orElse((e: string) => Left(e + '_')) // Right(1)
     * Left('error').orElse(() => Right(1))          // Right(1)
     * Right(1).orElse(() => Right(2))               // Right(1)
     */
    public abstract orElse<E_, T_>(
        fn: (error: WhenNever<E, E_>) => Either<WhenNever<E, E_>, WhenNever<T, T_>>
    ): Either<WhenNever<E, E_>, WhenNever<T, T_>>;

    /**
     * Provide a `default` value, turning an dangerous value into a normal value.
     *
     * @param defaults The default `T`.
     *
     * @example
     * Left('error').getOrElse(42) // 42
     * Right(13).getOrElse(42)     // 13
     */
    public abstract getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

    /**
     * Transform both the `Either` value and error with the given functions.
     *
     * @param onRight Error transforming function.
     * @param onLeft  Value transforming function.
     *
     * @example
     * Left('error').mapBoth((a: number) => a > 0, (a: string) => a.length) // Left(5)
     * Right(3).mapBoth((a: number) => a > 0, (a: string) => a.length)      // Right(true)
     */
    public mapBoth<S, R>(onLeft: (error: E) => S, onRight: (value: T) => R): Either<S, R> {
        return this.map(onRight).mapLeft(onLeft);
    }

    /**
     * Swaps value and error.
     *
     * @example
     * Left('error').swap() // Right('error')
     * Right(1).swap()      // Left(1)
     */
    public swap(): Either<T, E> {
        return this.fold(
            Right as (value: E) => Either<T, E>,
            Left as (error: T) => Either<T, E>
        );
    }

    /**
     * Turn a `Either` to an `T`, by applying the conversion function specified to the `E`.
     *
     * @param fn Conversion function.
     *
     * @example
     * Left('error').extract((e: string) => e.length) // 5
     * Right(0).extract((e: string) => e.length)      // 0
     */
    public extract<T_>(fn: (error: E) => WhenNever<T, T_>): WhenNever<T, T_> {
        return this.fold(fn, identity as (value: T) => WhenNever<T, T_>);
    }

    /**
     * Fold the current `Either` according variant.
     *
     * @param onLeft  The function calls on the `Left` case.
     * @param onRight The function calls on the `Right` case.
     *
     * @example
     * Left('error').fold((e: string) => e === 'err', (a: number) => a > 0) // false
     * Right(3).fold((e: string) => e === 'err', (a: number) => a > 0)      // true
     */
    public fold<R>(onLeft: (error: E) => R, onRight: (value: T) => R): R {
        return this.cata({
            Left: onLeft,
            Right: onRight
        });
    }

    /**
     * Match the current `Either` to provided pattern.
     *
     * @param pattern Pattern matching.
     *
     * @example
     * Left('error').cata({
     *     Left: (e: string) => e === 'err'
     *     Right: (a: number) => a > 0
     * }) // false
     *
     * Right(3).cata({
     *     Left: (e: string) => e === 'err'
     *     Right: (a: number) => a > 0
     * }) // true
     */
    public cata<R>(pattern: Pattern<E, T, R>): R {
        return (pattern._ as () => R)();
    }

    /**
     * Apply the current `Either` to the predicate function.
     * Could be usefull to make code more "linear".
     *
     * @param fn Predicate function.
     *
     * @example
     * const helperFunction = (validatedNumber: Either<string, number>): number => {
     *     return validatedNumber
     *         .chain((a: number) => a < 100 ? Right(a) : Left('The number is too big'))
     *         .map((a: number) => a * a)
     *         .getOrElse(100)
     * };
     *
     * Right(42)
     *     .chain((a: number) => a > 0 ? Right(42 / 2) : Left('The number is negative'))
     *     .pipe(helperFunction)
     *     .toFixed(2)
     *
     * // equals to
     *
     * helperFunction(
     *     Right(42).chain((a: number) => a > 0 ? Right(42 / 2) : Left('The number is negative'))
     * ).toFixed(2)
     */
    public pipe<R>(fn: (that: Either<E, T>) => R): R {
        return fn(this);
    }

    /**
     * Convert to `Maybe`.
     *
     * @example
     * Left('error').toMaybe() // Nothing
     * Right(42).toMaybe()     // Just(42)
     */
    public toMaybe(): Maybe<T> {
        return this.map(Just).getOrElse(Nothing);
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

        public orElse<E_, T>(
            fn: (error: WhenNever<E, E_>) => Either<WhenNever<E, E_>, T>
        ): Either<WhenNever<E, E_>, T> {
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

        public ap<R>(eitherFn: Either<never, (value: T) => R>): Either<never, WhenNever<R, T>> {
            return eitherFn.map((fn: (value: T) => R) => fn(this.value)) as Either<never, WhenNever<R, T>>;
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

/**
 * @alias `Either.Pattern`
 */
export type Pattern<E, T, R> = Either.Pattern<E, T, R>;

/**
 * @alias `Either.Left`
 */
export const Left = Either.Left;

/**
 * @alias `Either.Right`
 */
export const Right = Either.Right;

/**
 * @alias `Either.fromNullable`
 */
export const fromNullable = Either.fromNullable;

/**
 * @alias `Either.fromMaybe`
 */
export const fromMaybe = Either.fromMaybe;

/**
 * @alias `Either.mergeght`
 */
export const merge = Either.merge;

/**
 * @alias `Either.propsght`
 */
export const props = Either.props;

/**
 * @alias `Either.combine`
 */
export const combine = Either.combine;

/**
 * @alias `Either`
 */
export default Either;
