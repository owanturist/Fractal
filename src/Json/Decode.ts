import {
    Maybe as Maybe_,
    Nothing,
    Just
} from '../Maybe';
import {
    Result,
    Err,
    Ok
} from '../Result';
import {
    Value as Value_
} from './Encode';

export abstract class Decoder<T> {
    protected abstract decode(input: any): Result<string, T>;

    public static decode<T>(decoder: Decoder<T>, input: any): Result<string, T> {
        return decoder.decode(input);
    }
}

export const decodeValue = Decoder.decode;

export const decodeString = <T>(decoder: Decoder<T>, str: string): Result<string, T> => {
    try {
        return decodeValue(decoder, JSON.parse(str));
    } catch (err) {
        return Err(err.message);
    }
};

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

export const string: Decoder<string> = new Primitive(
    'string',
    (value: any): value is string => typeof value === 'string'
);

export const number: Decoder<number> = new Primitive(
    'number',
    (value: any): value is number => typeof value === 'number'
);

export const bool: Decoder<boolean> = new Primitive(
    'bool',
    (value: any): value is boolean => typeof value === 'boolean'
);

class Nullable<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, Maybe_<T>> {
        return input === null
            ? Ok(Nothing)
            : Result.map(Just, decodeValue(this.decoder, input))
    }
}

export function nullable<T>(decoder: Decoder<T>): Decoder<Maybe_<T>> {
    return new Nullable(decoder);
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

export function list<T>(decoder: Decoder<T>): Decoder<Array<T>> {
    return new List(decoder);
}

class Dict<T> extends Decoder<{[ key: string ]: T}> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, {[ key: string ]: T}> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Err('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        let acc: Result<string, {[ key: string ]: T}> = Ok({});

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = Result.andThen(
                    accResult => Result.map(
                        itemResult => {
                            accResult[ key ] = itemResult;

                            return accResult;
                        },
                        decodeValue(this.decoder, input[ key ])
                    ),
                    acc
                );
            }
        }

        return acc;
    }
}

export function dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T}> {
    return new Dict(decoder);
}

class KeyValuePairs<T> extends Decoder<Array<[ string, T ]>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, Array<[ string, T ]>> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Err('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        let acc: Result<string, Array<[ string, T ]>> = Ok([]);

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = Result.andThen(
                    accResult => Result.map(
                        itemResult => {
                            accResult.push([ key, itemResult ]);

                            return accResult;
                        },
                        decodeValue(this.decoder, input[ key ])
                    ),
                    acc
                );
            }
        }

        return acc;
    }
}

export function keyValuePairs<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> {
    return new KeyValuePairs(decoder)
}

class Field<T> extends Decoder<T> {
    constructor(
        private readonly key: string,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Err('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        return this.key in input
            ? decodeValue(this.decoder, input[ this.key ])
            : Err('Field `' + this.key + '` doesn\'t exist in an object ' + JSON.stringify(input) + '.');
    }
}

export function field<T>(key: string, decoder: Decoder<T>): Decoder<T> {
    return new Field(key, decoder);
}

export function at<T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> {
    let acc = decoder;

    for (let i = keys.length - 1; i >= 0; i--) {
        acc = new Field(keys[ i ], acc);
    }

    return acc;
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

export function index<T>(index: number, decoder: Decoder<T>): Decoder<T> {
    return new Index(index, decoder);
}

class Maybe<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, Maybe_<T>> {
        return Ok(
            Result.toMaybe(
                decodeValue(this.decoder, input)
            )
        );
    }
}

export function maybe<T>(decoder: Decoder<T>): Decoder<Maybe_<T>> {
    return new Maybe(decoder);
}

class OneOf<T> extends Decoder<T> {
    constructor(private readonly decoders: Array<Decoder<T>>) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        if (this.decoders.length === 1) {
            return decodeValue(this.decoders[ 0 ], input);
        }

        let acc: Result<string, T> = Err('OneOf Decoder shouldn\'t be empty.');

        for (const decoder of this.decoders) {
            acc = Result.cata({
                Err: accErr => Result.mapError(
                    err => accErr + '\n' + err,
                    decodeValue(decoder, input)
                ),

                Ok: Ok
            }, acc)
        }

        return acc;
    }
}

export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
    return new OneOf(decoders);
}

class Lazy<T> extends Decoder<T> {
    constructor(private readonly callDecoder: () => Decoder<T>) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        return decodeValue(this.callDecoder(), input);
    }
}

export function lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
    return new Lazy(callDecoder);
}

class Value extends Decoder<any> {
    protected decode(input: any): Result<string, Value_> {
        return Ok(new Value_(input));
    }
}

export const value = new Value();

class Nul<T> extends Decoder<T> {
    constructor(private readonly defaults: T) {
        super();
    }

    protected decode(input: any): Result<string, T> {
        return input === null
            ? Ok(this.defaults)
            : Err('Value `' + JSON.stringify(input) + '` is not a null.')
    }
}

export function nul<T>(defaults: T): Decoder<T> {
    return new Nul(defaults);
}

class Fail extends Decoder<any> {
    constructor(private readonly msg: string) {
        super();
    }

    protected decode(): Result<string, any> {
        return Err(this.msg);
    }
}

export function fail(msg: string): Decoder<any> {
    return new Fail(msg);
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    protected decode(): Result<string, T> {
        return Ok(this.value);
    }
}

export function succeed<T>(value: T): Decoder<T> {
    return new Succeed(value);
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

export function map<T, R>(fn: (value: T) => R, decoder: Decoder<T>): Decoder<R> {
    return new Map(fn, decoder);
}

export function map2<T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>
    ): Decoder<R> {
    return andThen(
        t1 => map(
            t2 => fn(t1, t2),
            d2
        ),
        d1
    );
}

export function map3<T1, T2, T3, R>(
        fn: (t1: T1, t2: T2, t3: T3) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>
    ): Decoder<R> {
    return andThen(
        t1 => map2(
            (t2, t3) => fn(t1, t2, t3),
            d2,
            d3
        ),
        d1
    );
}

export function map4<T1, T2, T3, T4, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>
    ): Decoder<R> {
    return andThen(
        t1 => map3(
            (t2, t3, t4) => fn(t1, t2, t3, t4),
            d2,
            d3,
            d4
        ),
        d1
    );
}

export function map5<T1, T2, T3, T4, T5, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>
    ): Decoder<R> {
    return andThen(
        t1 => map4(
            (t2, t3, t4, t5) => fn(t1, t2, t3, t4, t5),
            d2,
            d3,
            d4,
            d5
        ),
        d1
    );
}

export function map6<T1, T2, T3, T4, T5, T6, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>
    ): Decoder<R> {
    return andThen(
        t1 => map5(
            (t2, t3, t4, t5, t6) => fn(t1, t2, t3, t4, t5, t6),
            d2,
            d3,
            d4,
            d5,
            d6
        ),
        d1
    );
}

export function map7<T1, T2, T3, T4, T5, T6, T7, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>,
        d7: Decoder<T7>
    ): Decoder<R> {
    return andThen(
        t1 => map6(
            (t2, t3, t4, t5, t6, t7) => fn(t1, t2, t3, t4, t5, t6, t7),
            d2,
            d3,
            d4,
            d5,
            d6,
            d7
        ),
        d1
    );
}

export function map8<T1, T2, T3, T4, T5, T6, T7, T8, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>,
        d7: Decoder<T7>,
        d8: Decoder<T8>
    ): Decoder<R> {
    return andThen(
        t1 => map7(
            (t2, t3, t4, t5, t6, t7, t8) => fn(t1, t2, t3, t4, t5, t6, t7, t8),
            d2,
            d3,
            d4,
            d5,
            d6,
            d7,
            d8
        ),
        d1
    );
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

export function andThen<T, R>(fn: (value: T) => Decoder<R>, decoder: Decoder<T>): Decoder<R> {
    return new AndThen(fn, decoder);
}

export const Decode = {
    string,
    number,
    bool,

    nullable,
    list,
    dict,
    keyValuePairs,
    field,
    at,
    index,
    maybe,
    oneOf,
    lazy,
    value,
    nul,
    fail,
    succeed,

    map,
    map2,
    map3,
    map4,
    map5,
    map6,
    map7,
    map8,
    andThen
};
