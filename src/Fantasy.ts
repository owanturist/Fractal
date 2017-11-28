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

    public static map2<T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>
    ): Maybe<R> {
        return m1.chain(
            t1 => m2.map(
                t2 => fn(t1, t2)
            )
        );
    }

    public static map3<T1, T2, T3, R>(
        fn: (t1: T1, t2: T2, t3: T3) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map2(
                (t2, t3) => fn(t1, t2, t3),
                m2,
                m3
            )
        );
    }

    public static map4<T1, T2, T3, T4, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>,
        m4: Maybe<T4>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map3(
                (t2, t3, t4) => fn(t1, t2, t3, t4),
                m2,
                m3,
                m4
            )
        );
    }

    public static map5<T1, T2, T3, T4, T5, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>,
        m4: Maybe<T4>,
        m5: Maybe<T5>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map4(
                (t2, t3, t4, t5) => fn(t1, t2, t3, t4, t5),
                m2,
                m3,
                m4,
                m5
            )
        );
    }

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
