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

export abstract class Decoder<T> {
    protected abstract decode(input: any): Result<string, T>;

    public static decodeValue<T>(decoder: Decoder<T>, input: any): Result<string, T> {
        return decoder.decode(input);
    }
}

export const decodeValue = Decoder.decodeValue;

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

    nullable: <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Nullable(decoder),

    list: <T>(decoder: Decoder<T>): Decoder<Array<T>> => new List(decoder),

    dict: <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T}> => new Dict(decoder),

    keyValuePairs: <T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> => new KeyValuePairs(decoder),

    field: <T>(key: string, decoder: Decoder<T>): Decoder<T> => new Field(key, decoder),

    at: <T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> => {
        let acc = decoder;

        for (let i = keys.length - 1; i >= 0; i--) {
            acc = new Field(keys[ i ], acc);
        }

        return acc;
    },

    index: <T>(index: number, decoder: Decoder<T>): Decoder<T> => new Index(index, decoder),

    maybe: <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Maybe(decoder),

    oneOf: <T>(decoders: Array<Decoder<T>>): Decoder<T> => new OneOf(decoders),

    nul: <T>(defaults: T): Decoder<T> => new Nul(defaults),

    fail: (msg: string): Decoder<any> => new Fail(msg),

    succeed: <T>(value: T): Decoder<T> => new Succeed(value),

    map: <T, R>(fn: (value: T) => R, decoder: Decoder<T>): Decoder<R> => new Map(fn, decoder),

    map2: <T1, T2, R>(
        fn: (t1: T1, t2: T2) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>
    ): Decoder<R> => new AndThen(
        t1 => new Map(
            t2 => fn(t1, t2),
            d2
        ),
        d1
    ),

    map3: <T1, T2, T3, R>(
        fn: (t1: T1, t2: T2, t3: T3) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new Map(
                t3 => fn(t1, t2, t3),
                d3
            ),
            d2
        ),
        d1
    ),

    map4: <T1, T2, T3, T4, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new AndThen(
                t3 => new Map(
                    t4 => fn(t1, t2, t3, t4),
                    d4
                ),
                d3
            ),
            d2
        ),
        d1
    ),

    map5: <T1, T2, T3, T4, T5, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new AndThen(
                t3 => new AndThen(
                    t4 => new Map(
                        t5 => fn(t1, t2, t3, t4, t5),
                        d5
                    ),
                    d4
                ),
                d3
            ),
            d2
        ),
        d1
    ),

    map6: <T1, T2, T3, T4, T5, T6, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new AndThen(
                t3 => new AndThen(
                    t4 => new AndThen(
                        t5 => new Map(
                            t6 => fn(t1, t2, t3, t4, t5, t6),
                            d6
                        ),
                        d5
                    ),
                    d4
                ),
                d3
            ),
            d2
        ),
        d1
    ),

    map7: <T1, T2, T3, T4, T5, T6, T7, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>,
        d7: Decoder<T7>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new AndThen(
                t3 => new AndThen(
                    t4 => new AndThen(
                        t5 => new AndThen(
                            t6 => new Map(
                                t7 => fn(t1, t2, t3, t4, t5, t6, t7),
                                d7
                            ),
                            d6
                        ),
                        d5
                    ),
                    d4
                ),
                d3
            ),
            d2
        ),
        d1
    ),

    map8: <T1, T2, T3, T4, T5, T6, T7, T8, R>(
        fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => R,
        d1: Decoder<T1>,
        d2: Decoder<T2>,
        d3: Decoder<T3>,
        d4: Decoder<T4>,
        d5: Decoder<T5>,
        d6: Decoder<T6>,
        d7: Decoder<T7>,
        d8: Decoder<T8>
    ): Decoder<R> => new AndThen(
        t1 => new AndThen(
            t2 => new AndThen(
                t3 => new AndThen(
                    t4 => new AndThen(
                        t5 => new AndThen(
                            t6 => new AndThen(
                                t7 => new Map(
                                    t8 => fn(t1, t2, t3, t4, t5, t6, t7, t8),
                                    d8
                                ),
                                d7
                            ),
                            d6
                        ),
                        d5
                    ),
                    d4
                ),
                d3
            ),
            d2
        ),
        d1
    ),

    andThen: <T, R>(fn: (value: T) => Decoder<R>, decoder: Decoder<T>): Decoder<R> => new AndThen(fn, decoder)
};
