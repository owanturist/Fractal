import {
    Value
} from './Json/Encode';

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

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isArray = (input: unknown): input is Array<unknown> => input instanceof Array;
export const isObject = (input: unknown): input is {[ key: string ]: Value } => {
    return typeof input === 'object' && input !== null && !isArray(input);
};
