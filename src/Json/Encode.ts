import Maybe from '../Maybe';

interface ValueArray extends Array<Encode.Value> {}

export namespace Encode {
    export type Value
        = null
        | string
        | boolean
        | number
        | ValueArray
        | {[ key: string ]: Value }
        ;
}

export abstract class Encode {
    public static get nill(): Encode {
        return Primitive.NULL;
    }

    public static string(string: string): Encode {
        return new Primitive(string);
    }

    public static number(number: number): Encode {
        return new Primitive(number);
    }

    public static boolean(boolean: boolean): Encode {
        return new Primitive(boolean);
    }

    public static nullable<T>(encoder: (value: T) => Encode, maybe: Maybe<T>): Encode {
        return maybe.map(encoder).getOrElse(Encode.nill);
    }

    public static list(encoders: Array<Encode>): Encode;
    public static list<T>(encoder: (value: T) => Encode, values: Array<T>): Encode;
    public static list<T>(encoderOrEncoders: Array<Encode> | ((value: T) => Encode), values?: Array<T>): Encode {
        if (Array.isArray(encoderOrEncoders)) {
            return new List(encoderOrEncoders);
        }

        const encoders: Array<Encode> = [];

        for (const value of values as Array<T>) {
            encoders.push(encoderOrEncoders(value));
        }

        return new List(encoders);
    }

    public static object(object: {[ key: string ]: Encode }): Encode;
    // tslint:disable-next-line:unified-signatures
    public static object(list: Array<[ string, Encode ]>): Encode;
    public static object(config: Array<[ string, Encode ]> | {[ key: string ]: Encode }): Encode {
        if (!Array.isArray(config)) {
            return new Obj(config);
        }

        const config_: {[ key: string ]: Encode } = {};

        for (const [ key, encode ] of config) {
            config_[ key ] = encode;
        }

        return new Obj(config_);
    }

    public encode(indent: number): string {
        return JSON.stringify(this.serialize(), null, indent);
    }

    public abstract serialize(): Encode.Value;
}

class Primitive<T extends null | string | boolean | number> extends Encode {
    public static readonly NULL: Encode = new Primitive(null);

    constructor(private readonly primitive: T) {
        super();
    }

    public serialize(): Encode.Value {
        return this.primitive;
    }
}

class List extends Encode {
    constructor(private readonly array: Array<Encode>) {
        super();
    }

    public serialize(): Encode.Value {
        const result: Array<Encode.Value> = [];

        for (const value of this.array) {
            result.push(value.serialize());
        }

        return result;
    }
}

class Obj extends Encode {
    constructor(private readonly object: {[ key: string ]: Encode }) {
        super();
    }

    public serialize(): {[ key: string ]: Encode.Value } {
        const result: {[ key: string ]: Encode.Value } = {};

        for (const key in this.object) {
            if (this.object.hasOwnProperty(key)) {
                result[ key ] = this.object[ key ].serialize();
            }
        }

        return result;
    }
}

export type Value = Encode.Value;

export const nill = Encode.nill;

export const string = Encode.string;

export const number = Encode.number;

export const boolean = Encode.boolean;

export const nullable = Encode.nullable;

export const list = Encode.list;

export const object = Encode.object;

export default Encode;
