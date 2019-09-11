import {
    Cata
} from '../../../Basics';

import * as _ from './Error';

/**
 * A structured error describing exactly how the decoder failed.
 * You can use this to create more elaborate visualizations of a decoder problem.
 * For example, you could show the entire JSON object and show the part causing the failure in red.
 */
export interface Error {
    /**
     * Match the current `Error` to provided pattern.
     *
     * @param pattern Pattern matching.
     */
    cata<R>(pattern: Pattern<R>): R;

    /**
     * Convert a decoding `Error` into a `string` that is nice for debugging.
     *
     * @param indent Counter of spaces for JSON.stringify of an `input`.
     */
    stringify(indent: number): string;
}

export namespace Error {
    /**
     * Pattern for matching `Error` variants.
     */
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

export type Pattern<R> = Error.Pattern<R>;

export {
    OneOf,
    Field,
    Index,
    Failure
} from './Error';

export default Error;
