import {
    WhenNever
} from '../Basics';
import Maybe, { Nothing, Just } from '../Maybe';
import {
    Either as IEither,
    Pattern
} from './index';

abstract class Either<E, T> implements IEither<E, T> {
    public isLeft(): boolean {
        return false;
    }

    public isRight(): boolean {
        return false;
    }

    public abstract isEqual<E_, T_>(another: IEither<WhenNever<E, E_>, WhenNever<T, T_>>): boolean;

    public abstract swap(): IEither<T, E>;

    public map<R>(_fn: (value: T) => R): IEither<E, R> {
        return this as unknown as IEither<E, R>;
    }

    public mapLeft<S>(_fn: (error: E) => S): IEither<S, T> {
        return this as unknown as IEither<S, T>;
    }

    public mapBoth<S, R>(onLeft: (error: E) => S, onRight: (value: T) => R): IEither<S, R> {
        return this.mapLeft(onLeft).map(onRight);
    }

    public chain<E_, R>(_fn: (value: T) => IEither<WhenNever<E, E_>, R>): IEither<WhenNever<E, E_>, R> {
        return this as unknown as IEither<WhenNever<E, E_>, R>;
    }

    public orElse<E_, T_>(
        fn: () => IEither<WhenNever<E, E_>, WhenNever<T, T_>>
    ): IEither<WhenNever<E, E_>, WhenNever<T, T_>> {
        return fn();
    }

    public getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_> {
        return defaults;
    }

    public abstract extract<T_>(fn: (error: E) => WhenNever<T, T_>): WhenNever<T, T_>;

    public abstract fold<R>(onLeft: (error: E) => R, onRight: (value: T) => R): R;

    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public toMaybe(): Maybe<T> {
        return this.map(Just).getOrElse(Nothing);
    }

    public tap<R>(fn: (that: Either<E, T>) => R): R {
        return fn(this);
    }
}

export class Left<E> extends Either<E, never> {
    public constructor(private readonly error: E) {
        super();
    }

    public isLeft(): boolean {
        return true;
    }

    public isEqual<E_>(another: IEither<WhenNever<E, E_>, never>): boolean {
        return this === another as IEither<E, never>
            || another.fold(
                (error: WhenNever<E, E_>): boolean => this.error === error,
                (): boolean => false
            );
    }

    public mapLeft<S>(fn: (error: E) => S): IEither<S, never> {
        return new Left(fn(this.error));
    }

    public swap(): IEither<never, E> {
        return new Right(this.error);
    }

    public extract<T>(fn: (error: E) => T): T {
        return fn(this.error);
    }

    public fold<R>(onLeft: (error: E) => R): R {
        return onLeft(this.error);
    }

    public cata<R>(pattern: Pattern<E, never, R>): R {
        if (typeof pattern.Left === 'function') {
            return pattern.Left(this.error);
        }

        return (pattern._ as () => R)();
    }
}

export class Right<T> extends Either<never, T> {
    public constructor(private readonly value: T) {
        super();
    }

    public isRight(): boolean {
        return true;
    }

    public isEqual<T_>(another: IEither<never, WhenNever<T, T_>>): boolean {
        return this === another as IEither<never, T>
            || another.fold(
                (): boolean => false,
                (value: WhenNever<T, T_>): boolean => this.value === value
            );
    }

    public map<R>(fn: (value: T) => R): IEither<never, R> {
        return new Right(fn(this.value));
    }

    public chain<R>(fn: (value: T) => IEither<never, R>): IEither<never, R> {
        return fn(this.value);
    }

    public orElse<T_>(): IEither<never, WhenNever<T, T_>> {
        return this as unknown as IEither<never, WhenNever<T, T_>>;
    }

    public getOrElse<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public swap(): IEither<T, never> {
        return new Left(this.value);
    }

    public extract<T_>(): WhenNever<T, T_> {
        return this.value as WhenNever<T, T_>;
    }

    public fold<R>(_onLeft: (error: never) => R, onRight: (value: T) => R): R {
        return onRight(this.value);
    }

    public cata<R>(pattern: Pattern<never, T, R>): R {
        if (typeof pattern.Right === 'function') {
            return pattern.Right(this.value);
        }

        return (pattern._ as () => R)();
    }
}
