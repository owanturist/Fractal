export type IsNever<A, T, F> = [ A ] extends [ never ] ? T : F;

export type WhenNever<A, T> = [ A, T ] extends [ T, A ] ? A : IsNever<A, T, A>;

type Combinations<T> =  {
    [ K in keyof T ]: {
        [ N in keyof T ]?: N extends K ? never : T[ N ];
    };
}[ keyof T ];

export type Cata<T>
    = T extends {[ K in keyof T ]: (...args: Array<unknown>) => infer R }
    ? T & { _?: never } | Combinations<T> & { _(): R }
    : T
    ;

/*
type Args<F>
    = F extends (...args: infer A) => unknown
    ? A
    : never
    ;

type TailArgs<F>
    = F extends (head: unknown, ...tail: infer A) => unknown
    ? A
    : F extends () => unknown ? [] : never
    ;

type Tail<T extends Array<unknown>> = TailArgs<(...args: T) => unknown>;

type CastArray<T> = T extends Array<unknown> ? T : [];

type Initial<T extends Array<unknown>, R extends Array<unknown> = Tail<T>> = CastArray<{
    [ K in keyof R ]: T[ keyof T & K ];
}>;

type PotentialArgs<T extends Array<unknown>, R extends Array<unknown> = Initial<T>> = CastArray<{
    next: R extends [] ? never : T | PotentialArgs<R, Initial<R>>;
    end: R extends [] ? T : never;
}[ R extends [] ? 'end' : 'next' ]>;

type DropFromArraySize<T extends Array<unknown>, R extends Array<unknown>> = CastArray<{
    next: R extends [] ? never : DropFromArraySize<Tail<T>, Tail<R>>;
    end: R extends [] ? T : never;
}[ R extends [] ? 'end' : 'next' ]>;

type Curried<F extends (...args: Array<unknown>) => unknown> =
    <
        A extends Args<F>,
        T extends PotentialArgs<A>,
        R extends DropFromArraySize<A, T>
    >(...args: T) => R extends [] ? ReturnType<F> : Curried<(...args: R) => ReturnType<F>>;

export declare const curry: <F extends (...args: Array<unknown>) => unknown>(func: F) =>
    Args<F> extends [] | [ unknown ] ? F : Curried<F>;
*/
