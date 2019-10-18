import {
    Cata,
    WhenNever
} from '../Basics';
import Maybe from '../Maybe';
import Either from '../Either';
import _ from './Optional';

export interface RemoteData<E, T> {
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
        Loading(): R;
        Failure(error: E): R;
        Succeed(value: T): R;
    }>;

    export const Loading: RemoteData<never, never> = _.Loading;

    export const Failure: <E>(error: E) => RemoteData<E, never> = _.Failure;

    export const Succeed: <T>(value: T) => RemoteData<never, T> = _.Succeed;

    export const fromMaybe: <E, T>(error: E, maybe: Maybe<T>) => RemoteData<E, T> = _.fromMaybe;

    export const fromEither: <E, T>(either: Either<E, T>) => RemoteData<E, T> = _.fromEither;

    export const shape: <E, O extends {}>(
        object: {[ K in keyof O ]: RemoteData<E, O[ K ]> }
    ) => RemoteData<E, O> = _.shape;

    export const combine: <E, T>(array: Array<RemoteData<E, T>>) => RemoteData<
        unknown extends E ? never : E,
        Array<unknown extends T ? never : T>
    > = _.combine;

    export interface Optional<E, T> extends _<E, T> {}

    export namespace Optional {
        export type Pattern<E, T, R> = _.Pattern<E, T, R>;

        export const NotAsked = _.NotAsked;

        export const Loading = _.Loading;

        export const Failure = _.Failure;

        export const Succeed = _.Succeed;

        export const fromMaybe = _.fromMaybe;

        export const fromEither = _.fromEither;

        export const shape = _.shape;

        export const combine = _.combine;
    }
}

/**
 * @alias `RemoteData.Optional`
 */
export interface Optional<E, T> extends RemoteData.Optional<E, T> {}

/**
 * @alias `RemoteData.Optional`
 */
export namespace Optional {
    /**
     * @alias `RemoteData.Optional.Pattern`
     */

    export type Pattern<E, T, R> = RemoteData.Optional.Pattern<E, T, R>;

    /**
     * @alias `RemoteData.Optional.NotAsked`
     */
    export const NotAsked = RemoteData.Optional.NotAsked;

    /**
     * @alias `RemoteData.Optional.Loading`
     */
    export const Loading = RemoteData.Optional.Loading;

    /**
     * @alias `RemoteData.Optional.Failure`
     */
    export const Failure = RemoteData.Optional.Failure;

    /**
     * @alias `RemoteData.Optional.Succeed`
     */
    export const Succeed = RemoteData.Optional.Succeed;

    /**
     * @alias `RemoteData.Optional.fromMaybe`
     */
    export const fromMaybe = RemoteData.Optional.fromMaybe;

    /**
     * @alias `RemoteData.Optional.fromEither`
     */
    export const fromEither = RemoteData.Optional.fromEither;

    /**
     * @alias `RemoteData.Optional.shape`
     */
    export const shape = RemoteData.Optional.shape;

    /**
     * @alias `RemoteData.Optional.combine`
     */
    export const combine = RemoteData.Optional.combine;
}

/**
 * @alias `RemoteData.Pattern`
 */
export type Pattern<E, T, R> = RemoteData.Pattern<E, T, R>;

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

export default RemoteData;
