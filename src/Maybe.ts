export abstract class Maybe<T> {
    public static Nothing: Maybe<any> = new Nothing();

    public static Just<T>(value: T): Maybe<T> {
        return new Just(value);
    }

    public static map<T, R>(f: (a: T) => R, m: Maybe<T>): Maybe<R> {
        return m.map(f);
    }

    public static andThen<T, R>(f: (a: T) => Maybe<R>, m: Maybe<T>): Maybe<R> {
        return m.andThen(f);
    }

    public static withDefault<T>(defaults: T, m: Maybe<T>): T {
        return m.withDefault(defaults);
    }

    public static caseOf<T, R>(pattern: MaybePattern<T, R>, m: Maybe<T>): R {
        return m.caseOf(pattern);
    }

    protected abstract map<R>(f: (a: T) => R): Maybe<R>;

    protected abstract andThen<R>(f: (a: T) => Maybe<R>): Maybe<R>;

    protected abstract withDefault(defaults: T): T;

    protected abstract caseOf<R>(pattern: MaybePattern<T, R>): R;
}

export interface MaybePattern<T, R> {
    Nothing(): R;
    Just(a: T): R;
}

class Just<T> extends Maybe<T> {
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

    protected caseOf<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Just(this.value);
    }
}

class Nothing<T> extends Maybe<T> {
    protected map(): Maybe<T> {
        return this;
    }

    protected andThen(): Maybe<T> {
        return this;
    }

    protected withDefault(defaults: T): T {
        return defaults;
    }

    protected caseOf<R>(pattern: MaybePattern<T, R>): R {
        return pattern.Nothing();
    }
}
