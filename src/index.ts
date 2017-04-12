interface MaybePattern<T, U> {
    Nothing(): U,
    Just(a: T): U
}

interface Maybe<T> {
    of<U>(a: U): Maybe<U>;
    map<U>(f: (a: T) => U): Maybe<U>;
    ap<U>(b: Maybe<(a: T) => U>): Maybe<U>;
    chain<U>(f: (a: T) => Maybe<U>): Maybe<U>;
    orElse(f: () => Maybe<T>): Maybe<T>;
    getOrElse(defaults: T): T;
    cata<U>(pattern: MaybePattern<T, U>): U;
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

const bar = new Just(13);

const t = new Just(123);

type Foo = Maybe<{
    bar: {
        baz: Maybe<number>
    }
}>

const foo: Foo = new Just({
    bar: {
        baz: new Just(2)
    }
});

const f: (a: number) => string = (a: number):string => a * 12 + '';

const mBaz = foo
    .chain(a => a.bar.baz)
    .map(a => (b: number):((c: number) => number) => (c: number) => a * b * c)
    .chain(bar.map)
    .chain(t.map)
    .map(a => a + 100)
    .ap(bar.map(a => (b: number) => a * b))
    .orElse(() => new Just(213))
    .cata({
        Nothing() {
            return "321";
        },
        Just(a) {
            return a * 2 + "123";
        }
    })
