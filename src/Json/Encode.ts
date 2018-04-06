export type Serializable<T>
    = null
    | string
    | boolean
    | number
    | Array<T>
    | {[ K in keyof T ]: T[ K ] }
    ;

export interface Value<T extends Serializable<T>> {
    serialize(): T;
    encode(indent: number): string;
}

namespace Encode {
    abstract class Encoder<T, R extends Serializable<R>> implements Value<R> {
        constructor(protected readonly js: T) {}

        public abstract serialize(): R;

        public encode(indent: number): string {
            return JSON.stringify(this.serialize(), null, indent);
        }
    }

    export class Primitive<T extends Serializable<never>> extends Encoder<T, T> {
        public serialize(): T {
            return this.js;
        }
    }

    export class List<T extends Serializable<T>> extends Encoder<Array<Value<T>>, Array<T>> {
        public serialize(): Array<T> {
            const result: Array<T> = [];

            for (const value of this.js) {
                result.push(value.serialize());
            }

            return result;
        }
    }

    export type Props<T extends object> = {[ K in keyof T ]: Value<T[ K ]>};

    export class Object<T extends object> extends Encoder<Props<T>, T> {
        public serialize(): T {
            const result = {} as T; // tslint:disable-line no-object-literal-type-assertion

            for (const key in this.js) {
                if (this.js.hasOwnProperty(key)) {
                    result[ key ] = this.js[ key ].serialize();
                }
            }

            return result;
        }
    }
}

export const nill: Value<null> = new Encode.Primitive(null);

export const string = (string: string): Value<string> => new Encode.Primitive(string);
export const number = (number: number): Value<number> => new Encode.Primitive(number);
export const boolean = (boolean: boolean): Value<boolean> => new Encode.Primitive(boolean);

export const list = <T extends Serializable<T>>(list: Array<Value<T>>): Value<Array<T>> => new Encode.List(list);
export const object = <T extends object>(object: Encode.Props<T>): Value<T> => new Encode.Object(object);
