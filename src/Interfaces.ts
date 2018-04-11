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
