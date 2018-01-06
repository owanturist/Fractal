interface Pattern<T, R> {
    Nothing: () => R;
    Just: (value: T) => R;
}

export abstract class Maybe<T> {

    // CONSTRUCTING

    public static fromNullable<T>(value?: T): Maybe<T> {
        return value == null ? Nothing : Just(value);
    }

    // COMPARING

    public abstract isNothing: boolean;
    public abstract isJust: boolean;
    public abstract isEqual(another: Maybe<T>): boolean;

    // EXTRACTING

    public abstract getOrElse(defaults: T): T;

    // TRANSFORMING

    public abstract ap<R>(maybe: Maybe<(value: T) => R>): Maybe<R>;
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;
    public abstract cata<R>(pattern: Pattern<T, R>): R;
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

        public ap<R>(): Maybe<R> {
            return new Nothing();
        }

        public map<R>(): Maybe<R> {
            return new Nothing();
        }

        public chain<R>(): Maybe<R> {
            return new Nothing();
        }

        public orElse(fn: ()  => Maybe<T>): Maybe<T> {
            return fn();
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Nothing();
        }
    },

    Just: class Just<T> implements Maybe<T> {
        constructor(private readonly value: T) {}

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

        public ap<R>(maybe: Maybe<(value: T) => R>): Maybe<R> {
            return maybe.chain(this.map)
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
};


export const Nothing: Maybe<any> = new maybe.Nothing();

export const Just = <T>(value: T): Maybe<T> => new maybe.Just(value);
