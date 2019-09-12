import Encode from '../Encode';

import _Error from './Error';
import * as _ from './Decode';

export namespace Decode {
    // tslint:disable-next-line:no-empty-interface
    export interface Error extends _Error {}

    export const Error = _Error;

    export namespace Error {
        export type Pattern<R> = _Error.Pattern<R>;
    }

    // tslint:disable-next-line:no-empty-interface
    export interface Value extends Encode.Value {}

    // tslint:disable-next-line:no-empty-interface
    export interface Path extends _.Path {}

    // tslint:disable-next-line:no-empty-interface
    export interface OptionalPath extends _.OptionalPath {}

    // tslint:disable-next-line:no-empty-interface
    export interface Optional extends _.Optional {}

    export abstract class Decoder<T> extends _.Decoder<T> {}

    export const value = _.value;
    export const string = _.string;
    export const boolean = _.boolean;
    export const int = _.int;
    export const float = _.float;
    export const fail = _.fail;
    export const succeed = _.succeed;
    export const shape = _.shape;
    export const list = _.list;
    export const keyValue = _.keyValue;
    export const dict = _.dict;
    export const oneOf = _.oneOf;
    export const enums = _.enums;
    export const lazy = _.lazy;
    export const field = _.field;
    export const index = _.index;
    export const at = _.at;
    export const optional = _.optional;
    export const fromEither = _.fromEither;
    export const fromMaybe = _.fromMaybe;
}

export {
    Error
} from './Error';

export {
    Value
} from '../Encode';

export {
    Path,
    OptionalPath,
    Optional,
    Decoder,
    value,
    string,
    boolean,
    int,
    float,
    fail,
    succeed,
    shape,
    list,
    keyValue,
    dict,
    oneOf,
    enums,
    lazy,
    field,
    index,
    at,
    optional,
    fromEither,
    fromMaybe
} from './Decode';

export default Decode;
