import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

type Pattern<E, T, R> = {
    Left(error: E): R;
    Right(value: T): R;
};

export abstract class Either<E, T> {

    // CONSTRUCTING

    public static fromNullable<E, T>(
        error: E,
        value: T | null | undefined
    ): Either<E, T> {
        return value == null ? Left(error) : Right(value);
    }

    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.cata({
            Nothing: () => Left(error),
            Just: Right
        })
    }

    // COMPARING

    public abstract isLeft: boolean;
    public abstract isRight: boolean;
    public abstract isEqual(another: Either<E, T>): boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract map<R>(fn: (value: T) => R): Either<E, R>;
    public abstract chain<R>(fn: (value: T) => Either<E, R>): Either<E, R>;
    public abstract fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<E, T, R>): R;
    public abstract swap(): Either<T, E>;
    public abstract bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    public abstract leftMap<S>(fn: (error: E) => S): Either<S, T>;
    public abstract orElse(fn: (error: E) => Either<E, T>): Either<E, T>;
    public abstract toMaybe(): Maybe<T>;

    // MAPPING

    public static map2<E, T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        r1: Either<E, T1>,
        r2: Either<E, T2>
    ): Either<E, R> {
        return r1.chain(
            t1 => r2.map(
                t2 => fn(t1, t2)
            )
        );
    }

    public static map3<E, T1, T2, T3, R>(
        fn: (t1: T1, t2: T2, t3: T3) => R,
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map2(
                (t2, t3) => fn(t1, t2, t3),
                r2,
                r3
            )
        );
    }

    public static map4<E, T1, T2, T3, T4, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>,
        r4: Either<E, T4>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map3(
                (t2, t3, t4) => fn(t1, t2, t3, t4),
                r2,
                r3,
                r4
            )
        );
    }

    public static map5<E, T1, T2, T3, T4, T5, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>,
        r4: Either<E, T4>,
        r5: Either<E, T5>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map4(
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
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>,
        r4: Either<E, T4>,
        r5: Either<E, T5>,
        r6: Either<E, T6>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map5(
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
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>,
        r4: Either<E, T4>,
        r5: Either<E, T5>,
        r6: Either<E, T6>,
        r7: Either<E, T7>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map6(
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
        r1: Either<E, T1>,
        r2: Either<E, T2>,
        r3: Either<E, T3>,
        r4: Either<E, T4>,
        r5: Either<E, T5>,
        r6: Either<E, T6>,
        r7: Either<E, T7>,
        r8: Either<E, T8>
    ): Either<E, R> {
        return r1.chain(
            t1 => this.map7(
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
}

const result = {
    Left: class Left<E, T> implements Either<E, T> {
        constructor(private readonly error: E) {}

        // COMPARING

        public isLeft = true;

        public isRight = false;

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    error => error === this.error,
                    () => false
                );
        }

        // EXTRACTING

        public getOrElse(defaults: T): T {
            return defaults;
        }

        // TRANSFORMING

        public map<R>(): Either<E, R> {
            return new Left(this.error);
        }

        public chain<R>(): Either<E, R> {
            return new Left(this.error);
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error)
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Left(this.error);
        }

        public swap(): Either<T, E> {
            return Right(this.error)
        }

        public bimap<S, R>(leftFn: (error: E) => S): Either<S, R> {
            return new Left(
                leftFn(this.error)
            );
        }

        public leftMap<S>(fn: (error: E) => S): Either<S, T> {
            return new Left(
                fn(this.error)
            );
        }

        public orElse(fn: (error: E) => Either<E, T>): Either<E, T> {
            return fn(this.error);
        }

        public toMaybe(): Maybe<T> {
            return Nothing;
        }
    },

    Right: class Right<E, T> implements Either<E, T> {
        constructor(private readonly value: T) {}

        // COMPARING

        public isLeft = false;

        public isRight = true;

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    () => false,
                    value => value === this.value,
                );
        }

        // EXTRACTING

        public getOrElse(): T {
            return this.value;
        }

        // TRANSFORMING

        public map<R>(fn: (value: T) => R): Either<E, R> {
            return new Right(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Either<E, R>): Either<E, R> {
            return fn(this.value);
        }

        public fold<R>(_leftFn: (error: E) => R, rightFn: (value: T) => R): R {
            return rightFn(this.value);
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Right(this.value);
        }

        public swap(): Either<T, E> {
            return Left(this.value);
        }

        public bimap<S, R>(_leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R> {
            return new Right(
                rightFn(this.value)
            );
        }

        public leftMap<S>(): Either<S, T> {
            return new Right(this.value);
        }

        public orElse(): Either<E, T> {
            return this;
        }

        public toMaybe(): Maybe<T> {
            return Just(this.value);
        }
    }
};

export const Left = <E>(error: E): Either<E, any> => new result.Left(error);

export const Right = <T>(value: T): Either<any, T> => new result.Right(value);
