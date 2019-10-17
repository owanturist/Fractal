import {
    isArray
} from '../../Basics';
import Maybe from '../../Maybe';
import Encoder from './Encoder';

interface List {
    /**
     * Turns a list of `Value` into a JSON value.
     *
     * @param listOfValues Value to turn.
     *
     * @example
     * list([
     *     number(0),
     *     boolean(true),
     *     string('str'),
     *     nill
     * ]).encode(0)
     * // '[0,true,"str",null]'
     *
     * list([
     *     number(0),
     *     boolean(true),
     *     string('str'),
     *     nill
     * ]).serialize()
     * // [ 0, true, 'str', null]
     */
    (listOfValues: Array<Value>): Value;

    /**
     * Turns a `list` into a JSON value according `encoder` function.
     *
     * @param encoder Function to turn `list` item to JSON.
     * @param list    List of values to turn.
     *
     * @example
     * list(number, [ 0, 2, 3 ]).encode(0)   // '[0,2,3]'
     * list(number, [ 0, 2, 3 ]).serialize() // [ 0, 2, 3 ]
     */
    <T>(encoder: (value: T) => Value, list: Array<T>): Value;
}

interface Obj {
    /**
     * Creates a JSON object.
     *
     * @param objectOfValues Object of `Value` to turn.
     *
     * @example
     * object({
     *    bar: string('str'),
     *    baz: number(0),
     *    foo: boolean(false)
     * }).encode(0)
     * // '{"bar":"str","baz":0,"foo":false}'
     */
    (objectOfValues: {[ key: string ]: Value }): Value;

    /**
     * Creates a JSON object.
     *
     * @param objectOfValues Object of `Value` to turn.
     *
     * @example
     * object([
     *     [ 'bar', string('str') ],
     *     [ 'baz', number(0) ],
     *     [ 'foo', boolean(false) ]
     * ]).encode(0)
     * // '{"bar":"str","baz":0,"foo":false}'
     */
    // tslint:disable-next-line:unified-signatures
    (listOfKeyValues: Array<[ string, Value ]>): Value;

    // tslint:disable-next-line:unified-signatures
    (objectOfOptionalValues: {[ key: string ]: Maybe<Value> }): Value;

    // tslint:disable-next-line:unified-signatures
    (listOfOptionalKeyValues: Array<[ string, Maybe<Value> ]>): Value;
}

export namespace Encode {
    export interface Value {
        /**
         * Converts the `Value` into a prettified string.
         *
         * @param indent Specifies the amount of indentation in the resulting string.
         *
         * @example
         * object({
         *    bar: string('str'),
         *    baz: number(0),
         *    foo: boolean(false)
         * }).encode(0)
         * // '{"bar":"str","baz":0,"foo":false}'
         *
         * object({
         *    bar: string('str'),
         *    baz: number(0),
         *    foo: boolean(false)
         * }).encode(0)
         * // `{↵
         * // ····"bar":·"str",↵
         * // ····"baz":·0,↵
         * // ····"foo":·false↵
         * // }`
         */
        encode(indent: number): string;

        /**
         * Converts the `Value` into plaing JS.
         *
         * @example
         * object([
         *     [ '_bar', string('str') ],
         *     [ '_baz', number(0) ],
         *     [ '_foo', boolean(false) ]
         * ]).serialize() // { _bar: 'str, _baz: 0, _foo: false }
         */
        serialize(): unknown;

        tap<R>(fn: (value: Value) => R): R;
    }

    /**
     * Creates a JSON `null` value.
     *
     * @example
     * nill.encode(0)   // 'null'
     * nill.serialize() // null
     */
    export const nill: Value = new Encoder(null);

    /**
     * Turns a `string` into a JSON string.
     *
     * @param string Value to turn.
     *
     * @example
     * string('str').encode(0)   // '"str"'
     * string('str').serialize() // 'str'
     */
    export const string = (string: string): Value => new Encoder(string);

    /**
     * Turns a `number` into a JSON number.
     *
     * @param number Value to turn.
     *
     * @example
     * string(1).encode(0)   // '1'
     * string(1).serialize() // 1
     */
    export const number = (number: number): Value => new Encoder(number);

    /**
     * Turns a `boolean` into a JSON boolean.
     *
     * @param boolean Value to turn.
     *
     * @example
     * string(true).encode(0)   // 'true'
     * string(true).serialize() // true
     */
    export const boolean = (boolean: boolean): Value => new Encoder(boolean);

    /**
     * Converts a `maybe` into a JSON value.
     * Turns `Nothing` to null and `Just` to `encoder` result.
     *
     * @param encoder Function to turn `Just` variant.
     * @param maybe   Value to convert.
     *
     * @example
     * nullable(number, Nothing).serialize() // null
     * nullable(number, Just(1)).serialize() // 0
     */
    export const nullable = <T>(encoder: (value: T) => Value, maybe: Maybe<T>): Value => {
        return maybe.map(encoder).getOrElse(nill);
    };

    export const list: List = <T>(...args: [ Array<Value> ] | [ (value: T) => Value, Array<T> ]): Value => {
        const acc: Array<unknown> = [];

        if (args.length === 1) {
            for (const value of args[ 0 ]) {
                acc.push(value.serialize());
            }
        } else {
            for (const item of args[ 1 ]) {
                acc.push(args[ 0 ](item).serialize());
            }
        }

        return new Encoder(acc);
    };

    export const object: Obj = (
        listOrObject: Array<[ string, Value ]>
                    | {[ key: string ]: Value }
                    | Array<[ string, Maybe<Value> ]>
                    | {[ key: string ]: Maybe<Value> }
    ): Value => {
        const acc: {[ key: string ]: unknown } = {};

        if (isArray(listOrObject)) {
            for (const [ key, valueOrOptionalValue ] of listOrObject) {
                if ('serialize' in valueOrOptionalValue) {
                    acc[ key ] = valueOrOptionalValue.serialize();
                } else if (valueOrOptionalValue.isJust()) {
                    acc[ key ] = valueOrOptionalValue.getOrElse(nill).serialize();
                }
            }
        } else {
            for (const key in listOrObject) {
                if (listOrObject.hasOwnProperty(key)) {
                    const valueOrOptionalValue = listOrObject[ key ];

                    if ('serialize' in valueOrOptionalValue) {
                        acc[ key ] = valueOrOptionalValue.serialize();
                    } else if (valueOrOptionalValue.isJust()) {
                        acc[ key ] = valueOrOptionalValue.getOrElse(nill).serialize();
                    }
                }
            }
        }

        return new Encoder(acc);
    };
}

/**
 * @alias `Encode.Value`
 */
export type Value = Encode.Value;

/**
 * @alias `Encode.nill`
 */
export const nill = Encode.nill;

/**
 * @alias `Encode.string`
 */
export const string = Encode.string;

/**
 * @alias `Encode.number`
 */
export const number = Encode.number;

/**
 * @alias `Encode.boolean`
 */
export const boolean = Encode.boolean;

/**
 * @alias `Encode.nullable`
 */
export const nullable = Encode.nullable;

/**
 * @alias `Encode.list`
 */
export const list = Encode.list;

/**
 * @alias `Encode.object`
 */
export const object = Encode.object;

/**
 * @alias `Encode`
 */
export default Encode;
