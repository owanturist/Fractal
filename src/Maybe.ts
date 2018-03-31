interface Pattern<T, R> {
    readonly Nothing: () => R;
    readonly Just: (value: T) => R;
}

interface LazyPattern<T, R> {
    readonly Nothing?: () => R;
    readonly Just?: (value: T) => R;
    readonly _: () => R;
}

export abstract class Maybe<T> {

    // COMPAREING AND TESTING

    public abstract isNothing(): Boolean;

    public abstract isJust(): Boolean;

    public abstract isEqual(another: Maybe<T>): Boolean;

    // CONSTRUCTING

    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == undefined ? Nothing : Just(value);
    }

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;

    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;

    public abstract cata<R>(pattern: Pattern<T, R>): R;
    public abstract cata<R>(pattern: LazyPattern<T, R>): R;
}

const maybe = {
    Nothing: class Nothing<T> implements Maybe<T> {
        // COMPAREING AND TESTING

        public isNothing(): Boolean {
            return true;
        }

        public isJust(): Boolean {
            return false;
        }

        public isEqual(another: Maybe<T>): Boolean {
            return another.isNothing();
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

        public cata<R>(pattern: Pattern<T, R>): R;
        public cata<R>(pattern: LazyPattern<T, R>): R;
        public cata<R>(pattern: Pattern<T, R> | LazyPattern<T, R>): R {
            return 'Nothing' in pattern
                ? (pattern as Pattern<T, R>).Nothing()
                : (pattern as LazyPattern<T, R>)._();
        }
    },

    Just: class Just<T> implements Maybe<T> {
        constructor(private readonly value: T) {}

        // COMPAREING AND TESTING

        public isNothing(): Boolean {
            return false;
        }

        public isJust(): Boolean {
            return true;
        }

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

        public cata<R>(pattern: Pattern<T, R>): R;
        public cata<R>(pattern: LazyPattern<T, R>): R;
        public cata<R>(pattern: Pattern<T, R> | LazyPattern<T, R>): R {
            return 'Just' in pattern
                ? (pattern as Pattern<T, R>).Just(this.value)
                : (pattern as LazyPattern<T, R>)._();
        }
    }
}

export const Nothing: Maybe<any> = new maybe.Nothing();

export const Just = <T>(value: T): Maybe<T> => new maybe.Just(value);
