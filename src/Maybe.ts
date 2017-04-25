export abstract class Maybe<T> {
    protected abstract map<R>(f: (a: T) => R): Maybe<R>;

    protected abstract andThen<R>(f: (a: T) => Maybe<R>): Maybe<R>;

    protected abstract withDefault(defaults: T): T;

    protected abstract cata<R>(pattern: MaybePattern<T, R>): R;
}

export interface MaybePattern<T, R> {
    Nothing(): R;
    Just(a: T): R;
}

export class Just<T> extends Maybe<T> {
    constructor(private readonly value: T) {
        super();
    }

    protected map<R>(f: (a: T) => R): Maybe<R> {
        return new Just(
            f(this.value)
        );
    }

    protected andThen<R>(f: (a: T) => Maybe<R>): Maybe<R> {
        return f(this.value);
    }

    protected withDefault(): T {
        return this.value;
    }

    protected cata<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Just(this.value);
    }
}

export class Nothing<T> extends Maybe<T> {
    protected map(): Maybe<T> {
        return this;
    }

    protected andThen(): Maybe<T> {
        return this;
    }

    protected withDefault(defaults: T): T {
        return defaults;
    }

    protected cata<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Nothing();
    }
}
