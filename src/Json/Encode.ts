import {
    Value,
    isArray
} from '../Basics';
import {
    List as List_
} from '../List';

export type Value = Value;

export abstract class Encoder {
    public encode(indent: number): string {
        return JSON.stringify(this.serialize(), null, indent);
    }

    public abstract serialize(): Value;
}

namespace Encode {
    export class Primitive<T extends null | string | boolean | number> extends Encoder {
        constructor(private readonly primitive: T) {
            super();
        }

        public serialize(): T {
            return this.primitive;
        }
    }

    export class List extends Encoder {
        constructor(private readonly array: Array<Encoder>) {
            super();
        }

        public serialize(): Array<Value> {
            const result: Array<Value> = [];

            for (const value of this.array) {
                result.push(value.serialize());
            }

            return result;
        }
    }

    export class Object extends Encoder {
        constructor(private readonly object: {[ key: string ]: Encoder}) {
            super();
        }

        public serialize(): {[ key: string ]: Value } {
            const result: {[ key: string ]: Value } = {};

            for (const key in this.object) {
                if (this.object.hasOwnProperty(key)) {
                    result[ key ] = this.object[ key ].serialize();
                }
            }

            return result;
        }
    }
}

export const nill: Encoder = new Encode.Primitive(null);

export const string = (string: string): Encoder => new Encode.Primitive(string);
export const number = (number: number): Encoder => new Encode.Primitive(number);
export const boolean = (boolean: boolean): Encoder => new Encode.Primitive(boolean);

export const list = (listOrArray: List_<Encoder> | Array<Encoder>): Encoder => {
    return new Encode.List(
        isArray(listOrArray) ? listOrArray : listOrArray.toArray()
    );
};
export const object = (object: {[ key: string ]: Encoder }): Encoder => new Encode.Object(object);
