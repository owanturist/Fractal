abstract class Maybe<T> {
    public static map<T, R>(fn: (value: T) => R, maybe: Maybe<T>): Maybe<R> {
        return maybe.map(fn);
    }

    public static andThen<T, R>(fn: (value: T) => Maybe<R>, maybe: Maybe<T>): Maybe<R> {
        return maybe.andThen(fn);
    }

    public static withDefault<T>(defaults: T, maybe: Maybe<T>): T {
        return maybe.withDefault(defaults);
    }

    public static cata<T, R>(pattern: Pattern<T, R>, maybe: Maybe<T>): R {
        return maybe.cata(pattern);
    }

    protected abstract map<R>(fn: (value: T) => R): Maybe<R>;

    protected abstract andThen<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    protected abstract withDefault(defaults: T): T;

    protected abstract cata<R>(pattern: Pattern<T, R>): R;
}

interface Pattern<T, R> {
    Nothing(): R;
    Just(value: T): R;
}

class Just_<T> extends Maybe<T> {
    constructor(private readonly value: T) {
        super();
    }

    protected map<R>(fn: (value: T) => R): Maybe<R> {
        return new Just_(
            fn(this.value)
        );
    }

    protected andThen<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
        return fn(this.value);
    }

    protected withDefault(): T {
        return this.value;
    }

    protected cata<R>(pattern: Pattern<T, R>): R {
        return pattern.Just(this.value);
    }
}

class Nothing_ extends Maybe<any> {
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

const Just = <T>(value: T): Maybe<T> => new Just_(value);

const Nothing: Maybe<any> = new Nothing_();

const map = Maybe.map;

const andThen = Maybe.andThen;

const withDefault = Maybe.withDefault;

const cata = Maybe.cata;

