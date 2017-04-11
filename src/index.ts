interface Functor<T> {
    map<U>(f: (a: T) => U): Functor<U>;
}

interface Apply<T> extends Functor<T> {
    ap<U>(b: Apply<U>): Apply<U>;
}

interface Applicative<T> extends Apply<T> {
    of(a: T): Applicative<T>;
}

interface Chain<T> extends Apply<T> {
    chain<U>(f: (a: T) => Chain<U>): Chain<U>;
}

interface Monad<T> extends Applicative<T>, Chain<T> {}

interface Maybe<T> extends Monad<T> {}

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
    of(): Maybe<T> {
        return new Nothing();
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
}

const bar = new Just(1);

const t = new Nothing();

