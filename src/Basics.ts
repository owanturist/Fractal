export type Arg<F> = F extends (arg: infer A) => unknown ? A : never;

export type Return<F> = F extends (...args: Array<unknown>) => infer R ? R : never;

export type Optional<O extends object> = {[ K in keyof O ]?: O[ K ]};

export type Compute<A> = A extends infer O ? {
    [ K in keyof O ]: O[ K ];
} : never;

export type IsNever<A, T, F> = [ A ] extends [ never ] ? T : F;

export type WhenNever<A, T> = [ A, T ] extends [ T, A ] ? A : IsNever<A, T, A>;

export type Cata<O extends {[ K in keyof O ]: (...args: Array<unknown>) => unknown } & { _?: never }>
    = O extends {[ K in keyof O ]: (...args: Array<unknown>) => infer R }
    ? Compute<O & { _?(): never }> | Compute<Optional<O> & { _(): R }>
    : never
    ;

export const identity = <T>(value: T): T => value;

export const inst = <T>(Constructor: new () => T) => new Constructor();

export const cons = <A extends Array<unknown>, T>(
    Constructor: new (...args: A) => A extends [] ? never : T
) => (...args: A): T => new Constructor(...args);
