import * as Interfaces from './Interfaces';
import {
    Nothing,
    Just
} from './Maybe';

export interface Pattern<E, T, R> extends Interfaces.Either.Pattern<E, T, R> {}

export abstract class Either<E, T> implements Interfaces.Either<E, T> {
    public static fromNullable<E, T>(error: E, value: null | undefined): Either<E, T>;
    public static fromNullable<E, T>(error: E, value: T): Either<E, T>; // tslint:disable-line
    public static fromNullable<E, T>(error: E, value: T | null | undefined): Either<E, T> {
        return value == null ? Left(error) : Right(value);
    }

    public static fromMaybe<E, T>(error: E, maybe: Interfaces.Maybe<T>): Either<E, T> {
        return maybe.fold(
            (): Either<E, T> => Left(error),
            Right
        ) as Either<E, T>;
    }

    public static props<E, T extends object, K extends keyof T>(
        config: {[ K in keyof T ]: Either<E, T[ K ]>}
    ): Either<E, T> {
        let acc = Right<E, T>({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Either<E, T> => (config[ key ] as Either<E, T[ K ]>).map(
                        (value: T[ K ]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }

    public static all<E, T>(list: Array<Either<E, T>>): Either<E, Array<T>> {
        let acc = Right<E, Array<T>>([]);

        for (const item of list) {
            acc = acc.chain(
                (arr: Array<T>): Either<E, Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isLeft(): boolean;
    public abstract isRight(): boolean;
    public abstract isEqual(another: Either<E, T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(eitherFn: Either<E, (value: T) => R>): Either<E, R>;
    public abstract map<R>(fn: (value: T) => R): Either<E, R>;
    public abstract chain<R>(fn: (value: T) => Either<E, R>): Either<E, R>;
    public abstract bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    public abstract swap(): Either<T, E>;
    public abstract leftMap<S>(fn: (error: E) => S): Either<S, T>;
    public abstract orElse(fn: (error: E) => Either<E, T>): Either<E, T>;


    public abstract fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract toMaybe(): Interfaces.Maybe<T>;
}

namespace Variations {
    export class Left<E, T> extends Either<E, T> {
        constructor(private readonly error: E) {
            super();
        }

        public isLeft(): boolean {
            return true;
        }

        public isRight(): boolean {
            return false;
        }

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    (error: E): boolean => error === this.error,
                    (): boolean => false
                );
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public map<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public chain<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public bimap<S, R>(leftFn: (error: E) => S): Either<S, R> {
            return new Left(
                leftFn(this.error)
            );
        }

        public swap(): Either<T, E> {
            return new Right(this.error);
        }

        public leftMap<S>(fn: (error: E) => S): Either<S, T> {
            return new Left(
                fn(this.error)
            );
        }

        public orElse(fn: (error: E) => Either<E, T>): Either<E, T> {
            return fn(this.error);
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error);
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Left(this.error);
        }

        public toMaybe(): Interfaces.Maybe<T> {
            return Nothing<T>();
        }
    }

    export class Right<E, T> extends Either<E, T> {
        constructor(private readonly value: T) {
            super();
        }

        public isLeft(): boolean {
            return false;
        }

        public isRight(): boolean {
            return true;
        }

        public isEqual(another: Either<E, T>): boolean {
            return another
                .fold(
                    (): boolean => false,
                    (value: T): boolean => value === this.value
                );
        }

        public getOrElse(): T {
            return this.value;
        }

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

        public bimap<S, R>(_leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R> {
            return new Right(
                rightFn(this.value)
            );
        }

        public swap(): Either<T, E> {
            return new Left(this.value);
        }

        public leftMap<S>(): Either<S, T> {
            return this as any as Either<S, T>;
        }

        public orElse(): Either<E, T> {
            return this;
        }

        public fold<R>(_leftFn: (error: E) => R, rightFn: (value: T) => R): R {
            return rightFn(this.value);
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            return pattern.Right(this.value);
        }

        public toMaybe(): Interfaces.Maybe<T> {
            return Just(this.value);
        }
    }
}

export const Left = <E, T>(error: E): Either<E, T> => new Variations.Left(error);

export const Right = <E, T>(value: T): Either<E, T> => new Variations.Right(value);
