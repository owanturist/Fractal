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

class Object_ extends Value {
    constructor(private readonly value: Array<[ string, Value ]>) {
        super();
    }

    protected toJSON(): {[ key: string ]: Value } {
        const acc: {[ key: string ]: Value } = {};

        for (const [ key, value ] of this.value) {
            acc[ key ] = value;
        }

        return acc;
    }
}

export function object(value: Array<[ string, Value ]>): Value {
    return new Object_(value);
}

export const Encode = {
    string,
    number,
    bool,
    nul,
    list,
    object
};
