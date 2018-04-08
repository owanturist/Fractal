export type Serializable<T>
    = null
    | string
    | boolean
    | number
    | Array<T>
    | {[ K in keyof T ]: T[ K ] }
    ;

export abstract class Value {
    protected static run<T>(value: Value): Serializable<T> {
        return value.serialize();
    }

    public encode(indent: number): string {
        return JSON.stringify(this.serialize(), null, indent);
    }

    protected abstract serialize<T>(): Serializable<T>;
}

namespace Encode {
    export class Primitive<T extends Serializable<never>> extends Value {
        constructor(private readonly primitive: T) {
            super();
        }

        protected serialize(): T {
            return this.primitive;
        }
    }

    export class List extends Value {
        constructor(private readonly list: Array<Value>) {
            super();
        }

        protected serialize<T extends Serializable<T>>(): Array<T> {
            const result: Array<T> = [];

            for (const value of this.list) {
                result.push(Value.run(value) as T);
            }

            return result;
        }
    }

    export class Object extends Value {
        constructor(private readonly object: {[ key: string ]: Value}) {
            super();
        }

        public serialize<T, K extends keyof T>(): {[ K in keyof T ]: T[ K ]} {
            const result = {} as {[ K in keyof T ]: Serializable<T[ K ]>};

            for (const key in this.object as {[ K in keyof T ]: Value }) {
                if (this.object.hasOwnProperty(key)) {
                    result[ key ] = Value.run<T[ K ]>(this.object[ key ]) ;
                }
            }

            return result as T;
        }
    }
}

export const nill: Value = new Encode.Primitive(null);

export const string = (string: string): Value => new Encode.Primitive(string);
export const number = (number: number): Value => new Encode.Primitive(number);
export const boolean = (boolean: boolean): Value => new Encode.Primitive(boolean);

export const list = (list: Array<Value>): Value => new Encode.List(list);
export const object = (object: {[ key: string ]: Value }): Value => new Encode.Object(object);
