import Maybe, { Nothing, Just } from './Maybe';

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

export function identity<T>(value: T): T {
    return value;
}

export function inst<T>(Constructor: new () => T) {
    return new Constructor();
}

export function cons<A extends Array<unknown>, T>(Constructor: new (...args: A) => A extends [] ? never : T) {
    return (...args: A): T => new Constructor(...args);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export const isFloat = isNumber;

export function isInt(value: unknown): value is number {
    return isNumber(value) && toInt(value.toString()).isJust();
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isArray(input: unknown): input is Array<unknown> {
    return input instanceof Array;
}

export function isObject(input: unknown): input is {[ key: string ]: unknown } {
    return typeof input === 'object' && input !== null && !isArray(input);
}

export function toInt(input: string): Maybe<number> {
    if (/^(\+|-)?\d+$/.test(input)) {
        return Just(Number(input));
    }

    return Nothing;
}
