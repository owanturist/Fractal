import {
    isArray
} from '../Basics';
import Maybe from '../Maybe';

class Encoder implements Value {
    public constructor(private readonly value: unknown) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): unknown {
        return this.value;
    }
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
    export function string(string: string): Value {
        return new Encoder(string);
    }

    /**
     * Turns a `number` into a JSON number.
     *
     * @param number Value to turn.
     *
     * @example
     * string(1).encode(0)   // '1'
     * string(1).serialize() // 1
     */
    export function number(number: number): Value {
        return new Encoder(number);
    }

    /**
     * Turns a `boolean` into a JSON boolean.
     *
     * @param boolean Value to turn.
     *
     * @example
     * string(true).encode(0)   // 'true'
     * string(true).serialize() // true
     */
    export function boolean(boolean: boolean): Value {
        return new Encoder(boolean);
    }

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
    export function nullable<T>(encoder: (value: T) => Value, maybe: Maybe<T>): Value {
        return maybe.map(encoder).getOrElse(nill);
    }

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
    export function list<T>(encoder: (value: T) => Value, list: Array<T>): Value;

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
    export function list(listOfValues: Array<Value>): Value;

    export function list<T>(...args: [ Array<Value> ] | [ (value: T) => Value, Array<T> ]): Value {
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
    }

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
    export function object(objectOfValues: {[ key: string ]: Value }): Value;

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
    export function object(listOfKeyValues: Array<[ string, Value ]>): Value;
    export function object(listOrObject: Array<[ string, Value ]> | {[ key: string ]: Value }): Value {
        const acc: {[ key: string ]: unknown } = {};

        if (isArray(listOrObject)) {
            for (const [ key, value ] of listOrObject) {
                acc[ key ] = value.serialize();
            }
        } else {
            for (const key in listOrObject) {
                if (listOrObject.hasOwnProperty(key)) {
                    acc[ key ] = listOrObject[ key ].serialize();
                }
            }
        }

        return new Encoder(acc);
    }
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
