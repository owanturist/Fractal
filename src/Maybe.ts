export interface Maybe<T> {
    map<R>(f: (a: T) => R): Maybe<R>;
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

export class Just<T> implements Maybe<T> {
    constructor(private readonly value: T) {}

    map<R>(f: (a: T) => R): Just<R> {
        return new Just(
            f(this.value)
        );
    }

    chain<R>(f: (a: T) => Maybe<R>): Maybe<R> {
        return f(this.value);
    }

    ap<R>(b: Maybe<(a: T) => R>): Maybe<R> {
        return b.chain(this.map)
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

export class Nothing<T> implements Maybe<T> {
    map(): Nothing<T> {
        return this;
    }

    chain(): Nothing<T> {
        return this;
    }

    ap(): Nothing<T> {
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
