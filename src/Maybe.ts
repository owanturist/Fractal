export abstract class Maybe<T> {
    public static map<T, R>(f: (a: T) => R, m: Maybe<T>): Maybe<R> {
        return m.map(f);
    }

    public static andThen<T, R>(f: (a: T) => Maybe<R>, m: Maybe<T>): Maybe<R> {
        return m.andThen(f);
    }

    public static withDefault<T>(defaults: T, m: Maybe<T>): T {
        return m.withDefault(defaults);
    }

    public static cata<T, R>(pattern: Pattern<T, R>, m: Maybe<T>): R {
        return m.cata(pattern);
    }

    protected abstract map<R>(f: (a: T) => R): Maybe<R>;

    protected abstract andThen<R>(f: (a: T) => Maybe<R>): Maybe<R>;

    protected abstract withDefault(defaults: T): T;

    protected abstract cata<R>(pattern: Pattern<T, R>): R;
}

export interface Pattern<T, R> {
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

    protected cata<R>(pattern: Pattern<T, R>): R {
        return pattern.Just(this.value);
    }
}

export class Nothing extends Maybe<any> {
    protected map(): Maybe<any> {
        return this;
    }

    protected andThen(): Maybe<any> {
        return this;
    }

    protected withDefault<T>(defaults: T): T {
        return defaults;
    }

    protected cata<R>(pattern: Pattern<any, R>): R {
        return pattern.Nothing();
    }
}
