export interface Maybe<T> {
    of<U>(a: U): Maybe<U>,
    map<U>(f: (a: T) => U): Maybe<U>,
    ap<U>(b: Maybe<(a: T) => U>): Maybe<U>,
    chain<U>(f: (a: T) => Maybe<U>): Maybe<U>,
    orElse(f: () => Maybe<T>): Maybe<T>,
    getOrElse(defaults: T): T,
    cata<U>(pattern: MaybePattern<T, U>): U
}

export interface MaybePattern<T, U> {
    Nothing(): U,
    Just(a: T): U
}

class Just<T> implements Maybe<T> {
    constructor(private readonly value: T) {}

    of<U>(a: U): Maybe<U> {
        return new Just(a);
    }

    map<U>(f: (a: T) => U): Maybe<U> {
        return this.of(
            f(this.value)
        );
    }

    chain<U>(f: (a: T) => Maybe<U>): Maybe<U> {
        return f(this.value);
    }

    ap<U>(b: Maybe<(a: T) => U>): Maybe<U> {
        return b.map(f => f(this.value));
    }

    orElse(): Maybe<T> {
        return this;
    }

    getOrElse(): T {
        return this.value;
    }

    cata<U>(pattern: MaybePattern<T, U>): U {
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

    cata<U>(pattern: MaybePattern<T, U>): U {
        return pattern.Nothing();
    }
}

export const _Just = <T>(value: T) => new Just(value);

export const _Nothing = () => new Nothing();
