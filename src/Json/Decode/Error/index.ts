import {
    Cata
} from '../../../Basics';

import * as _ from './Error';

export {
    OneOf,
    Field,
    Index,
    Failure
} from './Error';

export type Pattern<R> = Error.Pattern<R>;

export interface Error {
    cata<R>(pattern: Pattern<R>): R;

    stringify(indent: number): string;
}

export namespace Error {
    export type Pattern<R> = Cata<{
        OneOf(errors: Array<Error>): R;
        Field(name: string, error: Error): R;
        Index(position: number, error: Error): R;
        Failure(message: string, source: unknown): R;
    }>;

    export const OneOf = _.OneOf;

    export const Field = _.Field;

    export const Index = _.Index;

    export const Failure = _.Failure;
}

export default Error;
