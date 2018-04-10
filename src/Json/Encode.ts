import * as Interfaces from '../Interfaces';

export abstract class Value implements Interfaces.Json.Value {
    public encode(indent: number): string {
        return JSON.stringify(this.serialize(), null, indent);
    }

    public abstract serialize(): Interfaces.Serializable;
}

namespace Encode {
    export class Primitive<T extends null | string | boolean | number> extends Value {
        constructor(private readonly primitive: T) {
            super();
        }

        public serialize(): T {
            return this.primitive;
        }
    }

    export class List extends Value {
        constructor(private readonly list: Array<Value>) {
            super();
        }

        public serialize(): Array<Interfaces.Serializable> {
            const result: Array<Interfaces.Serializable> = [];

            for (const value of this.list) {
                result.push(value.serialize());
            }

            return result;
        }
    }

    export class Object extends Value {
        constructor(private readonly object: {[ key: string ]: Value}) {
            super();
        }

        public serialize(): {[ key: string ]: Interfaces.Serializable } {
            const result: {[ key: string ]: Interfaces.Serializable } = {};

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

export const list = (list: Array<Value>): Value => new Encode.List(list);
export const object = (object: {[ key: string ]: Value }): Value => new Encode.Object(object);
