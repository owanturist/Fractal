interface Pattern<T, R> {
    readonly Nothing: () => R;
    readonly Just: (value: T) => R;
}

export abstract class Maybe<T> {

    // CONSTRUCTING

    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == undefined ? Nothing : Just(value);
    }

    // COMPAREING AND TESTING

    public abstract readonly isNothing: boolean;

    public abstract readonly isJust: boolean;

    public abstract isEqual(another: Maybe<T>): boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    public abstract fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;

    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;

    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public static props<T extends object, K extends keyof T>(config: {[ K in keyof T ]: Maybe<T[ K ]>}): Maybe<T> {
        let acc = Just({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T) => (config[ key ] as Maybe<T[ K ]>).map(
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

    public static all<T>(list: Array<Maybe<T>>): Maybe<Array<T>> {
        let acc = Just([] as Array<T>);

        for (const item of list) {
            acc = acc.chain(
                (arr: Array<T>) => item.map(
                    (value: T) => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }
}

namespace Variations {
    export class Nothing<T> implements Maybe<T> {

        // COMPAREING AND TESTING

        public readonly isNothing: boolean = true;

        public readonly isJust: boolean = false

        public isEqual(another: Maybe<T>): boolean {
            return another.isNothing;
        }

        // EXTRACTING

        public getOrElse(defaults: T): T {
            return defaults;
        }

        // TRANSFORMING

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
        constructor(private readonly value: T) {}

        // COMPAREING AND TESTING

        public readonly isNothing: boolean = false;

        public readonly isJust: boolean = true;

        public isEqual(another: Maybe<T>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T): boolean => value === this.value
            );
        }

        // EXTRACTING

        public getOrElse(): T {
            return this.value;
        }

        // TRANSFORMING

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

export const Nothing: Maybe<any> = new Variations.Nothing();

export const Just = <T>(value: T): Maybe<T> => new Variations.Just(value);
