export class Value {
    constructor(private readonly js: any) {}

    protected static extract(value: Value) {
        return value.js;
    }

    public encode(indent: number): string {
        return JSON.stringify(this.js, null, indent);
    }
}

export function string(value: string): Value {
    return new Value(value);
}

export function number(value: number): Value {
    return new Value(value);
}

export function bool(value: boolean): Value {
    return new Value(value);
}

export const nill = new Value(null);

class List extends Value {
    constructor(config: Array<Value>) {
        const result: Array<string> = [];

        for (const value of config) {
            result.push(
                Value.extract(value)
            );
        }

        super(result);
    }
}

export function list(config: Array<Value>): Value {
    return new List(config);
}

class Obj extends Value {
    constructor(config: Array<[ string, Value ]>) {
        const result: {[ key: string ]: string} = {};

        for (const [ key, value ] of config) {
            result[ key ] = Value.extract(value);
        }

        super(result);
    }
}

export function object(config: Array<[ string, Value ]>): Value {
    return new Obj(config);
}

export const Encode = { string, number, bool, nill, list, object };
