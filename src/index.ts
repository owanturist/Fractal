interface Maybe<T> {
    map<U>(f: (a: T) => U): Maybe<U>;
    ap<U>(b: Maybe<U>): Maybe<U>;
    of<U>(a: U): Maybe<U>;
    chain<U>(f: (a: T) => Maybe<U>): Maybe<U>;
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

    ap<U>(b: Maybe<U>): Maybe<U> {     
        return b.map(this.value);
    }
}

class Nothing<T> implements Maybe<T> {
    of<U>(): Maybe<U> {
        return new Nothing();
    }

    map<U>(): Maybe<U> {
        return this;
    }

    chain<U>(): Maybe<U> {
        return this;
    }

    ap<U>(): Maybe<U> {
        return this;
    }
}

const bar = new Just((a: number) => a + 2);
bar.map(a => a(1))

const t = new Nothing();

type Foo = Maybe<{
    bar: {
        baz: Maybe<number>
    }
}>

const foo: Foo = new Just({
    bar: {
        baz: new Nothing()
    }
});

const mBaz = foo
    .chain(b => b.bar.baz)
    .map(a => (b: number) => a * b)
    .ap()


