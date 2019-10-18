import {
    WhenNever
} from '../Basics';
import Maybe, { Nothing, Just } from 'Maybe';

import {
    RemoteData as IRemoteData,
    Pattern
} from './index';

abstract class RemoteData<E, T> implements IRemoteData<E, T> {
    public isNotAsked(): boolean {
        return false;
    }

    public isLoading(): boolean {
        return false;
    }

    public isFailure(): boolean {
        return false;
    }

    public isSucceed(): boolean {
        return false;
    }

    public abstract isEqual<E_, T_>(another: IRemoteData<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    public swap(): IRemoteData<T, E> {
        return this as unknown as IRemoteData<T, E>;
    }

    public map<R>(_fn: (value: T) => R): IRemoteData<E, R> {
        return this as unknown as IRemoteData<E, R>;
    }

    public mapFailure<S>(_fn: (error: E) => S): IRemoteData<S, T> {
        return this as unknown as IRemoteData<S, T>;
    }

    public mapBoth<S, R>(onFailure: (error: E) => S, onSucceed: (value: T) => R): IRemoteData<S, R> {
        return this.mapFailure(onFailure).map(onSucceed);
    }

    public chain<E_, R>(_fn: (value: T) => IRemoteData<WhenNever<E, E_>, R>): IRemoteData<WhenNever<E, E_>, R> {
        return this as unknown as IRemoteData<WhenNever<E, E_>, R>;
    }

    public orElse<E_, T_>(
        fn: () => IRemoteData<WhenNever<E, E_>, WhenNever<T, T_>>
    ): IRemoteData<WhenNever<E, E_>, WhenNever<T, T_>> {
        return fn();
    }

    public getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_> {
        return defaults;
    }

    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public toMaybe(): Maybe<T> {
        return Nothing;
    }

    public tap<R>(fn: (that: IRemoteData<E, T>) => R): R {
        return fn(this);
    }
}

export const NotAsked = new class NotAsked extends RemoteData<never, never> {
    public isNotAsked(): boolean {
        return true;
    }

    public isEqual(another: IRemoteData<never, never>): boolean {
        return another.isNotAsked();
    }

    public cata<R>(pattern: Pattern<never, never, R>): R {
        return typeof pattern.NotAsked === 'function'
            ? pattern.NotAsked()
            : (pattern._ as () => R)();
    }
}();

export const Loading = new class Loading extends RemoteData<never, never> {
    public isLoading(): boolean {
        return true;
    }

    public isEqual(another: IRemoteData<never, never>): boolean {
        return another.isLoading();
    }

    public cata<R>(pattern: Pattern<never, never, R>): R {
        return typeof pattern.Loading === 'function'
            ? pattern.Loading()
            : (pattern._ as () => R)();
    }
}();

export class Failure<E> extends RemoteData<E, never> {
    public constructor(private readonly error: E) {
        super();
    }

    public isFailure(): boolean {
        return true;
    }

    public isEqual<E_>(another: IRemoteData<WhenNever<E, E_>, never>): boolean {
        return another.cata({
            Failure: (error: WhenNever<E, E_>) => this.error === error,

            _: () => false
        });
    }

    public swap(): IRemoteData<never, E> {
        return new Succeed(this.error);
    }

    public mapFailure<S>(fn: (error: E) => S): IRemoteData<S, never> {
        return new Failure(fn(this.error));
    }

    public cata<R>(pattern: Pattern<E, never, R>): R {
        return typeof pattern.Failure === 'function'
            ? pattern.Failure(this.error)
            : (pattern._ as () => R)();
    }
}

export class Succeed<T> extends RemoteData<never, T> {
    public constructor(private readonly value: T) {
        super();
    }

    public isSucceed(): boolean {
        return true;
    }

    public isEqual<T_>(another: IRemoteData<never, WhenNever<T, T_>>): boolean {
        return another.cata({
            Succeed: (value: WhenNever<T, T_>) => this.value === value,

            _: () => false
        });
    }

    public swap(): IRemoteData<T, never> {
        return new Failure(this.value);
    }

    public map<R>(fn: (value: T) => R): IRemoteData<never, R> {
        return new Succeed(fn(this.value));
    }

    public chain<E_, R>(fn: (value: T) => IRemoteData<E_, R>): IRemoteData<E_, R> {
        return fn(this.value);
    }

    public orElse<T_>(): IRemoteData<never, WhenNever<T, T_>> {
        return this as unknown as IRemoteData<never, WhenNever<T, T_>>;
    }

    public getOrElse<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public cata<R>(pattern: Pattern<never, T, R>): R {
        return typeof pattern.Succeed === 'function'
            ? pattern.Succeed(this.value)
            : (pattern._ as () => R)();
    }

    public toMaybe(): Maybe<T> {
        return Just(this.value);
    }
}
