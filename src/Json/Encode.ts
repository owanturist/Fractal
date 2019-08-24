import Maybe from '../Maybe';

export namespace Encode {
    export interface Value {
        encode(indent: number): string;

        serialize(): unknown;
    }
}

class Encoder implements Value {
    public constructor(private readonly value: unknown) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): unknown {
        return this.value;
    }
}

export const nill: Value = new Encoder(null);

export function string(string: string): Value {
    return new Encoder(string);
}

export function number(number: number): Value {
    return new Encoder(number);
}

export function boolean(boolean: boolean): Value {
    return new Encoder(boolean);
}

export function nullable<T>(encoder: (value: T) => Value, maybe: Maybe<T>): Value {
    return maybe.map(encoder).getOrElse(nill);
}

export function list(listOfValues: Array<Value>): Value;
export function list<T>(encoder: (value: T) => Value, list: Array<T>): Value;
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

export function object(object: {[ key: string ]: Value }): Value;
// tslint:disable-next-line:unified-signatures
export function object(list: Array<[ string, Value ]>): Value;
export function object(listOrObject: Array<[ string, Value ]> | {[ key: string ]: Value }): Value {
    const acc: {[ key: string ]: unknown } = {};

    if (Array.isArray(listOrObject)) {
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

export type Value = Encode.Value;

export const Encode = {
    nill,
    string,
    number,
    boolean,
    nullable,
    list,
    object
};

export default Encode;
