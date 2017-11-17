export abstract class Maybe<T> {
    public static map<T, R>(fn: (value: T) => R, maybe: Maybe<T>): Maybe<R> {
        return maybe.map(fn);
    }

    public static map2<T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>
    ): Maybe<R> {
        return m1.andThen(
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
        return m1.andThen(
            t1 => m2.andThen(
                t2 => m3.map(
                    t3 => fn(t1, t2, t3)
                )
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
        return m1.andThen(
            t1 => m2.andThen(
                t2 => m3.andThen(
                    t3 => m4.map(
                        t4 => fn(t1, t2, t3, t4)
                    )
                )
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
        return m1.andThen(
            t1 => m2.andThen(
                t2 => m3.andThen(
                    t3 => m4.andThen(
                        t4 => m5.map(
                            t5 => fn(t1, t2, t3, t4, t5)
                        )
                    )
                )
            )
        );
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

const maybe = {
    Just: class Just<T> extends Maybe<T> {
        constructor(private readonly value: T) {
            super();
        }

        protected map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(
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
    },

    Nothing: class Nothing extends Maybe<any> {
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
};

export const Just = <T>(value: T): Maybe<T> => new maybe.Just(value);

export const Nothing: Maybe<any> = new maybe.Nothing();
