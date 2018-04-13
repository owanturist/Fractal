import {
    isString,
    isNumber,
    isBoolean,
    isArray,
    isObject
} from '../Basics';
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
    List as List_
} from '../List';
import * as Encode from './Encode';

export type Value = Encode.Value;

export abstract class Decoder<T> {
    public static fromEither<T>(either: Either<string, T>): Decoder<T> {
        return either.fold<Decoder<T>>(fail, succeed);
    }

    public static fromMaybe<T>(error: string, maybe: Maybe_<T>): Decoder<T> {
        return maybe.fold(
            () => fail(error),
            succeed
        );
    }

    protected static makePath(origin: List_<string> | Array<string>): string {
        const origin_ = isArray(origin) ? origin : origin.toArray();

        return origin_.length === 0
            ? ' '
            : ' at _' + origin_.join('') + ' ';
    }

    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Decode.Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Decode.Chain(fn, this);
    }

    public decodeJSON(input: string): Either<string, T> {
        try {
            return this.decode(JSON.parse(input), []);
        } catch (err) {
            return Left((err as SyntaxError).message);
        }
    }

    public abstract decode(input: any, origin?: List_<string> | Array<string>): Either<string, T>;
}


namespace Decode {
    export class Map<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => R,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin?: List_<string> | Array<string>): Either<string, R> {
            return this.decoder.decode(input, origin).map(this.fn);
        }
    }

    export class Chain<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => Decoder<R>,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin?: List_<string> | Array<string>): Either<string, R> {
            return this.decoder.decode(input, origin).chain(
                (value: T): Either<string, R> => this.fn(value).decode(input)
            );
        }
    }

    export class Primitive<T> extends Decoder<T> {
        constructor(
            private readonly title: string,
            private readonly check: (input: any) => input is T
        ) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, T> {
            return this.check(input)
                ? Right(input)
                : Left(
                    `Expecting ${this.title}${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`
                );
        }
    }

    export class Nullable<T> extends Decoder<Maybe_<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, Maybe_<T>> {
            return input === null
                ? Right(Nothing())
                : this.decoder.decode(input, origin).bimap(
                    (error: string): string => [
                        'I ran into the following problems:\n',
                        `Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`,
                        error
                    ].join('\n'),
                    Just
                );
        }
    }

    export class List<T> extends Decoder<List_<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, List_<T>> {
            if (!isArray(input)) {
                return Left(`Expecting a List but instead got: ${JSON.stringify(input)}`);
            }

            const origin_ = isArray(origin) ? origin : origin.toArray();
            let acc: Either<string, Array<T>> = Right([]);

            for (let index = 0; index < input.length; index++) {
                acc = acc.chain(
                    (accResult: Array<T>): Either<string, Array<T>> =>
                        this.decoder
                            .decode(input[ index ], origin_.concat(`[${index}]`))
                            .map(
                                (itemResult: T): Array<T> => {
                                    accResult.push(itemResult);

                                    return accResult;
                                }
                            )
                );
            }

            return acc.map(List_.fromArray);
        }
    }

    export class Dict<T, O extends {[ key: string ]: T }> extends Decoder<O> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, O> {
            if (!isObject(input)) {
                return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
            }

            const origin_ = isArray(origin) ? origin : origin.toArray();
            let acc: Either<string, O> = Right({} as O);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: O): Either<string, O> =>
                            this.decoder
                                .decode(input[ key ], origin_.concat(`.${key}`))
                                .map(
                                    (itemResult: T): O => {
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

    export class KeyValue<T> extends Decoder<List_<[ string, T ]>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, List_<[ string, T ]>> {
            if (!isObject(input)) {
                return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
            }

            const origin_ = isArray(origin) ? origin : origin.toArray();
            let acc: Either<string, Array<[ string, T ]>> = Right([]);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: Array<[ string, T ]>): Either<string, Array<[ string, T ]>> =>
                            this.decoder
                                .decode(input[ key ], origin_.concat(`.${key}`))
                                .map(
                                    (itemResult: T): Array<[ string, T ]> => {
                                        accResult.push([ key, itemResult ]);

                                        return accResult;
                                    }
                                )
                    );
                }
            }

            return acc.map(List_.fromArray);
        }
    }

    export class Field<T> extends Decoder<T> {
        constructor(
            private readonly key: string,
            private readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, T> {

            if (isObject(input) && this.key in input) {
                const origin_ = isArray(origin) ? origin : origin.toArray();

                return this.decoder.decode(input[ this.key ], origin_.concat(`.${this.key}`));
            }

            return Left(
                `Expecting an object with a field named \`${this.key}\`${Decoder.makePath(origin)}but instead got: ` +
                JSON.stringify(input)
            );
        }
    }

    export class Index<T> extends Decoder<T> {
        constructor(
            private readonly index: number,
            private readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, T> {
            if (!isArray(input)) {
                return Left(`Expecting an array but instead got: ${JSON.stringify(input)}`);
            }

            const origin_ = isArray(origin) ? origin : origin.toArray();

            return this.index >= input.length
                ? Left(
                    'Expecting a longer array. ' +
                    `Need index ${this.index} but there are only ${input.length} entries but instead got: ` +
                    JSON.stringify(input)
                )
                : this.decoder.decode(input[ this.index ], origin_.concat(`[${this.index}]`));
        }
    }

    export class Maybe<T> extends Decoder<Maybe_<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string>): Either<string, Maybe_<T>> {
            return Right(
                this.decoder.decode(input, origin).toMaybe()
            );
        }
    }

    export class OneOf<T> extends Decoder<T> {
        constructor(private readonly decoders: List_<Decoder<T>> | Array<Decoder<T>>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, T> {
            const decoders = isArray(this.decoders) ? this.decoders : this.decoders.toArray();

            if (decoders.length === 0) {
                return Left(`Expecting at least one Decoder for oneOf${Decoder.makePath(origin)}but instead got 0`);
            }

            let acc = Left<string, T>('I ran into the following problems:\n');

            for (const decoder of decoders) {
                acc = acc.orElse(
                    (accErr: string): Either<string, T> =>
                        decoder
                            .decode(input, origin)
                            .leftMap((err: string): string => accErr + '\n' + err)
                );
            }

            return acc;
        }
    }

    export class Lazy<T> extends Decoder<T> {
        constructor(private readonly callDecoder: () => Decoder<T>) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string>): Either<string, T> {
            return this.callDecoder().decode(input, origin);
        }
    }

    export class Props<T> extends Decoder<T> {
        constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string>): Either<string, T> {
            let acc = Right<string, T>({} as T);

            for (const key in this.config) {
                if (this.config.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (obj: T): Either<string, T> =>
                            this.config[ key ].decode(input, origin).map(
                                (value: T[ keyof T ]): T => {
                                    obj[ key ] = value;

                                    return obj;
                                }
                            )
                    );
                }
            }

            return acc;
        }
    }

    class Encoder implements Encode.Value {
        constructor(private readonly js: any) {}

        public serialize(): any {
            return this.js;
        }

        public encode(indent: number) {
            return JSON.stringify(this.js, null, indent);
        }
    }

    export class Value extends Decoder<any> {
        public decode(input: any): Either<string, Encoder> {
            return Right(new Encoder(input));
        }
    }

    export class Nill<T> extends Decoder<T> {
        constructor(private readonly defaults: T) {
            super();
        }

        public decode(input: any, origin: List_<string> | Array<string> = []): Either<string, T> {
            return input === null
                ? Right(this.defaults)
                : Left(`Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
        }
    }

    export class Fail<T> extends Decoder<T> {
        constructor(private readonly msg: string) {
            super();
        }

        public decode(): Either<string, T> {
            return Left(this.msg);
        }
    }

    export class Succeed<T> extends Decoder<T> {
        constructor(private readonly value: T) {
            super();
        }

        public decode(): Either<string, T> {
            return Right(this.value);
        }
    }
}

export const string: Decoder<string> = new Decode.Primitive('a String', isString);
export const number: Decoder<number> = new Decode.Primitive('a Number', isNumber);
export const boolean: Decoder<boolean> = new Decode.Primitive('a Boolean', isBoolean);
export const value: Decoder<Value> = new Decode.Value();

export const nill = <T>(defaults: T): Decoder<T> => new Decode.Nill(defaults);
export const fail = <T>(msg: string): Decoder<T> => new Decode.Fail(msg);
export const succeed = <T>(value: T): Decoder<T> => new Decode.Succeed(value);
export const oneOf = <T>(decoders: Array<Decoder<T>>): Decoder<T> => new Decode.OneOf(decoders);

export const nullable = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Decode.Nullable(decoder);
export const maybe = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Decode.Maybe(decoder);
export const list = <T>(decoder: Decoder<T>): Decoder<List_<T>> => new Decode.List(decoder);
export const dict = <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> => new Decode.Dict(decoder);
export const keyValue = <T>(decoder: Decoder<T>): Decoder<List_<[ string, T ]>> => new Decode.KeyValue(decoder);
export const props = <T>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T> => new Decode.Props(config);

export const index = <T>(index: number, decoder: Decoder<T>): Decoder<T> => new Decode.Index(index, decoder);
export const field = <T>(key: string, decoder: Decoder<T>): Decoder<T> => new Decode.Field(key, decoder);
export const at = <T>(keys: List_<string> | Array<string>, decoder: Decoder<T>): Decoder<T> => {
    const keys_ = isArray(keys) ? keys : keys.toArray();
    let acc = decoder;

    for (let i = keys_.length - 1; i >= 0; i--) {
        acc = field(keys_[ i ], acc);
    }

    return acc;
};

export const lazy = <T>(callDecoder: () => Decoder<T>): Decoder<T> => new Decode.Lazy(callDecoder);
