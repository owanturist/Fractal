export type Readonly<T> = {
    readonly [ K in keyof T ]: T[ K ];
};

interface SerializableArray extends Array<Serializable> {}

export type Serializable
    = null
    | string
    | boolean
    | number
    | SerializableArray
    | {[ key: string ]: Serializable }
    ;

export type Comparable = string | number;

export interface List<T> {
    isEmpty(): boolean;
    size(): number;
    count(fn: (element: T) => boolean): number;
    reverse(): List<T>;
    member(something: T): boolean;

    head(): Maybe<T>;
    tail(): Maybe<List<T>>;
    last(): Maybe<T>;
    init(): Maybe<List<T>>;
    filter(fn: (element: T) => boolean): List<T>;
    reject(fn: (element: T) => boolean): List<T>;
    remove(fn: (element: T) => boolean): List<T>;
    take(count: number): List<T>;
    takeWhile(fn: (element: T) => boolean): List<T>;
    drop(count: number): List<T>;
    dropWhile(fn: (element: T) => boolean): List<T>;
    unique(): List<T>;
    uniqueBy(fn: (element: T) => Comparable): List<T>;
    replaceIf(fn: (element: T) => boolean, next: T): List<T>;
    updateIf(fn: (element: T) => Maybe<T>): List<T>;

    cons(element: T): List<T>;
    append(another: List<T>): List<T>;
    concat(another: List<T> | Array<T>): List<T>;
    intersperse(gap: T): List<T>;

    partition(fn: (element: T) => boolean): [ List<T>, List<T> ];

    map<R>(fn: (element: T) => R): List<R>;
    chain<R>(fn: ((element: T) => List<R>) | ((element: T) => Array<R>)): List<R>;

    filterMap<R>(fn: (element: T) => Maybe<R>): List<R>;
    indexedMap<R>(fn: (index: number, element: T) => R): List<R>;

    foldl<R>(fn: (element: T, acc: R) => R, acc: R): R;
    foldr<R>(fn: (element: T, acc: R) => R, acc: R): R;

    find(fn: (element: T) => boolean): Maybe<T>;
    every(fn: (element: T) => boolean): boolean;
    any(fn: (element: T) => boolean): boolean;

    sortBy(fn: (element: T) => Comparable): List<T>;
    sortWith(fn: (prev: T, next: T) => Order): List<T>;

    toArray(): Array<T>;
}

export interface Order {
    isLT(): boolean;
    isEQ(): boolean;
    isGT(): boolean;

    cata<T>(pattern: Order.Pattern<T>): T;
}

export namespace Order {
    export type Pattern<T> = Readonly<{
        LT(): T;
        EQ(): T;
        GT(): T;
    }>;
}

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
    export type Pattern<T, R> = Readonly<{
        Nothing(): R;
        Just(value: T): R;
    }>;
}

export interface Either<E, T> {
    isLeft(): boolean;
    isRight(): boolean;
    isEqual(another: Either<E, T>): boolean;

    getOrElse(defaults: T): T;

    ap<R>(eitherFn: Either<E, (value: T) => R>): Either<E, R>;
    map<R>(fn: (value: T) => R): Either<E, R>;
    chain<R>(fn: (value: T) => Either<E, R>): Either<E, R>;
    bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    swap(): Either<T, E>;
    leftMap<S>(fn: (error: E) => S): Either<S, T>;
    orElse(fn: (error: E) => Either<E, T>): Either<E, T>;

    fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    cata<R>(pattern: Either.Pattern<E, T, R>): R;

    toMaybe(): Maybe<T>;
}

export namespace Either {
    export type Pattern<E, T, R> = Readonly<{
        Left(error: E): R;
        Right(value: T): R;
    }>;
}

export namespace Json {
    export interface Value {
        serialize(): Serializable;
        encode(indent: number): string;
    }

    export interface Decoder<T> {
        map<R>(fn: (value: T) => R): Decoder<R>;
        chain<R>(fn: (value: T) => Decoder<R>): Decoder<R>;

        decode(input: any, origin?: Array<string>): Either<string, T>;
        decodeJSON(input: string): Either<string, T>;
    }
}
