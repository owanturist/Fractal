import {
    Result,
    Err,
    Ok
} from '../Result';

export abstract class Decoder<T> {
    protected abstract decode(input: any): Result<string, T>;

    public static decodeValue<T>(decoder: Decoder<T>, input: any): Result<string, T> {
        return decoder.decode(input);
    }
}

export const decodeValue = Decoder.decodeValue;

class Primitive<T> extends Decoder<T> {
    constructor(
        private readonly title: string,
        private readonly check: (input: any) => input is T
    ) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        return this.check(input)
            ? Ok(input)
            : Err('Value `' + JSON.stringify(input) + '` is not a ' + this.title + '.')
    }
}

class List<T> extends Decoder<Array<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, Array<T>> {
        if (!(input instanceof Array)) {
            return Err('Value `' + JSON.stringify(input) + '` is not an array.');
        }

        let acc: Result<string, Array<T>> = Ok([]);

        for (const item of input) {
            acc = Result.andThen(
                accResult => Result.map(
                    itemResult => {
                        accResult.push(itemResult);

                        return accResult;
                    },
                    decodeValue(this.decoder, item)
                ),
                acc
            );
        }

        return acc;
    }
}

class Field<T> extends Decoder<T> {
    constructor(
        private readonly key: string,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        if (typeof input !== 'object' || input === null) {
            return Err('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        return this.key in input
            ? decodeValue(this.decoder, input[ this.key ])
            : Err('Field `' + this.key + '` doesn\'t exist in an object ' + JSON.stringify(input) + '.');
    }
}

class Index<T> extends Decoder<T> {
    constructor(
        private readonly index: number,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        if (!(input instanceof Array)) {
            return Err('Value `' + JSON.stringify(input) + '` is not an array.');
        }

        return this.index >= input.length
            ? Err('Need index ' + this.index + ' but there are only ' + input.length + ' entries.')
            : decodeValue(this.decoder, input[ this.index ]);
    }
}

class Fail extends Decoder<any> {
    constructor(private readonly msg: string) {
        super();
    }

    protected decode(): Result<string, any> {
        return Err(this.msg);
    }
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    protected decode(): Result<string, T> {
        return Ok(this.value);
    }
}

class Map<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => R,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decode(input: any): Result<string, R> {
        return Result.map(
            this.fn,
            decodeValue(this.decoder, input)
        );
    }
}

class AndThen <T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => Decoder<R>,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decode(input: any): Result<string, R> {
        return Result.andThen(
            value => decodeValue(this.fn(value), input),
            decodeValue(this.decoder, input)
        );
    }
}

export const Decode = {
    string: new Primitive(
        'string',
        (value: any): value is string => typeof value === 'string'
    ) as Decoder<string>,

    number: new Primitive(
        'number',
        (value: any): value is number => typeof value === 'number'
    ) as Decoder<number>,

    bool: new Primitive(
        'bool',
        (value: any): value is boolean => typeof value === 'boolean'
    ) as Decoder<boolean>,

    list: <T>(decoder: Decoder<T>): Decoder<Array<T>> => new List(decoder),

    field: <T>(key: string, decoder: Decoder<T>): Decoder<T> => new Field(key, decoder),

    at: <T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> => {
        let acc = decoder;

        for (let i = keys.length - 1; i >= 0; i--) {
            acc = new Field(keys[ i ], acc);
        }

        return acc;
    },

    index: <T>(index: number, decoder: Decoder<T>): Decoder<T> => new Index(index, decoder),

    fail: (msg: string): Decoder<any> => new Fail(msg),

    succeed: <T>(value: T): Decoder<T> => new Succeed(value),

    map: <T, R>(fn: (value: T) => R, decoder: Decoder<T>): Decoder<R> => new Map(fn, decoder),

    andThen: <T, R>(fn: (value: T) => Decoder<R>, decoder: Decoder<T>): Decoder<R> => new AndThen(fn, decoder)
};
