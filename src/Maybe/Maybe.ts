import {
    WhenNever,
    identity
} from '../Basics';
import Either, { Left, Right } from '../Either';
import {
    Maybe as IMaybe,
    Pattern
} from './index';

export abstract class Maybe<T> implements IMaybe<T> {
    public isNothing(): boolean {
        return false;
    }

    public isJust(): boolean {
        return false;
    }

    public abstract isEqual<T_>(another: IMaybe<WhenNever<T, T_>>): boolean;

    public abstract map<R>(fn: (value: T) => R): IMaybe<R>;

    public abstract chain<R>(fn: (value: T) => IMaybe<R>): IMaybe<R>;

    public abstract filter<T_>(fn: (value: WhenNever<T, T_>) => boolean): IMaybe<WhenNever<T, T_>>;

    public abstract orElse<T_>(fn: () => IMaybe<WhenNever<T, T_>>): IMaybe<WhenNever<T, T_>>;

    public abstract getOrElse<T_>(defaults: WhenNever<T, T_>): WhenNever<T, T_>;

    public abstract fold<R>(onNothing: () => R, onJust: (value: T) => R): R;

    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public tap<R>(fn: (that: IMaybe<T>) => R): R {
        return fn(this);
    }

    public abstract toEither<E>(error: E): Either<E, T>;
}

export const Nothing: IMaybe<never> = new class Nothing extends Maybe<never> {
    public isNothing(): boolean {
        return true;
    }

    public isEqual(another: IMaybe<never>): boolean {
        return this === another || another.isNothing();
    }

    public map(): IMaybe<never> {
        return this;
    }

    public chain(): IMaybe<never> {
        return this;
    }

    public filter(): IMaybe<never> {
        return this;
    }

    public orElse<T>(fn: () => IMaybe<T>): IMaybe<T> {
        return fn();
    }

    public getOrElse<T>(defaults: T): T {
        return defaults;
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

    public toEither<E>(error: E): Either<E, never> {
        return Left(error);
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
        return another
            .map((value: WhenNever<T, T_>): boolean => this.value === value)
            .getOrElse(false);
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

export const fromNullable = <T>(value: T | null | undefined): IMaybe<T extends null | undefined ? never : T> => {
    return value == null ? Nothing : new Just(value as T extends null | undefined ? never : T);
};

export const fromEither = <E, T>(either: Either<E, T>): IMaybe<T> => {
    return either.map((value: T): IMaybe<T> => new Just(value)).getOrElse(Nothing);
};

export const join = <T>(maybe: IMaybe<IMaybe<T>>): IMaybe<T> => maybe.chain(identity);

export const shape = <O extends {}>(object: {[ K in keyof O ]: IMaybe<O[ K ]>}): IMaybe<O> => {
    const acc: O = {} as O;

    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const maybe = object[ key ];

            if (maybe.isNothing()) {
                return maybe as IMaybe<never>;
            }

            acc[ key ] = maybe.getOrElse(null as never /* don't use this hack */);
        }
    }

    return new Just(acc);
};

export const combine = <T>(array: Array<IMaybe<T>>): IMaybe<Array<unknown extends T ? never : T>> => {
    const acc: Array<T> = [];

    for (const maybe of array) {
        if (maybe.isNothing()) {
            return maybe as IMaybe<never>;
        }

        acc.push(maybe.getOrElse(null as never /* don't use this hack */));
    }

    return new Just((acc as Array<unknown extends T ? never : T>));
};

export const values = <T>(array: Array<IMaybe<T>>): Array<unknown extends T ? never : T> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isJust()) {
            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }
    }

    return acc as Array<unknown extends T ? never : T>;
};
