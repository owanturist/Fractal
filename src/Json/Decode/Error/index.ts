import * as _ from './Error';

export {
    Pattern,
    OneOf,
    Field,
    Index,
    Failure
} from './Error';

export type Error = _.Error;

export namespace Error {
    export type Pattern<R> = _.Pattern<R>;

    export const OneOf = _.OneOf;

    export const Field = _.Field;

    export const Index = _.Index;

    export const Failure = _.Failure;
}

export default Error;
