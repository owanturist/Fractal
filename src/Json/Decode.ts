import {
    Maybe as Maybe_,
    Nothing,
    Just
} from '../Maybe';
import {
    Either,
    Left,
    Right
} from '../Either';
import {
    Value as Value_
} from './Encode';

export abstract class Decoder<T> {
    public abstract decode(input: any): Either<string, T>;

    public decodeString(input: string): Either<string, T> {
        try {
            return this.decode(JSON.parse(input));
        } catch (err) {
            return Left(err.message);
        }
    }
}

class Primitive<T> extends Decoder<T> {
    constructor(
        private readonly title: string,
        private readonly check: (input: any) => input is T
    ) {
        super();
    }

    public decode(input: any): Either<string, T> {
        return this.check(input)
            ? Right(input)
            : Left('Value `' + JSON.stringify(input) + '` is not a ' + this.title + '.')
    }
}

class Nullable<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: any): Either<string, Maybe_<T>> {
        return input === null
            ? Right(Nothing)
            : this.decoder.decode(input).map(Just)
    }
}

class List<T> extends Decoder<Array<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: any): Either<string, Array<T>> {
        if (!(input instanceof Array)) {
            return Left('Value `' + JSON.stringify(input) + '` is not an array.');
        }

        let acc: Either<string, Array<T>> = Right([]);

        for (const item of input) {
            acc = acc.chain(
                accResult => this.decoder.decode(item).map(
                    itemResult => {
                        accResult.push(itemResult);

                        return accResult;
                    }
                )
            );
        }

        return acc;
    }
}

class Dict<T> extends Decoder<{[ key: string ]: T}> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: any): Either<string, {[ key: string ]: T}> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Left('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        let acc: Either<string, {[ key: string ]: T}> = Right({});

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = acc.chain(
                    accResult => this.decoder.decode(input[ key ]).map(
                        itemResult => {
                            accResult[ key ] = itemResult;

                            return accResult;
                        }
                    )
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

    public decode(input: any): Either<string, Array<[ string, T ]>> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Left('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        let acc: Either<string, Array<[ string, T ]>> = Right([]);

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = acc.chain(
                    accResult => this.decoder.decode(input[ key ]).map(
                        itemResult => {
                            accResult.push([ key, itemResult ]);

                            return accResult;
                        }
                    )
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

    public decode(input: any): Either<string, T> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Left('Value `' + JSON.stringify(input) + '` is not an object.');
        }

        return this.key in input
            ? this.decoder.decode(input[ this.key ])
            : Left('Field `' + this.key + '` doesn\'t exist in an object ' + JSON.stringify(input) + '.');
    }
}

class Index<T> extends Decoder<T> {
    constructor(
        private readonly index: number,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decode(input: any): Either<string, T> {
        if (!(input instanceof Array)) {
            return Left('Value `' + JSON.stringify(input) + '` is not an array.');
        }

        return this.index >= input.length
            ? Left('Need index ' + this.index + ' but there are only ' + input.length + ' entries.')
            : this.decoder.decode(input[ this.index ]);
    }
}

class Maybe<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: any): Either<string, Maybe_<T>> {
        return Right(
            this.decoder.decode(input).toMaybe()
        );
    }
}

class OneOf<T> extends Decoder<T> {
    constructor(private readonly decoders: Array<Decoder<T>>) {
        super();
    }

    public decode(input: any): Either<string, T> {
        if (this.decoders.length === 1) {
            return this.decoders[0].decode(input);
        }

        let acc: Either<string, T> = Left('OneOf Decoder shouldn\'t be empty.');

        for (const decoder of this.decoders) {
            acc = acc.orElse(
                accErr => decoder.decode(input)
                    .leftMap(err => accErr + '\n' + err)
            );
        }

        return acc;
    }
}

class Lazy<T> extends Decoder<T> {
    constructor(private readonly callDecoder: () => Decoder<T>) {
        super();
    }

    public decode(input: any): Either<string, T> {
        return this.callDecoder().decode(input);
    }
}

class Value extends Decoder<any> {
    public decode(input: any): Either<string, Value_> {
        return Right(new Value_(input));
    }
}

class Nul<T> extends Decoder<T> {
    constructor(private readonly defaults: T) {
        super();
    }

    public decode(input: any): Either<string, T> {
        return input === null
            ? Right(this.defaults)
            : Left('Value `' + JSON.stringify(input) + '` is not a null.')
    }
}

class Fail extends Decoder<any> {
    constructor(private readonly msg: string) {
        super();
    }

    public decode(): Either<string, any> {
        return Left(this.msg);
    }
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    public decode(): Either<string, T> {
        return Right(this.value);
    }
}

class Map<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => R,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decode(input: any): Either<string, R> {
        return this.decoder.decode(input).map(this.fn);
    }
}

class AndThen<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => Decoder<R>,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decode(input: any): Either<string, R> {
        return this.decoder.decode(input).chain(
            value => this.fn(value).decode(input)
        );
    }
}

export abstract class Decode<T> extends Decoder<T> {
    public static string: Decoder<string> = new Primitive(
        'string',
        (value: any): value is string => typeof value === 'string'
    );

    public static number: Decoder<number> = new Primitive(
        'number',
        (value: any): value is number => typeof value === 'number'
    );

    public static bool: Decoder<boolean> = new Primitive(
        'bool',
        (value: any): value is boolean => typeof value === 'boolean'
    );

    public static nullable<T>(decoder: Decoder<T>): Decoder<Maybe_<T>> {
        return new Nullable(decoder);
    }

    public static list<T>(decoder: Decoder<T>): Decoder<Array<T>> {
        return new List(decoder);
    }

    public static dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T}> {
        return new Dict(decoder);
    }

    public static keyValuePairs<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> {
        return new KeyValuePairs(decoder)
    }

    public static field<T>(key: string, decoder: Decoder<T>): Decoder<T> {
        return new Field(key, decoder);
    }

    public static at<T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> {
        let acc = decoder;

        for (let i = keys.length - 1; i >= 0; i--) {
            acc = new Field(keys[ i ], acc);
        }

        return acc;
    }

    public static index<T>(index: number, decoder: Decoder<T>): Decoder<T> {
        return new Index(index, decoder);
    }

    public static maybe<T>(decoder: Decoder<T>): Decoder<Maybe_<T>> {
        return new Maybe(decoder);
    }

    public static oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
        return new OneOf(decoders);
    }

    public static lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
        return new Lazy(callDecoder);
    }

    public static value = new Value();

    public static nul<T>(defaults: T): Decoder<T> {
        return new Nul(defaults);
    }

    public static fail(msg: string): Decoder<any> {
        return new Fail(msg);
    }

    public static succeed<T>(value: T): Decoder<T> {
        return new Succeed(value);
    }

    public static map<T, R>(fn: (value: T) => R, decoder: Decoder<T>): Decoder<R> {
        return new Map(fn, decoder);
    }

    public static map2<T1, T2, R>(
            fn: (t1: T1, t2: T2) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map(
                t2 => fn(t1, t2),
                d2
            ),
            d1
        );
    }

    public static map3<T1, T2, T3, R>(
            fn: (t1: T1, t2: T2, t3: T3) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>,
            d3: Decoder<T3>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map2(
                (t2, t3) => fn(t1, t2, t3),
                d2,
                d3
            ),
            d1
        );
    }

    public static map4<T1, T2, T3, T4, R>(
            fn: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>,
            d3: Decoder<T3>,
            d4: Decoder<T4>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map3(
                (t2, t3, t4) => fn(t1, t2, t3, t4),
                d2,
                d3,
                d4
            ),
            d1
        );
    }

    public static map5<T1, T2, T3, T4, T5, R>(
            fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>,
            d3: Decoder<T3>,
            d4: Decoder<T4>,
            d5: Decoder<T5>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map4(
                (t2, t3, t4, t5) => fn(t1, t2, t3, t4, t5),
                d2,
                d3,
                d4,
                d5
            ),
            d1
        );
    }

    public static map6<T1, T2, T3, T4, T5, T6, R>(
            fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>,
            d3: Decoder<T3>,
            d4: Decoder<T4>,
            d5: Decoder<T5>,
            d6: Decoder<T6>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map5(
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

    public static map7<T1, T2, T3, T4, T5, T6, T7, R>(
            fn: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => R,
            d1: Decoder<T1>,
            d2: Decoder<T2>,
            d3: Decoder<T3>,
            d4: Decoder<T4>,
            d5: Decoder<T5>,
            d6: Decoder<T6>,
            d7: Decoder<T7>
        ): Decoder<R> {
        return this.andThen(
            t1 => this.map6(
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

    public static map8<T1, T2, T3, T4, T5, T6, T7, T8, R>(
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
        return this.andThen(
            t1 => this.map7(
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

    public static andThen<T, R>(fn: (value: T) => Decoder<R>, decoder: Decoder<T>): Decoder<R> {
        return new AndThen(fn, decoder);
    }
}
