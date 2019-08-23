import Maybe from '../Maybe';


export namespace Encode {
    interface ValueArray extends Array<Value> {}

    export type Value
        = null
        | string
        | boolean
        | number
        | ValueArray
        | {[ key: string ]: Value }
        ;
}

export class Encode {
    public static nill: Encode = new Encode(null);

    public static string(string: string): Encode {
        return new Encode(string);
    }

    public static number(number: number): Encode {
        return new Encode(number);
    }

    public static boolean(boolean: boolean): Encode {
        return new Encode(boolean);
    }

    public static nullable<T>(encoder: (value: T) => Encode, maybe: Maybe<T>): Encode {
        return maybe.map(encoder).getOrElse(Encode.nill);
    }

    public static list(listOfEncode: Array<Encode>): Encode;
    public static list<T>(encoder: (value: T) => Encode, values: Array<T>): Encode;
    public static list<T>(...args: [ Array<Encode> ] | [ (value: T) => Encode, Array<T> ]): Encode {
        const acc: Array<Value> = [];

        if (args.length === 1) {
            for (const encode of args[ 0 ]) {
                acc.push(encode.value);
            }
        } else {
            for (const val of args[ 1 ]) {
                acc.push(args[ 0 ](val).value);
            }
        }

        return new Encode(acc);
    }

    public static object(object: {[ key: string ]: Encode }): Encode;
    // tslint:disable-next-line:unified-signatures
    public static object(list: Array<[ string, Encode ]>): Encode;
    public static object(listOrObject: Array<[ string, Encode ]> | {[ key: string ]: Encode }): Encode {
        const acc: {[ key: string ]: Value } = {};

        if (Array.isArray(listOrObject)) {
            for (const [ key, encode ] of listOrObject) {
                acc[ key ] = encode.value;
            }
        } else {
            for (const key in listOrObject) {
                if (listOrObject.hasOwnProperty(key)) {
                    acc[ key ] = listOrObject[ key ].value;
                }
            }
        }

        return new Encode(acc);
    }

    private constructor(private readonly value: Value) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): Value {
        return this.value;
    }
}

export type Value = Encode.Value;

export const nill = Encode.nill;

export const string = Encode.string;

export const number = Encode.number;

export const boolean = Encode.boolean;

export const nullable = Encode.nullable;

export const list = Encode.list;

export const object = Encode.object;

export default Encode;
