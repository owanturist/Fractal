import {
    Serializable,
    isArray
} from '../Basics';
import {
    List as List_
} from '../List';

export interface Value {
    serialize(): Serializable;
    encode(indent: number): string;
}

namespace Encode {
    abstract class Encoder implements Value {
        public encode(indent: number): string {
            return JSON.stringify(this.serialize(), null, indent);
        }

        public abstract serialize(): Serializable;
    }

    export class Primitive<T extends null | string | boolean | number> extends Encoder {
        constructor(private readonly primitive: T) {
            super();
        }

        public serialize(): T {
            return this.primitive;
        }
    }

    export class List extends Encoder {
        constructor(private readonly list: List_<Value> | Array<Value>) {
            super();
        }

        public serialize(): Array<Serializable> {
            const list = isArray(this.list) ? this.list : this.list.toArray();
            const result: Array<Serializable> = [];

            for (const value of list) {
                result.push(value.serialize());
            }

            return result;
        }
    }

    export class Object extends Encoder {
        constructor(private readonly object: {[ key: string ]: Value}) {
            super();
        }

        public serialize(): {[ key: string ]: Serializable } {
            const result: {[ key: string ]: Serializable } = {};

            for (const key in this.object) {
                if (this.object.hasOwnProperty(key)) {
                    result[ key ] = this.object[ key ].serialize();
                }
            }

            return result;
        }
    }
}

export const nill: Value = new Encode.Primitive(null);

export const string = (string: string): Value => new Encode.Primitive(string);
export const number = (number: number): Value => new Encode.Primitive(number);
export const boolean = (boolean: boolean): Value => new Encode.Primitive(boolean);

export const list = (list: List_<Value> | Array<Value>): Value => new Encode.List(list);
export const object = (object: {[ key: string ]: Value }): Value => new Encode.Object(object);
