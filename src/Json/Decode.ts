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
import * as Encode from './Encode';

export abstract class Decoder<T> {
    protected static run<T>(decoder: Decoder<T>, input: any, origin: Array<string>): Either<string, T> {
        return decoder.deserialize(input, origin);
    }

    protected static makePath(origin: Array<string>): string {
        return origin.length === 0
            ? ' '
            : ' at _' + origin.join('') + ' ';
    }

    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Chain(fn, this);
    }

    public decode(input: any): Either<string, T> {
        return this.deserialize(input, []);
    }

    public decodeJSON(input: string): Either<string, T> {
        try {
            return this.decode(JSON.parse(input));
        } catch (err) {
            return Left(err.message);
        }
    }

    protected abstract deserialize(input: any, origin: Array<string>): Either<string, T>;
}

class Map<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => R,
        protected readonly decoder: Decoder<T>
    ) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, R> {
        return Decoder.run(this.decoder, input, origin).map(this.fn);
    }
}

class Chain<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => Decoder<R>,
        protected readonly decoder: Decoder<T>
    ) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, R> {
        return Decoder.run(this.decoder, input, origin).chain(
            (value: T) => this.fn(value).decode(input)
        );
    }
}

class Primitive<T> extends Decoder<T> {
    constructor(
        private readonly title: string,
        private readonly check: (input: any) => input is T
    ) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        return this.check(input)
            ? Right(input)
            : Left(
                `Expecting ${this.title}${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`
            );
    }
}

class Nullable<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, Maybe_<T>> {
        return input === null
            ? Right(Nothing)
            : Decoder.run(this.decoder, input, origin).bimap(
                (error: string): string => [
                    'I ran into the following problems:\n',
                    `Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`,
                    error
                ].join('\n'),
                Just
            );
    }
}

class List<T> extends Decoder<Array<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, Array<T>> {
        if (!(input instanceof Array)) {
            return Left(`Expecting a List but instead got: ${JSON.stringify(input)}`);
        }

        let acc: Either<string, Array<T>> = Right([]);

        for (let index = 0; index < input.length; index++) {
            acc = acc.chain(
                (accResult: Array<T>) => Decoder
                    .run(this.decoder, input[ index ], origin.concat(`[${index}]`))
                    .map(
                        (itemResult: T) => {
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

    public deserialize(input: any, origin: Array<string>): Either<string, {[ key: string ]: T}> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
        }

        let acc: Either<string, {[ key: string ]: T}> = Right({});

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = acc.chain(
                    (accResult: {[ key: string ]: T}) => Decoder
                        .run(this.decoder, input[ key ], origin.concat(`.${key}`))
                        .map(
                            (itemResult: T) => {
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

    public deserialize(input: any, origin: Array<string>): Either<string, Array<[ string, T ]>> {
        if (typeof input !== 'object' || input === null || input instanceof Array) {
            return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
        }

        let acc: Either<string, Array<[ string, T ]>> = Right([]);

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                acc = acc.chain(
                    (accResult: Array<[ string, T ]>) => Decoder
                        .run(this.decoder, input[ key ], origin.concat(`.${key}`))
                        .map(
                            (itemResult: T) => {
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

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        if (typeof input !== 'object' || input === null || input instanceof Array || !(this.key in input)) {
            return Left(
                `Expecting an object with a field named \`${this.key}\`${Decoder.makePath(origin)}but instead got: ` +
                JSON.stringify(input)
            );
        }

        return Decoder.run(this.decoder, input[ this.key ], origin.concat(`.${this.key}`));
    }
}

class Index<T> extends Decoder<T> {
    constructor(
        private readonly index: number,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        if (!(input instanceof Array)) {
            return Left(`Expecting an array but instead got: ${JSON.stringify(input)}`);
        }

        return this.index >= input.length
            ? Left(
                'Expecting a longer array. ' +
                `Need index ${this.index} but there are only ${input.length} entries but instead got: ` +
                JSON.stringify(input)
            )
            : Decoder.run(this.decoder, input[ this.index ], origin.concat(`[${this.index}]`));
    }
}

class Maybe<T> extends Decoder<Maybe_<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, Maybe_<T>> {
        return Right(
            Decoder.run(this.decoder, input, origin).toMaybe()
        );
    }
}

class OneOf<T> extends Decoder<T> {
    constructor(private readonly decoders: Array<Decoder<T>>) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        if (this.decoders.length === 0) {
            return Left(`Expecting at least one Decoder for oneOf${Decoder.makePath(origin)}but instead got 0`);
        }

        let acc = Left('I ran into the following problems:\n');

        for (const decoder of this.decoders) {
            acc = acc.orElse(
                (accErr: string) => Decoder
                    .run(decoder, input, origin)
                    .leftMap((err: string) => accErr + '\n' + err)
            );
        }

        return acc;
    }
}

class Lazy<T> extends Decoder<T> {
    constructor(private readonly callDecoder: () => Decoder<T>) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        return Decoder.run(this.callDecoder(), input, origin);
    }
}

class Props<T extends object, K extends keyof T> extends Decoder<T> {
    constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        let acc = Right({} as T); // tslint:disable-line no-object-literal-type-assertion

        for (const key in this.config) {
            if (this.config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T) => Decoder.run(
                        (this.config[ key ] as Decoder<T[ K ]>).map(
                            (value: T[ K ]) => {
                                obj[ key ] = value;

                                return obj;
                            }
                        ),
                        input,
                        origin
                    )
                );
            }
        }

        return acc;
    }
}

class Encoder extends Encode.Value {
    constructor(private readonly js: any) {
        super();
    }

    protected serialize(): any {
        return this.js;
    }

}

class Value extends Decoder<any> {
    public deserialize(input: any): Either<string, Encoder> {
        return Right(new Encoder(input));
    }
}

class Nill<T> extends Decoder<T> {
    constructor(private readonly defaults: T) {
        super();
    }

    public deserialize(input: any, origin: Array<string>): Either<string, T> {
        return input === null
            ? Right(this.defaults)
            : Left(`Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
    }
}

class Fail extends Decoder<any> {
    constructor(private readonly msg: string) {
        super();
    }

    public deserialize(): Either<string, any> {
        return Left(this.msg);
    }
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    public deserialize(): Either<string, T> {
        return Right(this.value);
    }
}

const isString = (value: any): value is string => typeof value === 'string';
const isNumber = (value: any): value is number => typeof value === 'number';
const isBoolean = (value: any): value is boolean => typeof value === 'boolean';

export const string: Decoder<string> = new Primitive('a String', isString);
export const number: Decoder<number> = new Primitive('a Number', isNumber);
export const boolean: Decoder<boolean> = new Primitive('a Boolean', isBoolean);

export const value: Decoder<Encoder> = new Value();
export const nill = <T>(defaults: T): Decoder<T> => new Nill(defaults);
export const fail = (msg: string): Decoder<any> => new Fail(msg);
export const succeed = <T>(value: T): Decoder<T> => new Succeed(value);
export const oneOf = <T>(decoders: Array<Decoder<T>>): Decoder<T> => new OneOf(decoders);

export const nullable = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Nullable(decoder);
export const maybe = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Maybe(decoder);
export const list = <T>(decoder: Decoder<T>): Decoder<Array<T>> => new List(decoder);
export const dict = <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T}> => new Dict(decoder);
export const keyValuePairs = <T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> => new KeyValuePairs(decoder);
export const props = <T extends object>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T> => new Props(config);

export const index = <T>(index: number, decoder: Decoder<T>): Decoder<T> => new Index(index, decoder);
export const field = <T>(key: string, decoder: Decoder<T>): Decoder<T> => new Field(key, decoder);
export const at = <T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> => {
    let acc = decoder;

    for (let i = keys.length - 1; i >= 0; i--) {
        acc = field(keys[ i ], acc);
    }

    return acc;
};

export const lazy = <T>(callDecoder: () => Decoder<T>): Decoder<T> => new Lazy(callDecoder);
export const fromEither = <T>(either: Either<string, T>): Decoder<T> => either.fold(fail, succeed);
