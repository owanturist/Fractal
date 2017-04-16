export interface Maybe<T> {
    map<R>(f: (a: T) => R): Maybe<R>;
    of<R>(a: R): Maybe<R>;
    ap<R>(f: Maybe<(a: T) => R>): Maybe<R>;
    chain<R>(f: (a: T) => Maybe<R>): Maybe<R>;
    orElse(f: () => Maybe<T>): Maybe<T>;
    getOrElse(defaults: T): T;
    cata<R>(pattern: MaybePattern<T, R>): R;
}

export interface MaybePattern<T, R> {
    Nothing(): R;
    Just(a: T): R;
}

class Just<T> implements Maybe<T> {
    constructor(private readonly value: T) {}

    of<R>(a: R): Maybe<R> {
        return new Just(a);
    }

    map<R>(f: (a: T) => R): Maybe<R> {
        return this.of(
            f(this.value)
        );
    }

    chain<R>(f: (a: T) => Maybe<R>): Maybe<R> {
        return f(this.value);
    }

    ap<R>(b: Maybe<(a: T) => R>): Maybe<R> {
        return b.map(f => f(this.value));
    }

    orElse(): Maybe<T> {
        return this;
    }

    getOrElse(): T {
        return this.value;
    }

    cata<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Just(this.value);
    }
}

class Nothing<T> implements Maybe<T> {
    of(): Maybe<T> {
        return this;
    }

    map(): Maybe<T> {
        return this;
    }

    chain(): Maybe<T> {
        return this;
    }

    ap(): Maybe<T> {
        return this;
    }

    orElse(f: () => Maybe<T>): Maybe<T> {
        return f();
    }

    getOrElse(defaults: T): T {
        return defaults;
    }

    cata<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Nothing();
    }
}

export const _Just = <T>(value: T): Maybe<T> => new Just(value);

export const _Nothing: Maybe<any> = new Nothing();
