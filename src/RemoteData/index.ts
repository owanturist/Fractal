import {
    Cata,
    WhenNever
} from '../Basics';
import Maybe from '../Maybe';
import Either from '../Either';
import * as _ from './RemoteData';

export interface RemoteData<E, T> {
    isNotAsked(): boolean;

    isLoading(): boolean;

    isFailure(): boolean;

    isSucceed(): boolean;

    isEqual<E_, T_>(another: RemoteData<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    swap(): RemoteData<T, E>;

    map<R>(fn: (value: T) => R): RemoteData<E, R>;

    mapFailure<S>(fn: (error: E) => S): RemoteData<S, T>;

    mapBoth<S, R>(onFailure: (error: E) => S, onSucceed: (value: T) => R): RemoteData<S, R>;

    chain<E_, R>(fn: (value: T) => RemoteData<WhenNever<E, E_>, R>): RemoteData<WhenNever<E, E_>, R>;

    orElse<E_, T_>(
        fn: () => RemoteData<WhenNever<E, E_>, WhenNever<T, T_>>
    ): RemoteData<WhenNever<E, E_>, WhenNever<T, T_>>;

    getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

    cata<R>(pattern: Pattern<E, T, R>): R;

    toMaybe(): Maybe<T>;

    tap<R>(fn: (that: RemoteData<E, T>) => R): R;
}

export namespace RemoteData {
    export type Pattern<E, T, R> = Cata<{
        NotAsked(): R;
        Loading(): R;
        Failure(error: E): R;
        Succeed(value: T): R;
    }>;

    export const NotAsked: RemoteData<never, never> = _.NotAsked;

    export const Loading: RemoteData<never, never> = _.Loading;

    export const Failure = <E>(error: E): RemoteData<E, never> => new _.Failure(error);

    export const Succeed = <T>(value: T): RemoteData<never, T> => new _.Succeed(value);

    export const fromMaybe = <E, T>(error: E, maybe: Maybe<T>): RemoteData<E, T> => {
        return maybe.fold((): RemoteData<E, T> => Failure(error), Succeed);
    };

    export const fromEither = <E, T>(either: Either<E, T>): RemoteData<E, T> => {
        return either.fold(Failure, Succeed as (value: T) => RemoteData<E, T>);
    };

    export const shape = <E, O extends {}>(
        object: {[ K in keyof O ]: RemoteData<E, O[ K ]> }
    ): RemoteData<E, O> => {
        const acc: O = {} as O;

        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const value = object[ key ];

                if (!value.isSucceed()) {
                    return value as RemoteData<E, never>;
                }

                acc[ key ] = value.getOrElse(null as never /* don't use this hack */);
            }
        }

        return RemoteData.Succeed(acc);
    };

    export const combine = <E, T>(array: Array<RemoteData<E, T>>): RemoteData<
        unknown extends E ? never : E,
        Array<unknown extends T ? never : T>
    > => {
        const acc: Array<T> = [];

        for (const item of array) {
            if (!item.isSucceed()) {
                return item as RemoteData<unknown extends E ? never : E, never>;
            }

            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }

        return RemoteData.Succeed(acc as Array<unknown extends T ? never : T>);
    };
}

/**
 * @alias `RemoteData.Pattern`
 */
export type Pattern<E, T, R> = RemoteData.Pattern<E, T, R>;

/**
 * @alias `RemoteData.NotAsked`
 */
export const NotAsked = RemoteData.NotAsked;

/**
 * @alias `RemoteData.Loading`
 */
export const Loading = RemoteData.Loading;

/**
 * @alias `RemoteData.Failure`
 */
export const Failure = RemoteData.Failure;

/**
 * @alias `RemoteData.Succeed`
 */
export const Succeed = RemoteData.Succeed;

/**
 * @alias `RemoteData.fromMaybe`
 */
export const fromMaybe = RemoteData.fromMaybe;

/**
 * @alias `RemoteData.fromEither`
 */
export const fromEither = RemoteData.fromEither;

/**
 * @alias `RemoteData.shape`
 */
export const shape = RemoteData.shape;

/**
 * @alias `RemoteData.combine`
 */
export const combine = RemoteData.combine;

export default Either;
