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

const isValidPropertyName = (name: string): boolean => /^[a-z_][0-9a-z_]*$/i.test(name);
const isString = (value: Value): value is string => typeof value === 'string';
const isNumber = (value: Value): value is number => typeof value === 'number';
const isBoolean = (value: Value): value is boolean => typeof value === 'boolean';
const isArray = (input: Value): input is Array<Value> => input instanceof Array;
const isObject = (input: Value): input is {[ key: string ]: Value } => {
    return typeof input === 'object' && input !== null && !isArray(input);
};

const indent = (source: string): string => {
    const lines = source.split('\n');

    if (lines.length < 2) {
        return source;
    }

    return lines.join('\n    ');
};

export type Value = Encode.Value;

export abstract class Error {
    public abstract cata<R>(pattern: Error.Pattern<R>): R;

    public stringify(): string {
        return this.stringifyWithContext([]);
    }

    public abstract stringifyWithContext(context: Array<string>): string;
}

export namespace Error {
    export type Pattern<R> = Readonly<{
        Field(field: string, error: Error): R;
        Index(index: number, error: Error): R;
        OneOf(errors: Array<Error>): R;
        Failure(message: string, source: Value): R;
    }>;
}

namespace Variations {
    export class Field extends Error {
        constructor(
            private readonly field: string,
            private readonly error: Error
        ) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            return pattern.Field(this.field, this.error);
        }

        public stringifyWithContext(context: Array<string>): string {
            return this.error.stringifyWithContext([
                ...context,
                isValidPropertyName(this.field) ? `.${this.field}` : `['${this.field}']`
            ]);
        }
    }

    export class Index extends Error {
        constructor(
            private readonly index: number,
            private readonly error: Error
        ) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            return pattern.Index(this.index, this.error);
        }

        public stringifyWithContext(context: Array<string>): string {
            return this.error.stringifyWithContext([ ...context, `[${this.index}]` ]);
        }
    }

    export class OneOf extends Error {
        constructor(private readonly errors: Array<Error>) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            return pattern.OneOf(this.errors);
        }

        public stringifyWithContext(context: Array<string>): string {
            switch (this.errors.length) {
                case 0: {
                    return 'Ran into a Json.Decode.oneOf with no possibilities'
                        + (context.length === 0 ? '!' : ' at json' + context.join(''));
                }

                case 1: {
                    return this.errors[ 0 ].stringifyWithContext(context);
                }

                default: {
                    const starter = context.length === 0
                        ? 'Json.Decode.oneOf'
                        : 'The Json.Decode.oneOf at json' + context.join('');
                    const lines = [
                        `${starter} failed in the following ${this.errors.length} ways`
                    ];

                    for (let i = 0; i < this.errors.length; ++i) {
                        lines.push(
                            `\n\n(${i + 1})` + indent(this.errors[ i ].stringifyWithContext(context))
                        );
                    }

                    return lines.join('\n\n');
                }
            }
        }
    }

    export class Failure extends Error {
        constructor(
            private readonly message: string,
            private readonly source: Value
        ) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            return pattern.Failure(this.message, this.source);
        }

        public stringifyWithContext(context: Array<string>): string {
            const introduction = context.length === 0
                ? 'Problem with the given value:\n\n'
                : 'Problem with the value at json' + context.join('') + ':\n\n    ';

            return introduction
                + indent(JSON.stringify(this.source, null, 4))
                + `\n\n${this.message}`;
        }
    }
}

export const Field = (field: string, error: Error): Error => new Variations.Field(field, error);
export const Index = (index: number, error: Error): Error => new Variations.Index(index, error);
export const OneOf = (errors: Array<Error>): Error => new Variations.OneOf(errors);
export const Failure = (message: string, source: Value): Error => new Variations.Failure(message, source);

export abstract class Decoder<T> {
    protected static run<T>(decoder: Decoder<T>, input: Value, origin: Array<string>): Either<string, T> {
        return decoder.deserialize(input, origin);
    }

    protected static makePath(origin: Array<string>): string {
        return origin.length === 0
            ? ' '
            : ' at _' + origin.join('') + ' ';
    }

    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Decode.Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Decode.Chain(fn, this);
    }

    public decodeJSON(input: string): Either<string, T> {
        try {
            return this.decode(JSON.parse(input) as Value);
        } catch (err) {
            return Left((err as SyntaxError).message);
        }
    }

    public decode(input: Value): Either<string, T> {
        return this.deserialize(input, []);
    }

    protected abstract deserialize(input: Value, origin: Array<string>): Either<string, T>;
}

namespace Decode {
    export class Map<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => R,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, R> {
            return Decoder.run(this.decoder, input, origin).map(this.fn);
        }
    }

    export class Chain<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => Decoder<R>,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, R> {
            return Decoder.run(this.decoder, input, origin).chain(
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

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
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

        public deserialize(input: Value, origin: Array<string>): Either<string, Maybe_<T>> {
            return input === null
                ? Right(Nothing())
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

    export class List<T> extends Decoder<Array<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, Array<T>> {
            if (!isArray(input)) {
                return Left(`Expecting a List${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Either<string, Array<T>> = Right([]);

            for (let index = 0; index < input.length; index++) {
                acc = acc.chain(
                    (accResult: Array<T>): Either<string, Array<T>> =>
                        Decoder
                            .run(this.decoder, input[ index ], origin.concat(`[${index}]`))
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
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, O> {
            if (!isObject(input)) {
                return Left(`Expecting an object${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Either<string, O> = Right({} as O);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: O): Either<string, O> =>
                            Decoder
                                .run(this.decoder, input[ key ] as Value, origin.concat(`.${key}`))
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

    export class KeyValue<T> extends Decoder<Array<[ string, T ]>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, Array<[ string, T ]>> {
            if (!isObject(input)) {
                return Left(`Expecting an object${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
            }

            let acc: Either<string, Array<[ string, T ]>> = Right([]);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (accResult: Array<[ string, T ]>): Either<string, Array<[ string, T ]>> =>
                            Decoder
                                .run(this.decoder, input[ key ], origin.concat(`.${key}`))
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
            private readonly decoder: Decoder<T>
        ) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            if (isObject(input) && this.key in input) {
                return Decoder.run(this.decoder, input[ this.key ], origin.concat(`.${this.key}`));
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

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            if (!isArray(input)) {
                return Left(`Expecting a List${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
            }

            if (this.index >= input.length) {
                return Left(
                    'Expecting a longer List. ' +
                    `Need index ${this.index} but there are only ${input.length} entries but instead got: ` +
                    JSON.stringify(input)
                );
            }

            return Decoder.run(this.decoder, input[ this.index ], origin.concat(`[${this.index}]`));
        }
    }

    export class Maybe<T> extends Decoder<Maybe_<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, Maybe_<T>> {
            return Right(
                Decoder.run(this.decoder, input, origin).toMaybe()
            );
        }
    }

    export class OneOf<T> extends Decoder<T> {
        constructor(private readonly decoders: Array<Decoder<T>>) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            if (this.decoders.length === 0) {
                return Left(`Expecting at least one Decoder for oneOf${Decoder.makePath(origin)}but instead got 0`);
            }

            let acc = Left<string, T>('I ran into the following problems:\n');

            for (const decoder of this.decoders) {
                acc = acc.orElse(
                    (accErr: string): Either<string, T> =>
                        Decoder
                            .run(decoder, input, origin)
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

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            return Decoder.run(this.callDecoder(), input, origin);
        }
    }

    export class Props<T extends object> extends Decoder<T> {
        constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            let acc = Right<string, T>({} as T);

            for (const key in this.config) {
                if (this.config.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (obj: T): Either<string, T> =>
                            Decoder.run(this.config[ key ], input, origin).map(
                                (value: T[Extract<keyof T, string>]): T => {
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

    export class Nill<T> extends Decoder<T> {
        constructor(private readonly defaults: T) {
            super();
        }

        public deserialize(input: Value, origin: Array<string>): Either<string, T> {
            return input === null
                ? Right(this.defaults)
                : Left(`Expecting null${Decoder.makePath(origin)}but instead got: ${JSON.stringify(input)}`);
        }
    }

    export class Fail<T> extends Decoder<T> {
        constructor(private readonly msg: string) {
            super();
        }

        public deserialize(): Either<string, T> {
            return Left(this.msg);
        }
    }

    export class Succeed<T> extends Decoder<T> {
        constructor(private readonly value: T) {
            super();
        }

        public deserialize(): Either<string, T> {
            return Right(this.value);
        }
    }
}

export const fromEither = <T>(either: Either<string, T>): Decoder<T> => either.cata<Decoder<T>>({
    Left: fail,
    Right: succeed
});
export const fromMaybe = <T>(error: string, maybe: Maybe_<T>): Decoder<T> => maybe.cata({
    Nothing: (): Decoder<T> => fail(error),
    Just: succeed
});

export const string: Decoder<string> = new Decode.Primitive('a String', isString);
export const number: Decoder<number> = new Decode.Primitive('a Number', isNumber);
export const boolean: Decoder<boolean> = new Decode.Primitive('a Boolean', isBoolean);
export const value: Decoder<Value> = new (
    class extends Decoder<Value> {
        public deserialize(input: Value): Either<string, Value> {
            return Right(input);
        }
    }
)();

export const nill = <T>(defaults: T): Decoder<T> => new Decode.Nill(defaults);
export const fail = <T>(msg: string): Decoder<T> => new Decode.Fail(msg);
export const succeed = <T>(value: T): Decoder<T> => new Decode.Succeed(value);
export const oneOf = <T>(decoders: Array<Decoder<T>>): Decoder<T> => new Decode.OneOf(decoders);

export const nullable = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Decode.Nullable(decoder);
export const maybe = <T>(decoder: Decoder<T>): Decoder<Maybe_<T>> => new Decode.Maybe(decoder);
export const list = <T>(decoder: Decoder<T>): Decoder<Array<T>> => new Decode.List(decoder);
export const dict = <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> => new Decode.Dict(decoder);
export const keyValue = <T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> => new Decode.KeyValue(decoder);
export const props = <T extends object>(
    config: {[ K in keyof T ]: Decoder<T[ K ]>}
): Decoder<T> => new Decode.Props(config);

export const index = <T>(index: number, decoder: Decoder<T>): Decoder<T> => new Decode.Index(index, decoder);
export const field = <T>(key: string, decoder: Decoder<T>): Decoder<T> => new Decode.Field(key, decoder);
export const at = <T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> => {
    let acc = decoder;

    for (let i = keys.length - 1; i >= 0; i--) {
        acc = field(keys[ i ], acc);
    }

    return acc;
};

export const lazy = <T>(callDecoder: () => Decoder<T>): Decoder<T> => new Decode.Lazy(callDecoder);
