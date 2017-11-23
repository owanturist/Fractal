export abstract class Value {
    protected abstract toJSON(): any;

    public static encode(indent: number, value: Value): string {
        return JSON.stringify(value, null, indent);
    }
}

export const encode = Value.encode;

class Identity<T> extends Value {
    constructor(private readonly value: T) {
        super();
    }

    protected toJSON(): T {
        return this.value;
    }
}

export function string(value: string): Value {
    return new Identity(value);
}

export function number(value: number): Value {
    return new Identity(value);
}

export function bool(value: boolean): Value {
    return new Identity(value);
}

export const nul: Value = new Identity(null);

export function list(value: Array<Value>): Value {
    return new Identity(value);
}

export function object(config: Array<[ string, Value ]>): Value {
    const result: {[ key: string ]: Value } = {};

    for (const [ key, value ] of config) {
        result[ key ] = value;
    }

    return new Identity(result);
}

export const Encode = {
    string,
    number,
    bool,
    nul,
    list,
    object
};
