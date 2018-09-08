import {
    Maybe,
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

const indent = (text: string): string => {
    const lines = text.split('\n');

    if (lines.length < 2) {
        return text;
    }

    return lines.join('\n    ');
};

const expecting = <T>(type: string, source: Value): Either<Error, T> => {
    return Left(
        Failure(`Expecting ${type}`, source)
    );
};

export type Value = Encode.Value;

export abstract class Error {
    public static stringify(error: Error): string {
        return error.stringify();
    }

    protected static stringifyWithContext(error: Error, context: Array<string>): string {
        return error.stringifyWithContext(context);
    }

    public abstract cata<R>(pattern: Error.Pattern<R>): R;

    public stringify(): string {
        return this.stringifyWithContext([]);
    }

    protected abstract stringifyWithContext(context: Array<string>): string;
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
            return Error.stringifyWithContext(this.error, [
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
            return Error.stringifyWithContext(this.error, [ ...context, `[${this.index}]` ]);
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
                    return Error.stringifyWithContext(this.errors[ 0 ], context);
                }

                default: {
                    const starter = context.length === 0
                        ? 'Json.Decode.oneOf'
                        : 'The Json.Decode.oneOf at json' + context.join('');
                    const lines = [
                        `${starter} failed in the following ${this.errors.length} ways`
                    ];

                    for (let index = 0; index < this.errors.length; ++index) {
                        lines.push(
                            `\n\n(${index + 1})` + indent(Error.stringifyWithContext(this.errors[ index ], context))
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
    public static fromEither<T>(either: Either<string, T>): Decoder<T> {
        return either.cata({
            Left(msg: string): Decoder<T> {
                return Decoder.fail(msg);
            },
            Right(value: T): Decoder<T> {
                return Decoder.succeed(value);
            }
        });
    }

    public static fromMaybe<T>(msg: string, maybe: Maybe<T>): Decoder<T> {
        return maybe.cata({
            Nothing(): Decoder<T> {
                return Decoder.fail(msg);
            },
            Just(value: T): Decoder<T> {
                return Decoder.succeed(value);
            }
        });
    }

    public static get string(): Decoder<string> {
        return new Decode.Primitive('a STRING', isString);
    }

    public static get number(): Decoder<number> {
        return new Decode.Primitive('a NUMBER', isNumber);
    }

    public static get boolean(): Decoder<boolean> {
        return new Decode.Primitive('a BOOLEAN', isBoolean);
    }

    public static get value(): Decoder<Value> {
        return new Decode.Identity();
    }

    public static nill<T>(defaults: T): Decoder<T> {
        return new Decode.Nill(defaults);
    }

    public static fail<T>(msg: string): Decoder<T> {
        return new Decode.Fail(msg);
    }

    public static succeed<T>(value: T): Decoder<T> {
        return new Decode.Succeed(value);
    }

    public static oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
        return new Decode.OneOf(decoders);
    }

    public static nullable<T>(decoder: Decoder<T>): Decoder<Maybe<T>> {
        return Decoder.oneOf([
            Decoder.nill(Nothing()),
            decoder.map(Just)
        ]);
    }

    public static maybe<T>(decoder: Decoder<T>): Decoder<Maybe<T>> {
        return Decoder.oneOf([
            decoder.map(Just),
            Decoder.succeed(Nothing())
        ]);
    }

    public static list<T>(decoder: Decoder<T>): Decoder<Array<T>> {
        return new Decode.List(decoder);
    }

    public static keyValue<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>> {
        return new Decode.KeyValue(decoder);
    }

    public static dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> {
        return Decoder.keyValue(decoder).map((keyValue: Array<[ string, T ]>): {[ key: string ]: T} => {
            const acc: {[ key: string ]: T} = {};

            for (const [ key, value ] of keyValue) {
                acc[ key ] = value;
            }

            return acc;
        });
    }

    public static props<T extends object>(config: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T> {
        return new Decode.Props(config);
    }

    public static index<T>(index: number, decoder: Decoder<T>): Decoder<T> {
        return new Decode.Index(index, decoder);
    }

    public static field<T>(key: string, decoder: Decoder<T>): Decoder<T> {
        return new Decode.Field(key, decoder);
    }

    public static at<T>(keys: Array<string>, decoder: Decoder<T>): Decoder<T> {
        let result = decoder;

        for (let index = keys.length - 1; index >= 0; index--) {
            result = Decoder.field(keys[ index ], result);
        }

        return result;
    }

    public static lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
        return Decoder.succeed(null).chain(callDecoder);
    }

    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Decode.Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Decode.Chain(fn, this);
    }

    public decodeJSON(input: string): Either<Error, T> {
        try {
            return this.decode(JSON.parse(input) as Value);
        } catch (err) {
            return Left(
                Failure(`This is not valid JSON! ${err.message}`, input)
            );
        }
    }

    public abstract decode(input: Value): Either<Error, T>;
}

namespace Decode {
    export class Map<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => R,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: Value): Either<Error, R> {
            return this.decoder.decode(input).map(this.fn);
        }
    }

    export class Chain<T, R> extends Decoder<R> {
        constructor(
            private readonly fn: (value: T) => Decoder<R>,
            protected readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: Value): Either<Error, R> {
            return this.decoder.decode(input).chain(
                (value: T): Either<Error, R> => this.fn(value).decode(input)
            );
        }
    }

    export class Primitive<T> extends Decoder<T> {
        constructor(
            private readonly type: string,
            private readonly check: (input: any) => input is T
        ) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            return this.check(input) ? Right(input) : expecting(this.type, input);
        }
    }

    export class Identity extends Decoder<Value> {
        public decode(input: Value): Either<Error, Value> {
            return Right(input);
        }
    }

    export class List<T> extends Decoder<Array<T>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: Value): Either<Error, Array<T>> {
            if (!isArray(input)) {
                return expecting('a LIST', input);
            }

            let result: Either<Error, Array<T>> = Right([]);

            for (let index = 0; index < input.length; index++) {
                result = result.chain(
                    (acc: Array<T>): Either<Error, Array<T>> => {
                        return this.decoder.decode(input[ index ]).bimap(
                            (error: Error): Error => new Variations.Index(index, error),
                            (value: T): Array<T> => {
                                acc.push(value);

                                return acc;
                            }
                        );
                    }
                );
            }

            return result;
        }
    }

    export class KeyValue<T> extends Decoder<Array<[ string, T ]>> {
        constructor(private readonly decoder: Decoder<T>) {
            super();
        }

        public decode(input: Value): Either<Error, Array<[ string, T ]>> {
            if (!isObject(input)) {
                return expecting('an OBJECT', input);
            }

            let result: Either<Error, Array<[ string, T ]>> = Right([]);

            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    result = result.chain(
                        (acc: Array<[ string, T ]>): Either<Error, Array<[ string, T ]>> => {
                            return this.decoder.decode(input[ key ]).bimap(
                                (error: Error): Error => new Variations.Field(key, error),
                                (value: T): Array<[ string, T ]> => {
                                    acc.push([ key, value ]);

                                    return acc;
                                }
                            );
                        }
                    );
                }
            }

            return result;
        }
    }

    export class Field<T> extends Decoder<T> {
        constructor(
            private readonly key: string,
            private readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            if (isObject(input) && this.key in input) {
                return this.decoder
                    .decode(input[ this.key ])
                    .leftMap((error: Error): Error => new Variations.Field(this.key, error));
            }

            return expecting(`an OBJECT with a field named '${this.key}'`, input);
        }
    }

    export class Index<T> extends Decoder<T> {
        constructor(
            private readonly index: number,
            private readonly decoder: Decoder<T>
        ) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            if (!isArray(input)) {
                return expecting('an ARRAY', input);
            }

            if (this.index >= input.length) {
                return expecting(
                    `a LONGER array. Need index ${this.index}' but only see ${input.length} entries`,
                    input
                );
            }

            return this.decoder
                .decode(input[ this.index ])
                .leftMap((error: Error): Error => new Variations.Index(this.index, error));
        }
    }

    export class OneOf<T> extends Decoder<T> {
        constructor(private readonly decoders: Array<Decoder<T>>) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            let result = Left<Array<Error>, T>([]);

            for (const decoder of this.decoders) {
                result = result.orElse(
                    (acc: Array<Error>): Either<Array<Error>, T> => {
                        return decoder.decode(input).leftMap((error: Error): Array<Error> => {
                            acc.push(error);

                            return acc;
                        });
                    }
                );
            }

            return result.leftMap((errors: Array<Error>): Error => new Variations.OneOf(errors));
        }
    }

    export class Props<T extends object> extends Decoder<T> {
        constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            let acc = Right<Error, T>({} as T);

            for (const key in this.config) {
                if (this.config.hasOwnProperty(key)) {
                    acc = acc.chain(
                        (obj: T): Either<Error, T> => {
                            return this.config[ key ].decode(input).map(
                                (value: T[Extract<keyof T, string>]): T => {
                                    obj[ key ] = value;

                                    return obj;
                                }
                            );
                        }
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

        public decode(input: Value): Either<Error, T> {
            return input === null ? Right(this.defaults) : expecting('null', input);
        }
    }

    export class Fail<T> extends Decoder<T> {
        constructor(private readonly msg: string) {
            super();
        }

        public decode(input: Value): Either<Error, T> {
            return Left(
                new Variations.Failure(this.msg, input)
            );
        }
    }

    export class Succeed<T> extends Decoder<T> {
        constructor(private readonly value: T) {
            super();
        }

        public decode(): Either<Error, T> {
            return Right(this.value);
        }
    }
}
