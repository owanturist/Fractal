type Pattern<T, R> = {
    Nothing: () => R;
    Just: (value: T) => R;
};

export abstract class Maybe<T> {

    // CONSTRUCTING

    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == null ? Nothing : Just(value);
    }

    // COMPARING

    public abstract isNothing: boolean;
    public abstract isJust: boolean;
    public abstract isEqual(another: Maybe<T>): boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract map<R>(fn: (value: T) => R): Maybe<R>;
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;
    public abstract cata<R>(pattern: Pattern<T, R>): R;

    // MAPPING

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

    public static map6<T1, T2, T3, T4, T5, T6, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>,
        m4: Maybe<T4>,
        m5: Maybe<T5>,
        m6: Maybe<T6>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map5(
                (t2, t3, t4, t5, t6) => fn(t1, t2, t3, t4, t5, t6),
                m2,
                m3,
                m4,
                m5,
                m6
            )
        );
    }

    public static map7<T1, T2, T3, T4, T5, T6, T7, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>,
        m4: Maybe<T4>,
        m5: Maybe<T5>,
        m6: Maybe<T6>,
        m7: Maybe<T7>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map6(
                (t2, t3, t4, t5, t6, t7) => fn(t1, t2, t3, t4, t5, t6, t7),
                m2,
                m3,
                m4,
                m5,
                m6,
                m7
            )
        );
    }

    public static map8<T1, T2, T3, T4, T5, T6, T7, T8, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => R,
        m1: Maybe<T1>,
        m2: Maybe<T2>,
        m3: Maybe<T3>,
        m4: Maybe<T4>,
        m5: Maybe<T5>,
        m6: Maybe<T6>,
        m7: Maybe<T7>,
        m8: Maybe<T8>
    ): Maybe<R> {
        return m1.chain(
            t1 => this.map7(
                (t2, t3, t4, t5, t6, t7, t8) => fn(t1, t2, t3, t4, t5, t6, t7, t8),
                m2,
                m3,
                m4,
                m5,
                m6,
                m7,
                m8
            )
        );
    }
}

const maybe = {
    Nothing: class Nothing<T> implements Maybe<T> {

        // COMPARING

        public isNothing = true;

        public isJust = false;

        public isEqual(another: Maybe<T>): boolean {
            return another.isNothing;
        }

        // EXTRACTING

        public getOrElse(defaults: T): T {
            return defaults;
        }

        // TRANSFORMING

        public map<R>(): Maybe<R> {
            return new Nothing();
        }

        public chain<R>(): Maybe<R> {
            return new Nothing();
        }

        public orElse(fn: () => Maybe<T>): Maybe<T> {
            return fn();
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Nothing();
        }
    },

    Just: class Just<T> implements Maybe<T> {
        constructor(private readonly value: T) { }

        // COMPARING

        public isNothing = false;

        public isJust = true;

        public isEqual(another: Maybe<T>): boolean {
            return another
                .map(value => value === this.value)
                .getOrElse(false);
        }

        // EXTRACTING

        public getOrElse(): T {
            return this.value;
        }

        // TRANSFORMING

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public orElse(): Maybe<T> {
            return this;
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Just(this.value);
        }
    }
};


export const Nothing: Maybe<any> = new maybe.Nothing();

export const Just = <T>(value: T): Maybe<T> => new maybe.Just(value);
