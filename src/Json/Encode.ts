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

    export class Object<T extends object> extends Encoder<{[ K in keyof T ]: Value<T[ K ]>}, T> {
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

export function string(string: string): Value<string> {
    return new Encode.Primitive(string);
}

export function number(number: number): Value<number> {
    return new Encode.Primitive(number);
}

export function boolean(boolean: boolean): Value<boolean> {
    return new Encode.Primitive(boolean);
}

export function list<T extends Serializable<T>>(list: Array<Value<T>>): Value<Array<T>> {
    return new Encode.List(list);
}

export function object<T extends object>(object: {[ K in keyof T ]: Value<T[ K ]>}) {
    return new Encode.Object(object);
}
