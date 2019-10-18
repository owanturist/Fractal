import {
    WhenNever
} from '../Basics';
import Either, { Left, Right } from '../Either';
import {
    Maybe as IMaybe,
    Pattern
} from './index';

abstract class Maybe<T> implements IMaybe<T> {
    public isNothing(): boolean {
        return false;
    }

    public isJust(): boolean {
        return false;
    }

    public abstract isEqual<T_>(_another: IMaybe<WhenNever<T, T_>>): boolean;

    public map<R>(_fn: (value: T) => R): IMaybe<R> {
        return this as unknown as IMaybe<R>;
    }

    public chain<R>(_fn: (value: T) => IMaybe<R>): IMaybe<R> {
        return this as unknown as IMaybe<R>;
    }

    public filter<T_>(_fn: (value: WhenNever<T, T_>) => boolean): IMaybe<WhenNever<T, T_>> {
        return this as unknown as IMaybe<WhenNever<T, T_>>;
    }

    public orElse<T_>(fn: () => IMaybe<WhenNever<T, T_>>): IMaybe<WhenNever<T, T_>> {
        return fn();
    }

    public getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_> {
        return defaults;
    }

    public abstract fold<R>(onNothing: () => R, onJust: (value: T) => R): R;

    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public toEither<E>(error: E): Either<E, T> {
        return Left(error);
    }

    public tap<R>(fn: (that: IMaybe<T>) => R): R {
        return fn(this);
    }
}

export const Nothing: IMaybe<never> = new class Nothing extends Maybe<never> {
    public isNothing(): boolean {
        return true;
    }

    public isEqual(another: IMaybe<never>): boolean {
        return another.isNothing();
    }

    public fold<R>(onNothing: () => R): R {
        return onNothing();
    }

    public cata<R>(pattern: Pattern<never, R>): R {
        if (typeof pattern.Nothing === 'function') {
            return pattern.Nothing();
        }

        return (pattern._ as () => R)();
    }
}();

export class Just<T> extends Maybe<T> {
    public constructor(private readonly value: T) {
        super();
    }

    public isJust(): boolean {
        return true;
    }

    public isEqual<T_>(another: IMaybe<WhenNever<T, T_>>): boolean {
        return this === another as IMaybe<T>
            || another.map((value: WhenNever<T, T_>): boolean => this.value === value).getOrElse(false);
    }

    public map<R>(fn: (value: T) => R): IMaybe<R> {
        return new Just(fn(this.value));
    }

    public chain<R>(fn: (value: T) => IMaybe<R>): IMaybe<R> {
        return fn(this.value);
    }

    public filter<T_>(fn: (value: WhenNever<T, T_>) => boolean): IMaybe<WhenNever<T, T_>> {
        return (fn(this.value as WhenNever<T, T_>) ? this : Nothing) as IMaybe<WhenNever<T, T_>>;
    }

    public orElse<T_>(): IMaybe<WhenNever<T, T_>> {
        return this as unknown as IMaybe<WhenNever<T, T_>>;
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

    public toEither(): Either<never, T> {
        return Right(this.value);
    }
}
