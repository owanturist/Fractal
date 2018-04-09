export interface Maybe<T> {
    isNothing(): boolean;
    isJust(): boolean;
    isEqual(another: Maybe<T>): boolean;

    getOrElse(defaults: T): T;

    ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;
    map<R>(fn: (value: T) => R): Maybe<R>;
    chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    orElse(fn: () => Maybe<T>): Maybe<T>;

    fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;
    cata<R>(pattern: Maybe.Pattern<T, R>): R;
}

export namespace Maybe {
    export interface Pattern<T, R> {
        Nothing(): R;
        Just(value: T): R;
    }
}
