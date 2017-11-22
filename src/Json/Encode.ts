export abstract class Value {
    protected abstract encode(): string;

    public static encode(value: Value): string {
        return value.encode();
    }
}

export const encode = Value.encode;

class String extends Value {
    constructor(private readonly value: string) {
        super();
    }

    protected encode(): string {
        return this.value;
    }
}

export function string(value: string): Value {
    return new String(value);
}

class Number extends Value {
    constructor(private readonly value: number) {
        super();
    }

    protected encode(): string {
        return JSON.stringify(this.value);
    }
}

export function number(value: number): Value {
    return new Number(value);
}

class Bool extends Value {
    constructor(private readonly value: boolean) {
        super();
    }

    protected encode(): string {
        return JSON.stringify(this.value);
    }
}

export function bool(value: boolean): Value {
    return new Bool(value);
}

class Nul extends Value {
    protected encode(): string {
        return 'null';
    }
}

export const nul: Value = new Nul();

class List extends Value {
    constructor(private readonly value: Array<Value>) {
        super();
    }

    protected encode(): string {
        const acc: Array<string> = [];

        for (const item of this.value) {
            acc.push(encode(item))
        }

        return JSON.stringify(acc);
    }
}

export function list(value: Array<Value>): Value {
    return new List(value);
}

class Object extends Value {
    constructor(private readonly value: Array<[ string, Value ]>) {
        super();
    }

    protected encode(): string {
        const acc: {[ key: string ]: string } = {};

        for (const [ key, value ] of this.value) {
            acc[ key ] = encode(value);
        }

        return JSON.stringify(acc);
    }
}

export function object(value: Array<[ string, Value ]>): Value {
    return new Object(value);
}
