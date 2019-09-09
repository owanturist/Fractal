import Maybe from '../../Maybe';
import Either from '../../Either';
import Encode from '../Encode';

import _Error from './Error';
import * as _ from './Decode';

interface Common {
    string: _.Decoder<unknown>;
    boolean: _.Decoder<unknown>;
    int: _.Decoder<unknown>;
    float: _.Decoder<unknown>;

    of<T>(decoder: _.Decoder<T>): _.Decoder<unknown>;
    oneOf<T>(decoders: Array<_.Decoder<T>>): _.Decoder<unknown>;

    props<T extends {}>(config: {[ K in keyof T ]: _.Decoder<T[ K ]>}): _.Decoder<unknown>;
    list<T>(decoder: _.Decoder<T>): _.Decoder<unknown>;
    dict<T>(decoder: _.Decoder<T>): _.Decoder<unknown>;

    keyValue<T>(decoder: _.Decoder<T>): _.Decoder<unknown>;
    keyValue<K, T>(convertKey: (key: string) => Either<string, K>, decoder: _.Decoder<T>): _.Decoder<unknown>;

    field(key: string): unknown;
    index(position: number): unknown;
    at(path: Array<string | number>): unknown;
}

interface Required extends Common {
    value: _.Decoder<unknown>;
    optional: Optional;
    lazy<T>(callDecoder: () => _.Decoder<T>): _.Decoder<unknown>;
}

export namespace Decode {
    // tslint:disable-next-line:no-empty-interface
    export interface Error extends _Error {}

    export const Error = _Error;

    export namespace Error {
        export type Pattern<R> = _Error.Pattern<R>;
    }

    // tslint:disable-next-line:no-empty-interface
    export interface Value extends Encode.Value {}

    export abstract class Decoder<T> extends _.Decoder<T> {}

    export interface Path extends Required {
        string: Decoder<string>;
        boolean: Decoder<boolean>;
        int: Decoder<number>;
        float: Decoder<number>;
        value: Decoder<Encode.Value>;

        optional: Optional;

        of<T>(decoder: Decoder<T>): Decoder<T>;
        oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T>;

        props<T extends {}>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T>;
        list<T>(decoder: Decoder<T>): Decoder<Array<T>>;
        dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T}>;

        keyValue<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;
        keyValue<K, T>(
            convertKey: (key: string) => Either<string, K>,
            decoder: Decoder<T>
        ): Decoder<Array<[ K, T ]>>;

        lazy<T>(callDecoder: () => Decoder<T>): Decoder<T>;

        field(key: string): Path;
        index(position: number): Path;
        at(path: Array<string | number>): Path;
    }

    export interface OptionalPath extends Required {
        string: Decoder<Maybe<string>>;
        boolean: Decoder<Maybe<boolean>>;
        int: Decoder<Maybe<number>>;
        float: Decoder<Maybe<number>>;
        value: Decoder<Maybe<Encode.Value>>;

        optional: Optional;

        of<T>(decoder: Decoder<T>): Decoder<Maybe<T>>;
        oneOf<T>(decoders: Array<Decoder<T>>): Decoder<Maybe<T>>;

        props<T extends {}>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<Maybe<T>>;
        list<T>(decoder: Decoder<T>): Decoder<Maybe<Array<T>>>;
        dict<T>(decoder: Decoder<T>): Decoder<Maybe<{[ key: string ]: T}>>;

        keyValue<T>(decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;
        keyValue<K, T>(
            convertKey: (key: string) => Either<string, K>,
            decoder: Decoder<T>
        ): Decoder<Maybe<Array<[ K, T ]>>>;

        lazy<T>(callDecoder: () => Decoder<T>): Decoder<Maybe<T>>;

        field(key: string): OptionalPath;
        index(position: number): OptionalPath;
        at(path: Array<string | number>): OptionalPath;
    }

    export interface Optional extends Common {
        string: Decoder<Maybe<string>>;
        boolean: Decoder<Maybe<boolean>>;
        int: Decoder<Maybe<number>>;
        float: Decoder<Maybe<number>>;

        of<T>(decoder: Decoder<T>): Decoder<Maybe<T>>;
        oneOf<T>(decoders: Array<Decoder<T>>): Decoder<Maybe<T>>;

        props<T extends {}>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<Maybe<T>>;
        list<T>(decoder: Decoder<T>): Decoder<Maybe<Array<T>>>;
        dict<T>(decoder: Decoder<T>): Decoder<Maybe<{[ key: string ]: T}>>;

        keyValue<T>(decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;
        keyValue<K, T>(
            convertKey: (key: string) => Either<string, K>,
            decoder: Decoder<T>
        ): Decoder<Maybe<Array<[ K, T ]>>>;

        field(key: string): OptionalPath;
        index(position: number): OptionalPath;
        at(path: Array<string | number>): OptionalPath;
    }

    export const value = _.value;
    export const string = _.string;
    export const boolean = _.boolean;
    export const int = _.int;
    export const float = _.float;
    export const fail = _.fail;
    export const succeed = _.succeed;
    export const props = _.props;
    export const oneOf = _.oneOf;
    export const list = _.list;
    export const keyValue = _.keyValue;
    export const dict = _.dict;
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

// tslint:disable-next-line:no-empty-interface
export interface Value extends Decode.Value {}

// tslint:disable-next-line:no-empty-interface
export interface Path extends Decode.Path {}

// tslint:disable-next-line:no-empty-interface
export interface OptionalPath extends Decode.OptionalPath {}

// tslint:disable-next-line:no-empty-interface
export interface Optional extends Decode.Optional {}

export {
    Decoder,
    value,
    string,
    boolean,
    int,
    float,
    fail,
    succeed,
    props,
    oneOf,
    list,
    keyValue,
    dict,
    lazy,
    field,
    index,
    at,
    optional,
    fromEither,
    fromMaybe
} from './Decode';

export default Decode;

