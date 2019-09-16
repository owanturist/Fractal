import {
    WhenNever,
    identity
} from '../Basics';
import Either, { Left, Right } from '../Either';
import {
    Maybe,
    Pattern
} from './index';

export const Nothing: Maybe<never> = new class Nothing implements Maybe<never> {
    public isNothing(): boolean {
        return true;
    }

    public isJust(): boolean {
        return false;
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

    public orElse<T>(fn: () => Maybe<T>): Maybe<T> {
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

    public tap<R>(fn: (that: Maybe<never>) => R): R {
        return fn(this);
    }

    public toEither<E>(error: E): Either<E, never> {
        return Left(error);
    }
}();

export class Just<T> implements Maybe<T> {
    public constructor(private readonly value: T) {}

    public isNothing(): boolean {
        return false;
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
        return (fn(this.value as WhenNever<T, T_>) ? this : Nothing) as Maybe<WhenNever<T, T_>>;
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

    public tap<R>(fn: (that: Maybe<T>) => R): R {
        return fn(this);
    }

    public toEither(): Either<never, T> {
        return Right(this.value);
    }
}

export const fromNullable = <T>(value: T | null | undefined): Maybe<T extends null | undefined ? never : T> => {
    return value == null ? Nothing : new Just(value as T extends null | undefined ? never : T);
};

export const fromEither = <E, T>(either: Either<E, T>): Maybe<T> => {
    return either.map((value: T): Maybe<T> => new Just(value)).getOrElse(Nothing);
};

export const join = <T>(maybe: Maybe<Maybe<T>>): Maybe<T> => maybe.chain(identity);

export const shape = <O extends {}>(object: {[ K in keyof O ]: Maybe<O[ K ]>}): Maybe<O> => {
    const acc: O = {} as O;

    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const maybe = object[ key ];

            if (maybe.isNothing()) {
                return maybe as Maybe<never>;
            }

            acc[ key ] = maybe.getOrElse(null as never /* don't use this hack */);
        }
    }

    return new Just(acc);
};

export const combine = <T>(array: Array<Maybe<T>>): Maybe<Array<unknown extends T ? never : T>> => {
    const acc: Array<T> = [];

    for (const maybe of array) {
        if (maybe.isNothing()) {
            return maybe as Maybe<never>;
        }

        acc.push(maybe.getOrElse(null as never /* don't use this hack */));
    }

    return new Just((acc as Array<unknown extends T ? never : T>));
};

export const values = <T>(array: Array<Maybe<T>>): Array<unknown extends T ? never : T> => {
    const acc: Array<T> = [];

    for (const item of array) {
        if (item.isJust()) {
            acc.push(item.getOrElse(null as never /* don't use this hack */));
        }
    }

    return acc as Array<unknown extends T ? never : T>;
};
