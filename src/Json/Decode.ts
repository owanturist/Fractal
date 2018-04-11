import * as Interfaces from '../Interfaces';
import {
    isString,
    isNumber,
    isBoolean,
    isArray,
    isObject
} from '../Basics';
import {
    Nothing,
    Just
} from '../Maybe';
import {
    Left,
    Right
} from '../Either';

export type Value = Interfaces.Json.Value;

export abstract class Decoder<T> implements Interfaces.Json.Decoder<T> {
    public static fromEither<T>(either: Interfaces.Either<string, T>): Interfaces.Json.Decoder<T> {
        return either.fold<Interfaces.Json.Decoder<T>>(fail, succeed);
    }

    protected static makePath(origin: Array<string>): string {
        return origin.length === 0
            ? ' '
            : ' at _' + origin.join('') + ' ';
    }

    public map<R>(fn: (value: T) => R): Interfaces.Json.Decoder<R> {
        return new Decode.Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Interfaces.Json.Decoder<R>): Interfaces.Json.Decoder<R> {
        return new Decode.Chain(fn, this);
    }

    public decodeJSON(input: string): Interfaces.Either<string, T> {
        try {
            return this.decode(JSON.parse(input), []);
        } catch (err) {
            return Left((err as SyntaxError).message);
        }
    }

    public abstract decode(input: any, origin?: Array<string>): Interfaces.Either<string, T>;
}


namespace Decode {
    export class Map<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => R,
            protected readonly decoder: Interfaces.Json.Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin?: Array<string>): Interfaces.Either<string, R> {
            return this.decoder.decode(input, origin).map(this.fn);
        }
    }

    export class Chain<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => Interfaces.Json.Decoder<R>,
            protected readonly decoder: Interfaces.Json.Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin?: Array<string>): Interfaces.Either<string, R> {
            return this.decoder.decode(input, origin).chain(
                (value: T): Interfaces.Either<string, R> => this.fn(value).decode(input)
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

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, T> {
            return this.check(input)
                ? Right(input)
                : Left(
                    `Expecting ${this.title}${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`
                );
        }
    }

    export class Nullable<T> extends Decoder<Interfaces.Maybe<T>> {
        constructor(private readonly decoder: Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, Interfaces.Maybe<T>> {
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

    export class List<T> extends Decoder<Array<T>> {
        constructor(private readonly decoder: Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, Array<T>> {
            if (!isArray(input)) {
                return Left(`Expecting a List but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Interfaces.Either<string, Array<T>> = Right([]);

            for (let index = 0; index < input.length; index++) {
                acc = acc.chain(
                    (accResult: Array<T>): Interfaces.Either<string, Array<T>> =>
                        this.decoder
                            .decode(input[ index ], origin.concat(`[${index}]`))
                            .map(
                                (itemResult: T): Array<T> => {
                                    accResult.push(itemResult);

                                    return accResult;
                                }
                            )
                );
            }

            return acc;
        }
    }

    export class Dict<T, O extends {[ key: string ]: T }> extends Decoder<O> {
        constructor(private readonly decoder: Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, O> {
            if (!isObject(input)) {
                return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Interfaces.Either<string, O> = Right({} as O);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: O): Interfaces.Either<string, O> =>
                            this.decoder
                                .decode(input[ key ], origin.concat(`.${key}`))
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

    export class KeyValuePairs<T> extends Decoder<Array<[ string, T ]>> {
        constructor(private readonly decoder: Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, Array<[ string, T ]>> {
            if (!isObject(input)) {
                return Left(`Expecting an object but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Interfaces.Either<string, Array<[ string, T ]>> = Right([]);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: Array<[ string, T ]>): Interfaces.Either<string, Array<[ string, T ]>> =>
                            this.decoder
                                .decode(input[ key ], origin.concat(`.${key}`))
                                .map(
                                    (itemResult: T): Array<[ string, T ]> => {
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

    export class Field<T> extends Decoder<T> {
        constructor(
            private readonly key: string,
            private readonly decoder: Interfaces.Json.Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, T> {
            if (isObject(input) && this.key in input) {
                return this.decoder.decode(input[ this.key ], origin.concat(`.${this.key}`));
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
            private readonly decoder: Interfaces.Json.Decoder<T>
        ) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, T> {
            if (!isArray(input)) {
                return Left(`Expecting an array but instead got: ${JSON.stringify(input)}`);
            }

            return this.index >= input.length
                ? Left(
                    'Expecting a longer array. ' +
                    `Need index ${this.index} but there are only ${input.length} entries but instead got: ` +
                    JSON.stringify(input)
                )
                : this.decoder.decode(input[ this.index ], origin.concat(`[${this.index}]`));
        }
    }

    export class Maybe<T> extends Decoder<Interfaces.Maybe<T>> {
        constructor(private readonly decoder: Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string>): Interfaces.Either<string, Interfaces.Maybe<T>> {
            return Right(
                this.decoder.decode(input, origin).toMaybe()
            );
        }
    }

    export class OneOf<T> extends Decoder<T> {
        constructor(private readonly decoders: Array<Interfaces.Json.Decoder<T>>) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, T> {
            if (this.decoders.length === 0) {
                return Left(`Expecting at least one Decoder for oneOf${Decoder.makePath(origin)}but instead got 0`);
            }

            let acc = Left<string, T>('I ran into the following problems:\n');

            for (const decoder of this.decoders) {
                acc = acc.orElse(
                    (accErr: string): Interfaces.Either<string, T> =>
                        decoder
                            .decode(input, origin)
                            .leftMap((err: string): string => accErr + '\n' + err)
                );
            }

            return acc;
        }
    }

    export class Lazy<T> extends Decoder<T> {
        constructor(private readonly callDecoder: () => Interfaces.Json.Decoder<T>) {
            super();
        }

        public decode(input: any, origin: Array<string>): Interfaces.Either<string, T> {
            return this.callDecoder().decode(input, origin);
        }
    }

    export class Props<T extends object> extends Decoder<T> {
        constructor(private readonly config: {[ K in keyof T ]: Interfaces.Json.Decoder<T[ K ]>}) {
            super();
        }

        public decode(input: any, origin: Array<string>): Interfaces.Either<string, T> {
            let acc = Right<string, T>({} as T);

            for (const key in this.config) {
                if (this.config.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (obj: T): Interfaces.Either<string, T> =>
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

    class Encoder implements Interfaces.Json.Value {
        constructor(private readonly js: any) {}

        public serialize(): any {
            return this.js;
        }

        public encode(indent: number) {
            return JSON.stringify(this.js, null, indent);
        }
    }

    export class Value extends Decoder<any> {
        public decode(input: any): Interfaces.Either<string, Encoder> {
            return Right(new Encoder(input));
        }
    }

    export class Nill<T> extends Decoder<T> {
        constructor(private readonly defaults: T) {
            super();
        }

        public decode(input: any, origin: Array<string> = []): Interfaces.Either<string, T> {
            return input === null
                ? Right(this.defaults)
                : Left(`Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
        }
    }

    export class Fail<T> extends Decoder<T> {
        constructor(private readonly msg: string) {
            super();
        }

        public decode(): Interfaces.Either<string, T> {
            return Left(this.msg);
        }
    }

    export class Succeed<T> extends Decoder<T> {
        constructor(private readonly value: T) {
            super();
        }

        public decode(): Interfaces.Either<string, T> {
            return Right(this.value);
        }
    }
}

export const string: Interfaces.Json.Decoder<string> = new Decode.Primitive('a String', isString);
export const number: Interfaces.Json.Decoder<number> = new Decode.Primitive('a Number', isNumber);
export const boolean: Interfaces.Json.Decoder<boolean> = new Decode.Primitive('a Boolean', isBoolean);
export const value: Interfaces.Json.Decoder<Value> = new Decode.Value();

export const nill = <T>(defaults: T): Interfaces.Json.Decoder<T> => {
    return new Decode.Nill(defaults);
};
export const fail = <T>(msg: string): Interfaces.Json.Decoder<T> => {
    return new Decode.Fail(msg);
};
export const succeed = <T>(value: T): Interfaces.Json.Decoder<T> => {
    return new Decode.Succeed(value);
};
export const oneOf = <T>(decoders: Array<Interfaces.Json.Decoder<T>>): Interfaces.Json.Decoder<T> => {
    return new Decode.OneOf(decoders);
};

export const nullable = <T>(decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<Interfaces.Maybe<T>> => {
    return new Decode.Nullable(decoder);
};
export const maybe = <T>(decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<Interfaces.Maybe<T>> => {
    return new Decode.Maybe(decoder);
};
export const list = <T>(decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<Array<T>> => {
    return new Decode.List(decoder);
};
export const dict = <T>(decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<{[ key: string ]: T }> => {
    return new Decode.Dict(decoder);
};
export const keyValuePairs = <T>(
    decoder: Interfaces.Json.Decoder<T>
): Interfaces.Json.Decoder<Array<[ string, T ]>> => {
    return new Decode.KeyValuePairs(decoder);
};
export const props = <T extends object>(
    config: {[ K in keyof T ]: Interfaces.Json.Decoder<T[ K ]>}
): Interfaces.Json.Decoder<T> => {
    return new Decode.Props(config);
};

export const index = <T>(index: number, decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<T> => {
    return new Decode.Index(index, decoder);
};
export const field = <T>(key: string, decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<T> => {
    return new Decode.Field(key, decoder);
};
export const at = <T>(keys: Array<string>, decoder: Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<T> => {
    let acc = decoder;

    for (let i = keys.length - 1; i >= 0; i--) {
        acc = field(keys[ i ], acc);
    }

    return acc;
};

export const lazy = <T>(callDecoder: () => Interfaces.Json.Decoder<T>): Interfaces.Json.Decoder<T> => {
    return new Decode.Lazy(callDecoder);
};
