interface Pattern<T, R> {
    readonly Nothing: () => R;
    readonly Just: (value: T) => R;
}

type Props<T> = {[ K in keyof T ]: Maybe<T[ K ]>}

export abstract class Maybe<T> {
    // CONSTRUCTING

    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == undefined ? Nothing : Just(value);
    }

    // COMPAREING AND TESTING

    public abstract readonly isNothing: Boolean;

    public abstract readonly isJust: Boolean;

    public abstract isEqual(another: Maybe<T>): Boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;

    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public static props<T extends object, K extends keyof T>(config: Props<T>): Maybe<T> {
        let acc = Just({} as T);

        for (const key in config) {
            acc = acc.chain(
                (obj: T) => (config[ key ] as Maybe<T[ K ]>).map(
                    (value: T[ K ]) => {
                        obj[ key ] = value;

                        return obj;
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

        public readonly isNothing: Boolean = true;

        public readonly isJust: Boolean = false

        public isEqual(another: Maybe<T>): Boolean {
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

        public readonly isNothing: Boolean = false;

        public readonly isJust: Boolean = true;

        public isEqual(another: Maybe<T>): Boolean {
            return another.cata({
                Nothing: () => false,
                Just: (value: T): Boolean => value === this.value
            });
        }

        // EXTRACTING

        public getOrElse(): T {
            return this.value;
        }

        // TRANSFORMING

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.map(
                (fn: (value: T) => R) => fn(this.value)
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

        public orElse(): Maybe<T> {
            return this;
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Just(this.value);
        }
    }
}

export const Nothing: Maybe<any> = new Variations.Nothing();

export function Just<T>(value: T): Maybe<T> {
    return new Variations.Just(value);
}
