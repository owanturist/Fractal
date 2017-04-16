export interface Functor<T> {
    map<R>(f: (a: T) => R): Functor<R>;
}

export interface Apply<T> extends Functor<T> {
    of<R>(a: R): Apply<R>;
}

export interface Applicative<T> extends Apply<T> {
    ap<R>(f: Applicative<(a: T) => R>): Applicative<R>;
}

export interface Chain<T> extends Apply<T> {
    chain<R>(f: (a: T) => Chain<R>): Chain<R>;
}

export interface Monad<T> extends Applicative<T>, Chain<T> {}

export interface Maybe<T> extends Monad<T> {
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
        return new Just(a) as Maybe<R>;
    }

    map<R>(f: (a: T) => R): Maybe<R> {
        return this.of(
            f(this.value)
        ) as Maybe<R>;
    }

    chain<R>(f: (a: T) => Maybe<R>): Maybe<R> {
        return f(this.value) as Maybe<R>;
    }

    ap<R>(b: Maybe<(a: T) => R>): Maybe<R> {
        return b.map(f => f(this.value)) as Maybe<R>;
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

type Foo = {
    bar: Maybe<string>
    baz: {
        foo: Maybe<number>
    },
    foo: Maybe<{
        bar: Maybe<number>
    }>
};

const foo: Foo = {
    bar: _Just('asd'),
    baz: {
        foo: _Nothing
    },
    foo: _Just({
        bar: _Nothing
    })
};
