import {
    WhenNever
} from '../Basics';
import Maybe, { Nothing, Just } from '../Maybe';

import { Optional } from './Optional';

abstract class RemoteData<E, T> implements Optional<E, T> {
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

    public abstract isEqual<E_, T_>(another: Optional<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    public swap(): Optional<T, E> {
        return this as unknown as Optional<T, E>;
    }

    public map<R>(_fn: (value: T) => R): Optional<E, R> {
        return this as unknown as Optional<E, R>;
    }

    public mapFailure<S>(_fn: (error: E) => S): Optional<S, T> {
        return this as unknown as Optional<S, T>;
    }

    public mapBoth<S, R>(onFailure: (error: E) => S, onSucceed: (value: T) => R): Optional<S, R> {
        return this.mapFailure(onFailure).map(onSucceed);
    }

    public chain<E_, R>(_fn: (value: T) => Optional<WhenNever<E, E_>, R>): Optional<WhenNever<E, E_>, R> {
        return this as unknown as Optional<WhenNever<E, E_>, R>;
    }

    public orElse<E_, T_>(
        fn: () => Optional<WhenNever<E, E_>, WhenNever<T, T_>>
    ): Optional<WhenNever<E, E_>, WhenNever<T, T_>> {
        return fn();
    }

    public getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_> {
        return defaults;
    }

    public abstract cata<R>(pattern: Optional.Pattern<E, T, R>): R;

    public toMaybe(): Maybe<T> {
        return this.map(Just).getOrElse(Nothing);
    }

    public tap<R>(fn: (that: Optional<E, T>) => R): R {
        return fn(this);
    }
}

export const NotAsked = new class NotAsked extends RemoteData<never, never> {
    public isNotAsked(): boolean {
        return true;
    }

    public isEqual(another: Optional<never, never>): boolean {
        return another.isNotAsked();
    }

    public cata<R>(pattern: Optional.Pattern<never, never, R>): R {
        return typeof pattern.NotAsked === 'function'
            ? pattern.NotAsked()
            : (pattern._ as () => R)();
    }
}();

export const Loading = new class Loading extends RemoteData<never, never> {
    public isLoading(): boolean {
        return true;
    }

    public isEqual(another: Optional<never, never>): boolean {
        return another.isLoading();
    }

    public cata<R>(pattern: Optional.Pattern<never, never, R>): R {
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

    public isEqual<E_>(another: Optional<WhenNever<E, E_>, never>): boolean {
        return this === another as Optional<E, never>
            || another.cata({
                Failure: (error: WhenNever<E, E_>) => this.error === error,

                _: () => false
            });
    }

    public swap(): Optional<never, E> {
        return new Succeed(this.error);
    }

    public mapFailure<S>(fn: (error: E) => S): Optional<S, never> {
        return new Failure(fn(this.error));
    }

    public cata<R>(pattern: Optional.Pattern<E, never, R>): R {
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

    public isEqual<T_>(another: Optional<never, WhenNever<T, T_>>): boolean {
        return this === another as Optional<never, T>
            || another.cata({
                Succeed: (value: WhenNever<T, T_>) => this.value === value,

                _: () => false
            });
    }

    public swap(): Optional<T, never> {
        return new Failure(this.value);
    }

    public map<R>(fn: (value: T) => R): Optional<never, R> {
        return new Succeed(fn(this.value));
    }

    public chain<R>(fn: (value: T) => Optional<never, R>): Optional<never, R> {
        return fn(this.value);
    }

    public orElse<T_>(): Optional<never, WhenNever<T, T_>> {
        return this as unknown as Optional<never, WhenNever<T, T_>>;
    }

    public getOrElse<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public cata<R>(pattern: Optional.Pattern<never, T, R>): R {
        return typeof pattern.Succeed === 'function'
            ? pattern.Succeed(this.value)
            : (pattern._ as () => R)();
    }
}
