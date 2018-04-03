import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

interface Pattern<E, T, R> {
    readonly Left: (error: E) => R;
    readonly Right: (value: T) => R;
};

type Props<E, T> = {[ K in keyof T ]: Either<E, T[ K ]>}

export abstract class Either<E, T> {
    // CONSTRUCTING

    public static fromNullable<E, T>(
        error: E,
        value: T | null | undefined
    ): Either<E, T> {
        return value == null ? Left(error) : Right(value);
    }

    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.fold(
            (): Either<E, T> => Left(error),
            Right
        );
    }

    // COMPAREING AND TESTING

    public abstract readonly isLeft: boolean;

    public abstract readonly isRight: boolean;

    public abstract isEqual(another: Either<E, T>): boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract ap<R>(eitherFn: Either<E, (value: T) => R>): Either<E, R>;

    public abstract map<R>(fn: (value: T) => R): Either<E, R>;

    public abstract chain<R>(fn: (value: T) => Either<E, R>): Either<E, R>;

    public abstract fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;

    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract swap(): Either<T, E>;

    public abstract bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;

    public abstract leftMap<S>(fn: (error: E) => S): Either<S, T>;

    public abstract orElse(fn: (error: E) => Either<E, T>): Either<E, T>;

    public abstract toMaybe(): Maybe<T>;

    public static props<E, T extends object, K extends keyof T>(config: Props<E, T>): Either<E, T> {
        let acc = Right({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T) => (config[ key ] as Either<E, T[ K ]>).map(
                        (value: T[ K ]) => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }
}

namespace Variations {
    export class Left<E, T> implements Either<E, T> {
        constructor(private readonly error: E) {}

        // COMPAREING AND TESTING

        public readonly isLeft: boolean = true;

        public readonly isRight: boolean = false;

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    (error: E): boolean => error === this.error,
                    (): boolean => false
                );
        }

        // EXTRACTING

        public getOrElse(defaults: T): T {
            return defaults;
        }

        // TRANSFORMING

        public ap<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public map<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public chain<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error)
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Left(this.error);
        }

        public swap(): Either<T, E> {
            return new Right(this.error)
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
    }

    export class Right<E, T> implements Either<E, T> {
        constructor(private readonly value: T) {}

        // COMPAREING AND TESTING

        public readonly isLeft: boolean = false;

        public readonly isRight: boolean = true;

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    (): boolean => false,
                    (value: T): boolean => value === this.value,
                );
        }

        // EXTRACTING

        public getOrElse(): T {
            return this.value;
        }

        // TRANSFORMING

        public ap<R>(eitherFn: Either<E, (value: T) => R>): Either<E, R> {
            return eitherFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

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
            return new Left(this.value);
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
}

export const Left = <E>(error: E): Either<E, any> => new Variations.Left(error);

export const Right = <T>(value: T): Either<any, T> => new Variations.Right(value);
