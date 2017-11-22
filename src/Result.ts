import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export abstract class Result<E, T> {
    public static map<E, T, R>(
        fn: (value: T) => R,
        result: Result<E, T>
    ): Result<E, R> {
        return result.map(fn);
    }

    public static map2<E, T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map(
                t2 => fn(t1, t2),
                r2
            )
        );
    }

    public static map3<E, T1, T2, T3, R>(
        fn: (t1: T1, t2: T2, t3: T3) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map2(
                (t2, t3) => fn(t1, t2, t3),
                r2,
                r3
            )
        );
    }

    public static map4<E, T1, T2, T3, T4, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>,
        r4: Result<E, T4>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map3(
                (t2, t3, t4) => fn(t1, t2, t3, t4),
                r2,
                r3,
                r4
            )
        );
    }

    public static map5<E, T1, T2, T3, T4, T5, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>,
        r4: Result<E, T4>,
        r5: Result<E, T5>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map4(
                (t2, t3, t4, t5) => fn(t1, t2, t3, t4, t5),
                r2,
                r3,
                r4,
                r5
            )
        );
    }

    public static map6<E, T1, T2, T3, T4, T5, T6, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>,
        r4: Result<E, T4>,
        r5: Result<E, T5>,
        r6: Result<E, T6>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map5(
                (t2, t3, t4, t5, t6) => fn(t1, t2, t3, t4, t5, t6),
                r2,
                r3,
                r4,
                r5,
                r6
            )
        );
    }

    public static map7<E, T1, T2, T3, T4, T5, T6, T7, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>,
        r4: Result<E, T4>,
        r5: Result<E, T5>,
        r6: Result<E, T6>,
        r7: Result<E, T7>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map6(
                (t2, t3, t4, t5, t6, t7) => fn(t1, t2, t3, t4, t5, t6, t7),
                r2,
                r3,
                r4,
                r5,
                r6,
                r7
            )
        );
    }

    public static map8<E, T1, T2, T3, T4, T5, T6, T7, T8, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => R,
        r1: Result<E, T1>,
        r2: Result<E, T2>,
        r3: Result<E, T3>,
        r4: Result<E, T4>,
        r5: Result<E, T5>,
        r6: Result<E, T6>,
        r7: Result<E, T7>,
        r8: Result<E, T8>
    ): Result<E, R> {
        return r1.andThen(
            t1 => Result.map7(
                (t2, t3, t4, t5, t6, t7, t8) => fn(t1, t2, t3, t4, t5, t6, t7, t8),
                r2,
                r3,
                r4,
                r5,
                r6,
                r7,
                r8
            )
        );
    }

    public static andThen<E, T, R>(
        fn: (value: T) => Result<E, R>,
        result: Result<E, T>
    ): Result<E, R> {
        return result.andThen(fn);
    }

    public static withDefault<E, T>(defaults: T, result: Result<E, T>): T {
        return result.withDefault(defaults);
    }

    public static toMaybe<E, T>(result: Result<E, T>): Maybe<T> {
        return result.toMaybe();
    }

    public static fromMaybe<E, T>(msg: E, maybe: Maybe<T>): Result<E, T> {
        return Maybe.cata({
            Nothing: () => Err(msg),
            Just: Ok
        }, maybe)
    }

    public static mapError<E, T, R>(fn: (msg: E) => R, result: Result<E, T>): Result<R, T> {
        return result.mapError(fn);
    }

    public static cata<E, T, R>(pattern: Pattern<E, T, R>, result: Result<E, T>): R {
        return result.cata(pattern);
    }

    protected abstract map<R>(fn: (value: T) => R): Result<E, R>;

    protected abstract andThen<R>(fn: (value: T) => Result<E, R>): Result<E, R>;

    protected abstract withDefault(defaults: T): T;

    protected abstract toMaybe(): Maybe<T>;

    protected abstract mapError<R>(fn: (msg: E) => R): Result<R, T>;

    protected abstract cata<R>(pattern: Pattern<E, T, R>): R;
}

interface Pattern<E, T, R> {
    Err(msg: E): R;
    Ok(value: T): R;
}

const result = {
    Err: class Err<E, T> extends Result<E, T> {
        constructor(private readonly msg: E) {
            super();
        }

        protected map<R>(): Result<E, R> {
            return new Err(this.msg);
        }

        protected andThen<R>(): Result<E, R> {
            return new Err(this.msg);
        }

        protected withDefault<T>(defaults: T): T {
            return defaults;
        }

        protected toMaybe(): Maybe<T> {
            return Nothing;
        }

        protected mapError<R>(fn: (msg: E) => R): Result<R, T> {
            return new Err(
                fn(this.msg)
            );
        }

        protected cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Err(this.msg);
        }
    },

    Ok: class Ok<E, T> extends Result<E, T> {
        constructor(private readonly value: T) {
            super();
        }

        protected map<R>(fn: (value: T) => R): Result<E, R> {
            return new Ok(
                fn(this.value)
            );
        }

        protected andThen<R>(fn: (value: T) => Result<E, R>): Result<E, R> {
            return fn(this.value);
        }

        protected withDefault(): T {
            return this.value;
        }

        protected toMaybe(): Maybe<T> {
            return Just(this.value);
        }

        protected mapError<R>(): Result<R, T> {
            return new Ok(this.value);
        }

        protected cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Ok(this.value);
        }
    }
};

export const Err = <E>(msg: E): Result<E, any> => new result.Err(msg);

export const Ok = <T>(value: T): Result<any, T> => new result.Ok(value);
