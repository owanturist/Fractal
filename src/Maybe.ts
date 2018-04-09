import * as Interfaces from './Interfaces';

export abstract class Maybe<T> implements Interfaces.Maybe<T> {
    public static fromNullable<T>(value: undefined | null): Interfaces.Maybe<T>;
    public static fromNullable<T>(value: T): Interfaces.Maybe<T>;
    public static fromNullable<T>(value: T | null | undefined): Interfaces.Maybe<T> {
        return value == null ? Nothing() : Just(value);
    }

    public static props<T extends object, K extends keyof T>(
        config: {[ K in keyof T ]: Interfaces.Maybe<T[ K ]>}
    ): Interfaces.Maybe<T> {
        let acc = Just({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Interfaces.Maybe<T> => (config[ key ] as Interfaces.Maybe<T[ K ]>).map(
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

    public static all<T>(list: Array<Interfaces.Maybe<T>>): Interfaces.Maybe<Array<T>> {
        let acc = Just([] as Array<T>);

        for (const item of list) {
            acc = acc.chain(
                (arr: Array<T>): Interfaces.Maybe<Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isNothing(): boolean;
    public abstract isJust(): boolean;
    public abstract isEqual(another: Interfaces.Maybe<T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(maybeFn: Interfaces.Maybe<(value: T) => R>): Interfaces.Maybe<R>;
    public abstract map<R>(fn: (value: T) => R): Interfaces.Maybe<R>;
    public abstract chain<R>(fn: (value: T) => Interfaces.Maybe<R>): Interfaces.Maybe<R>;
    public abstract orElse(fn: () => Interfaces.Maybe<T>): Interfaces.Maybe<T>;

    public abstract fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Interfaces.Maybe.Pattern<T, R>): R;
}

namespace Variations {
    export class Nothing<T> extends Maybe<T> {
        public isNothing(): boolean {
            return true;
        }

        public isJust(): boolean {
            return false;
        }

        public isEqual(another: Interfaces.Maybe<T>): boolean {
            return another.isNothing();
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): Interfaces.Maybe<R> {
            return this as any as Interfaces.Maybe<R>;
        }

        public map<R>(): Interfaces.Maybe<R> {
            return this as any as Interfaces.Maybe<R>;
        }

        public chain<R>(): Interfaces.Maybe<R> {
            return this as any as Interfaces.Maybe<R>;
        }

        public orElse(fn: () => Interfaces.Maybe<T>): Interfaces.Maybe<T> {
            return fn();
        }

        public fold<R>(nothingFn: () => R): R {
            return nothingFn();
        }

        public cata<R>(pattern: Interfaces.Maybe.Pattern<T, R>): R {
            return pattern.Nothing();
        }
    }

    export class Just<T> extends Maybe<T> {
        constructor(private readonly value: T) {
            super();
        }

        public isNothing(): boolean {
            return false;
        }

        public isJust(): boolean {
            return true;
        }

        public isEqual(another: Interfaces.Maybe<T>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T): boolean => value === this.value
            );
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<R>(maybeFn: Interfaces.Maybe<(value: T) => R>): Interfaces.Maybe<R> {
            return maybeFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<R>(fn: (value: T) => R): Interfaces.Maybe<R> {
            return new Just(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Interfaces.Maybe<R>): Interfaces.Maybe<R> {
            return fn(this.value);
        }

        public orElse(): Interfaces.Maybe<T> {
            return this;
        }

        public fold<R>(_nothingFn: () => R, justFn: (value: T) => R): R {
            return justFn(this.value);
        }

        public cata<R>(pattern: Interfaces.Maybe.Pattern<T, R>): R {
            return pattern.Just(this.value);
        }
    }
}

export const Nothing = <T>(): Interfaces.Maybe<T> => new Variations.Nothing();

export const Just = <T>(value: T): Interfaces.Maybe<T> => new Variations.Just(value);
