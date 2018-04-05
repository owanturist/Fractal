export abstract class Value {
    constructor(private readonly js: any) {}

    protected static extract(value: Value): any {
        return value.js;
    }

    public encode(indent: number): string {
        return JSON.stringify(this.js, null, indent);
    }
}

namespace Encode {
    export class Primitive extends Value {
        constructor(js: any) {
            super(js)
        }
    }

    export class List extends Value {
        constructor(list: Array<Value>) {
            const result: Array<any> = [];

            for (const value of list) {
                result.push(
                    Value.extract(value)
                );
            }

            super(result);
        }
    }

    export class Object extends Value {
        constructor(object: {[ key: string ]: Value}) {
            const result: {[ key: string ]: any} = {};

            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    result[ key ] = Value.extract(object[ key ]);
                }
            }

            super(result);
        }
    }
}

export const nill: Value = new Encode.Primitive(null);

export const string = (string: string): Value => new Encode.Primitive(string);

export const number = (number: number): Value => new Encode.Primitive(number);

export const boolean = (boolean: boolean): Value => new Encode.Primitive(boolean);

export const list = (list:  Array<Value>): Value => new Encode.List(list);

export const object = (object: {[ key: string ]: Value}): Value => new Encode.Object(object);
