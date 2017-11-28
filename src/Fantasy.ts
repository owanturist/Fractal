export interface Setoid<T> {
    equals(another: T): boolean;
}

export interface Functor<T> {
    map<R>(fn: (value: T) => R): Functor<R>;
}

export interface Apply<T> extends Functor<T> {
    ap<R>(apply: Apply<(value: T) => R>): Apply<R>;
}

export interface Applicative<T> extends Apply<T> {
    of(value: T): Applicative<T>;
}

export interface Chain<T> extends Apply<T> {
    chain<R>(fn: (value: T) => Chain<R>): Chain<R>;
}

export interface Monad<T> extends Applicative<T>, Chain<T> {}

export abstract class Maybe<T> implements Monad<T> {
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract ap<R>(maybe: Maybe<(value: T) => R>): Maybe<R>;

    public of(value: T): Maybe<T> {
        return new maybe.Just(value);
    }

    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
}

const maybe = {
    Nothing: class Nothing extends Maybe<any> {
        public map(): Maybe<any> {
            return this;
        }

        public ap(): Maybe<any> {
            return this;
        }

        public chain(): Maybe<any> {
            return this;
        }
    },

    Just: class Just<T> extends Maybe<T> {
        constructor(private readonly value: T) {
            super();
        }

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(
                fn(this.value)
            );
        }

        public ap<R>(maybe: Maybe<(value: T) => R>): Maybe<R> {
            return maybe.map(fn => fn(this.value));
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }
    }
};

export const Nothing: Maybe<any> = new maybe.Nothing();

export function Just<T>(value: T): Maybe<T> {
    return new maybe.Just(value);
}
