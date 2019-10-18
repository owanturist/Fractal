import {
    Cata,
    WhenNever
} from '../Basics';
import Maybe from '../Maybe';
import Either from '../Either';
import {
    RemoteData
} from './index';
import * as _ from './RemoteData';

export interface Optional<E, T> extends RemoteData<E, T> {
    isNotAsked(): boolean;

    isEqual<E_, T_>(another: Optional<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    swap(): Optional<T, E>;

    map<R>(fn: (value: T) => R): Optional<E, R>;

    mapFailure<S>(fn: (error: E) => S): Optional<S, T>;

    mapBoth<S, R>(onFailure: (error: E) => S, onSucceed: (value: T) => R): Optional<S, R>;

    chain<E_, R>(fn: (value: T) => Optional<WhenNever<E, E_>, R>): Optional<WhenNever<E, E_>, R>;

    orElse<E_, T_>(
        fn: () => Optional<WhenNever<E, E_>, WhenNever<T, T_>>
    ): Optional<WhenNever<E, E_>, WhenNever<T, T_>>;

    cata<R>(pattern: Optional.Pattern<E, T, R>): R;

    tap<R>(fn: (that: Optional<E, T>) => R): R;
}

export namespace Optional {
    export type Pattern<E, T, R> = Cata<{
        NotAsked(): R;
        Loading(): R;
        Failure(error: E): R;
        Succeed(value: T): R;
    }>;

    export const NotAsked: Optional<never, never> = _.NotAsked;

    export const Loading: Optional<never, never> = _.Loading;

    export const Failure = <E>(error: E): Optional<E, never> => new _.Failure(error);

    export const Succeed = <T>(value: T): Optional<never, T> => new _.Succeed(value);

    export const fromMaybe = <E, T>(error: E, maybe: Maybe<T>): Optional<E, T> => {
        return maybe.fold((): Optional<E, T> => Failure(error), Succeed);
    };

    export const fromEither = <E, T>(either: Either<E, T>): Optional<E, T> => {
        return either.fold(Failure, Succeed as (value: T) => Optional<E, T>);
    };

    export const shape = <E, O extends {}>(
        object: {[ K in keyof O ]: Optional<E, O[ K ]> }
    ): Optional<E, O> => {
        const acc: O = {} as O;

        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const value = object[ key ];

                if (!value.isSucceed()) {
                    return value as Optional<E, never>;
                }

                acc[ key ] = value.getOrElse(null as never /* don't use this hack */);
            }
        }

        return Succeed(acc);
    };

    export const combine = <E, T>(array: Array<Optional<E, T>>): Optional<
        unknown extends E ? never : E,
        Array<unknown extends T ? never : T>
    > => {
        const acc: Array<T> = [];

        for (const item of array) {
            if (!item.isSucceed()) {
                return item as Optional<unknown extends E ? never : E, never>;
            }

            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }

        return Succeed(acc as Array<unknown extends T ? never : T>);
    };
}

/**
 * @alias `Optional.Pattern`
 */

export type Pattern<E, T, R> = Optional.Pattern<E, T, R>;

/**
 * @alias `Optional.NotAsked`
 */
export const NotAsked = Optional.NotAsked;

/**
 * @alias `Optional.Loading`
 */
export const Loading = Optional.Loading;

/**
 * @alias `Optional.Failure`
 */
export const Failure = Optional.Failure;

/**
 * @alias `Optional.Succeed`
 */
export const Succeed = Optional.Succeed;

/**
 * @alias `Optional.fromMaybe`
 */
export const fromMaybe = Optional.fromMaybe;

/**
 * @alias `Optional.fromEither`
 */
export const fromEither = Optional.fromEither;

/**
 * @alias `Optional.shape`
 */
export const shape = Optional.shape;

/**
 * @alias `Optional.combine`
 */
export const combine = Optional.combine;

export default Optional;
