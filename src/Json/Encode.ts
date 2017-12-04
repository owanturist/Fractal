export class Value {
    constructor(private readonly value: any) {}

    protected toJSON(): any {
        return this.value;
    }
}

export function encode(indent: number, value: Value): string {
    return JSON.stringify(value, null, indent);
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

export const nul: Value = new Value(null);

export function list(value: Array<Value>): Value {
    return new Value(value);
}

export function object(config: Array<[ string, Value ]>): Value {
    const result: {[ key: string ]: Value } = {};

    for (const [ key, value ] of config) {
        result[ key ] = value;
    }

    return new Value(result);
}

export const Encode = {
    string,
    number,
    bool,
    nul,
    list,
    object
};
