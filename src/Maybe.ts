interface Pattern<T, R> {
    Nothing(): R;
    Just(value: T): R;
}

export abstract class Maybe<T> {
    public static fromNullable<T>(value: undefined | null): Maybe<T>;
    public static fromNullable<T>(value: T): Maybe<T>;
    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == null ? Nothing() : Just(value);
    }

    public static props<T extends object, K extends keyof T>(config: {[ K in keyof T ]: Maybe<T[ K ]>}): Maybe<T> {
        let acc = Just({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Maybe<T> => (config[ key ] as Maybe<T[ K ]>).map(
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

    public static all<T>(list: Array<Maybe<T>>): Maybe<Array<T>> {
        let acc = Just([] as Array<T>);

        for (const item of list) {
            acc = acc.chain(
                (arr: Array<T>): Maybe<Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract readonly isNothing: boolean;

    public abstract readonly isJust: boolean;

    public abstract isEqual(another: Maybe<T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    public abstract fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;

    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;

    public abstract cata<R>(pattern: Pattern<T, R>): R;
}

namespace Variations {
    export class Nothing<T> implements Maybe<T> {
        public readonly isNothing: boolean = true;

        public readonly isJust: boolean = false;

        public isEqual(another: Maybe<T>): boolean {
            return another.isNothing;
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): Maybe<R> {
            return this as any as Maybe<R>;
        }

        public map<R>(): Maybe<R> {
            return this as any as Maybe<R>;
        }

        public chain<R>(): Maybe<R> {
            return this as any as Maybe<R>;
        }

        public fold<R>(nothingFn: () => R): R {
            return nothingFn();
        }

        public orElse(fn: () => Maybe<T>): Maybe<T> {
            return fn();
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Nothing();
        }
    }

    export class Just<T> implements Maybe<T> {
        public readonly isNothing: boolean = false;

        public readonly isJust: boolean = true;

        constructor(private readonly value: T) {}

        public isEqual(another: Maybe<T>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T): boolean => value === this.value
            );
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<R>(fn: (value: T) => R): Maybe<R> {
            return new Just(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public fold<R>(_nothingFn: () => R, justFn: (value: T) => R): R {
            return justFn(this.value);
        }

        public orElse(): Maybe<T> {
            return this;
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Just(this.value);
        }
    }
}

export const Nothing = <T>(): Maybe<T> => new Variations.Nothing();

export const Just = <T>(value: T): Maybe<T> => new Variations.Just(value);
