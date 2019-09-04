import {
    Cata,
    isString,
    isInt,
    isFloat,
    isBoolean,
    isObject,
    isArray
} from '../Basics';
import Maybe, { Nothing, Just } from '../Maybe';
import Either, { Left, Right } from '../Either';
import Encode from './Encode';

export abstract class Error {
    protected static stringifyWithContext(error: Error, indent: number, context: Array<string>): string {
        return error.stringifyWithContext(indent, context);
    }

    public abstract cata<R>(pattern: Error.Pattern<R>): R;

    public stringify(indent: number): string {
        return this.stringifyWithContext(indent, []);
    }

    protected abstract stringifyWithContext(indent: number, context: Array<string>): string;
}

export namespace Error {
    export type Pattern<R> = Cata<{
        Field(name: string, error: Error): R;
        Index(position: number, error: Error): R;
        OneOf(errors: Array<Error>): R;
        Failure(message: string, source: unknown): R;
    }>;

    export const Field = (name: string, error: Error): Error => new Internal.Field(name, error);

    export const Index = (position: number, error: Error): Error => new Internal.Index(position, error);

    export const OneOf = (errors: Array<Error>): Error => new Internal.OneOf(errors);

    export const Failure = (message: string, source: unknown): Error => new Internal.Failure(message, source);
}

namespace Internal {
    function wrapFieldName(name: string): string {
        if (/^[a-z_][0-9a-z_]*$/i.test(name)) {
            return `.${name}`;
        }

        return `['${name}']`;
    }

    export class Field extends Error {
        constructor(
            private readonly field: string,
            private readonly error: Error
        ) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            if (typeof pattern.Field === 'function') {
                return pattern.Field(this.field, this.error);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            return Error.stringifyWithContext(this.error, indent, [
                ...context,
                wrapFieldName(this.field)
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
            if (typeof pattern.Index === 'function') {
                return pattern.Index(this.index, this.error);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            return Error.stringifyWithContext(this.error, indent, [ ...context, `[${this.index}]` ]);
        }
    }

    export class OneOf extends Error {
        constructor(private readonly errors: Array<Error>) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            if (typeof pattern.OneOf === 'function') {
                return pattern.OneOf(this.errors);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            switch (this.errors.length) {
                case 0: {
                    return 'Ran into a Json.Decode.oneOf with no possibilities'
                        + (context.length === 0 ? '!' : ' at _' + context.join(''));
                }

                case 1: {
                    return Error.stringifyWithContext(this.errors[ 0 ], indent, context);
                }

                default: {
                    const starter = context.length === 0
                        ? 'Json.Decode.oneOf'
                        : 'The Json.Decode.oneOf at _' + context.join('');
                    const lines = [
                        `${starter} failed in the following ${this.errors.length} ways`
                    ];

                    for (let index = 0; index < this.errors.length; ++index) {
                        lines.push(
                            `\n(${index + 1}) ` + this.errors[ index ].stringify(indent)
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
            private readonly source: unknown
        ) {
            super();
        }

        public cata<R>(pattern: Error.Pattern<R>): R {
            if (typeof pattern.Failure === 'function') {
                return pattern.Failure(this.message, this.source);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            const introduction = context.length === 0
                ? 'Problem with the given value:\n\n'
                : 'Problem with the value at _' + context.join('') + ':\n\n';

            return introduction
                + '    ' + JSON.stringify(this.source, null, indent).replace(/\n/g, '\n    ')
                + `\n\n${this.message}`;
        }
    }
}

const expecting = (type: string, source: unknown): Either<Error, never> => {
    return Left(
        Error.Failure(`Expecting ${type}`, source)
    );
};

export type Value = Encode.Value;

interface Decode {
    string: Decoder<unknown>;
    boolean: Decoder<unknown>;
    int: Decoder<unknown>;
    float: Decoder<unknown>;

    of<T>(decoder: Decoder<T>): Decoder<unknown>;
    oneOf<T>(decoders: Array<Decoder<T>>): Decoder<unknown>;

    props<O extends {}>(config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<unknown>;
    list<T>(decoder: Decoder<T>): Decoder<unknown>;
    dict<T>(decoder: Decoder<T>): Decoder<unknown>;

    keyValue<T>(decoder: Decoder<T>): Decoder<unknown>;
    keyValue<K, T>(convertKey: (key: string) => Either<string, K>, decoder: Decoder<T>): Decoder<unknown>;

    field(key: string): unknown;
    index(position: number): unknown;
    at(path: Array<string | number>): unknown;
}

class Path implements Decode {
    public constructor(
        private readonly createDecoder: <T>(decoder: Decoder<T>) => Decoder<T>
    ) {}

    public of<T>(decoder: Decoder<T>): Decoder<T> {
        return this.createDecoder(decoder);
    }

    public get string(): Decoder<string> {
        return this.of(string);
    }

    public get boolean(): Decoder<boolean> {
        return this.of(boolean);
    }

    public get int(): Decoder<number> {
        return this.of(int);
    }

    public get float(): Decoder<number> {
        return this.of(float);
    }

    public get value(): Decoder<Value> {
        return this.of(value);
    }

    public props<O extends {}>(config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<O> {
        return this.of(props(config));
    }

    public list<T>(decoder: Decoder<T>): Decoder<Array<T>> {
        return this.of(list(decoder));
    }

    public keyValue<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;
    public keyValue<K, T>(
        convertKey: (key: string) => Either<string, K>,
        decoder: Decoder<T>
    ): Decoder<Array<[ K, T ]>>;
    public keyValue<K, T>(
        ...args: [ Decoder<T> ] | [ (key: string) => Either<string, K>, Decoder<T> ]
    ): Decoder<Array<[ string, T ]>> | Decoder<Array<[ K, T ]>> {
        if (args.length === 1) {
            return this.of(keyValue(args[ 0 ]));
        }

        return this.of(keyValue(args[ 0 ], args[ 1 ]));
    }

    public dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> {
        return this.of(dict(decoder));
    }

    public oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
        return this.of(oneOf(decoders));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): Path {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(new RequiredField(name, decoder));
        });
    }

    public index(position: number): Path {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(new RequiredIndex(position, decoder));
        });
    }

    public at(path: Array<string | number>): Path {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(requiredAt(path, decoder));
        });
    }

    public get optional(): Optional {
        return new Optional(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(decoder).map(Just);
        });
    }
}

class Optional implements Decode {
    public constructor(
        private readonly createDecoder: <T>(decoder: Decoder<T>) => Decoder<Maybe<T>>
    ) {}

    public of<T>(decoder: Decoder<T>): Decoder<Maybe<T>> {
        return this.createDecoder(new Nullable(decoder)).map(Maybe.join);
    }

    public get string(): Decoder<Maybe<string>> {
        return this.of(string);
    }

    public get boolean(): Decoder<Maybe<boolean>> {
        return this.of(boolean);
    }

    public get int(): Decoder<Maybe<number>> {
        return this.of(int);
    }

    public get float(): Decoder<Maybe<number>> {
        return this.of(float);
    }

    public props<O extends {}>(config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<Maybe<O>> {
        return this.of(props(config));
    }

    public list<T>(decoder: Decoder<T>): Decoder<Maybe<Array<T>>> {
        return this.of(list(decoder));
    }

    public keyValue<T>(decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;
    public keyValue<K, T>(
        convertKey: (key: string) => Either<string, K>,
        decoder: Decoder<T>
    ): Decoder<Maybe<Array<[ K, T ]>>>;
    public keyValue<K, T>(
        ...args: [ Decoder<T> ] | [ (key: string) => Either<string, K>, Decoder<T> ]
    ): Decoder<Maybe<Array<[ string, T ]>>> | Decoder<Maybe<Array<[ K, T ]>>> {
        if (args.length === 1) {
            return this.of(keyValue(args[ 0 ]));
        }

        return this.of(keyValue(args[ 0 ], args[ 1 ]));
    }

    public dict<T>(decoder: Decoder<T>): Decoder<Maybe<{[ key: string ]: T }>> {
        return this.of(dict(decoder));
    }

    public oneOf<T>(decoders: Array<Decoder<T>>): Decoder<Maybe<T>> {
        return this.of(oneOf(decoders));
    }

    public field(name: string): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(new OptionalField(name, decoder)).map(Maybe.join);
        });
    }

    public index(position: number): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(new OptionalIndex(position, decoder)).map(Maybe.join);
        });
    }

    public at(path: Array<string | number>): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(optionalAt(path, decoder)).map(Maybe.join);
        });
    }
}

class OptionalPath implements Decode {
    public constructor(
        private readonly createDecoder: <T>(decoder: Decoder<T>) => Decoder<Maybe<T>>
    ) {}

    public of<T>(decoder: Decoder<T>): Decoder<Maybe<T>> {
        return this.createDecoder(decoder);
    }

    public get string(): Decoder<Maybe<string>> {
        return this.of(string);
    }

    public get boolean(): Decoder<Maybe<boolean>> {
        return this.of(boolean);
    }

    public get int(): Decoder<Maybe<number>> {
        return this.of(int);
    }

    public get float(): Decoder<Maybe<number>> {
        return this.of(float);
    }

    public get value(): Decoder<Maybe<Value>> {
        return this.of(value);
    }

    public props<O extends {}>(config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<Maybe<O>> {
        return this.of(props(config));
    }

    public list<T>(decoder: Decoder<T>): Decoder<Maybe<Array<T>>> {
        return this.of(list(decoder));
    }

    public keyValue<T>(decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;
    public keyValue<K, T>(
        convertKey: (key: string) => Either<string, K>,
        decoder: Decoder<T>
    ): Decoder<Maybe<Array<[ K, T ]>>>;
    public keyValue<K, T>(
        ...args: [ Decoder<T> ] | [ (key: string) => Either<string, K>, Decoder<T> ]
    ): Decoder<Maybe<Array<[ string, T ]>>> | Decoder<Maybe<Array<[ K, T ]>>> {
        if (args.length === 1) {
            return this.of(keyValue(args[ 0 ]));
        }

        return this.of(keyValue(args[ 0 ], args[ 1 ]));
    }

    public dict<T>(decoder: Decoder<T>): Decoder<Maybe<{[ key: string ]: T }>> {
        return this.of(dict(decoder));
    }

    public oneOf<T>(decoders: Array<Decoder<T>>): Decoder<Maybe<T>> {
        return this.of(oneOf(decoders));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<Maybe<T>> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return new OptionalField(name, decoder);
        });
    }

    public index(position: number): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return new OptionalIndex(position, decoder);
        });
    }

    public at(path: Array<string | number>): OptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return optionalAt(path, decoder);
        });
    }

    public get optional(): Optional {
        return new Optional(this.createDecoder);
    }
}

export abstract class Decoder<T> {
    protected static decodeAs<T>(decoder: Decoder<T>, input: unknown, required: boolean) {
        return decoder.decodeAs(input, required);
    }

    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Chain(fn, this);
    }

    public decodeJSON(input: string): Either<Error, T> {
        try {
            return this.decode(JSON.parse(input));
        } catch (error) {
            const error_: SyntaxError = error;

            return Left(
                Error.Failure(`This is not valid JSON! ${error_.message}`, input)
            );
        }
    }

    public decode(input: unknown): Either<Error, T> {
        return this.decodeAs(input, true);
    }

    protected abstract decodeAs(input: unknown, required: boolean): Either<Error, T>;
}

class Map<T, R> extends Decoder<R> {
    public constructor(
        private readonly fn: (value: T) => R,
        protected readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, R> {
        return Decoder.decodeAs(this.decoder, input, required).map(this.fn);
    }
}

class Chain<T, R> extends Decoder<R> {
    public constructor(
        private readonly fn: (value: T) => Decoder<R>,
        protected readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, R> {
        return Decoder.decodeAs(this.decoder, input, required).chain((value: T): Either<Error, R> => {
            return this.fn(value).decode(input);
        });
    }
}

class Primitive<T> extends Decoder<T> {
    public constructor(
        private readonly prefix: string,
        private readonly type: string,
        private readonly check: (input: unknown) => input is T
    ) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        return this.check(input)
            ? Right(input)
            : expecting(`${required ? this.prefix : 'an OPTIONAL'} ${this.type}`, input);
    }
}

class Encoder implements Value {
    public constructor(private readonly value: unknown) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): unknown {
        return this.value;
    }
}

class Identity extends Decoder<Value> {
    protected decodeAs(input: unknown): Either<Error, Value> {
        return Right(new Encoder(input));
    }
}

class Fail extends Decoder<never> {
    constructor(private readonly message: string) {
        super();
    }

    protected decodeAs(input: unknown): Either<Error, never> {
        return Left(
            Error.Failure(this.message, input)
        );
    }
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    protected decodeAs(): Either<Error, T> {
        return Right(this.value);
    }
}

class Props<T> extends Decoder<T> {
    constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        let acc: Either<Error, T> = Right({} as T);

        for (const key in this.config) {
            if (this.config.hasOwnProperty(key)) {
                acc = acc.chain((obj: T): Either<Error, T> => {
                    return Decoder.decodeAs(this.config[ key ], input, required).map(
                        (value: T[ Extract<keyof T, string> ]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    );
                });
            }
        }

        return acc;
    }
}
class OneOf<T> extends Decoder<T> {
    constructor(private readonly decoders: Array<Decoder<T>>) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        let result: Either<Array<Error>, T> = Left([]);

        for (const decoder of this.decoders) {
            result = result.orElse((acc: Array<Error>): Either<Array<Error>, T> => {
                return Decoder.decodeAs(decoder, input, required).mapLeft((error: Error): Array<Error> => {
                    acc.push(error);

                    return acc;
                });
            });
        }

        return result.mapLeft(Error.OneOf);
    }
}

class List<T> extends Decoder<Array<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, Array<T>> {
        if (!isArray(input)) {
            return expecting(`an${required ? ' ' : ' OPTIONAL '}ARRAY`, input);
        }

        let result: Either<Error, Array<T>> = Right([]);

        for (let index = 0; index < input.length; index++) {
            result = result.chain((acc: Array<T>): Either<Error, Array<T>> => {
                return this.decoder.decode(input[ index ]).mapBoth(
                    (error: Error): Error => Error.Index(index, error),
                    (value: T): Array<T> => {
                        acc.push(value);

                        return acc;
                    }
                );
            });
        }

        return result;
    }
}

class KeyValue<K, T> extends Decoder<Array<[ K, T ]>> {
    constructor(
        private readonly convertKey: (key: string) => Either<string, K>,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, Array<[ K, T ]>> {
        if (!isObject(input)) {
            return expecting(`an${required ? ' ' : ' OPTIONAL '}OBJECT`, input);
        }

        let result: Either<Error, Array<[ K, T ]>> = Right([]);

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                result = result.chain((acc: Array<[ K, T ]>): Either<Error, Array<[ K, T ]>> => {
                    return Either.props({
                        key: this.convertKey(key).mapLeft((message: string): Error => Error.Failure(message, key)),
                        value: this.decoder.decode(input[ key ])
                    }).mapBoth(
                        (error: Error): Error => Error.Field(key, error),
                        (pair: { key: K; value: T }): Array<[ K, T ]> => {
                            acc.push([ pair.key, pair.value ]);

                            return acc;
                        }
                    );
                });
            }
        }

        return result;
    }
}

class Nullable<T> extends Decoder<Maybe<T>> {
    public constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    protected decodeAs(input: unknown): Either<Error, Maybe<T>> {
        return input == null
            ? Right(Nothing)
            : Decoder.decodeAs(this.decoder, input, false).map(Just);
    }
}

abstract class Field<T, R> extends Decoder<R> {
    protected static readonly TYPE = 'OBJECT';

    protected constructor(
        private readonly name: string,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }
    protected decodeAs(input: unknown, required: boolean): Either<Error, R> {
        if (input == null) {
            return this.decodeNullable(input, required);
        }

        if (!isObject(input)) {
            return this.decodeNotObject(input, required);
        }

        if (!(this.name in input)) {
            return this.decodeMissedField(this.name, input, required);
        }

        return this.decoder
            .decode(input[ this.name ])
            .mapBoth(
                (error: Error): Error => Error.Field(this.name, error),
                (value: T): R => this.mapSuccess(value)
            );

    }

    protected abstract decodeNullable(input: unknown, required: boolean): Either<Error, R>;

    protected abstract decodeNotObject(input: unknown, required: boolean): Either<Error, R>;

    protected abstract decodeMissedField(name: string, input: object, required: boolean): Either<Error, R>;

    protected abstract mapSuccess(value: T): R;
}

class RequiredField<T> extends Field<T, T> {
    public constructor(name: string, decoder: Decoder<T>) {
        super(name, decoder);
    }

    protected decodeNullable(input: unknown, required: boolean): Either<Error, T> {
        return expecting(`an${required ? ' ' : ' OPTIONAL '}${Field.TYPE}`, input);
    }

    protected decodeNotObject(input: unknown, required: boolean): Either<Error, T> {
        return this.decodeNullable(input, required);
    }

    protected decodeMissedField(name: string, input: object, required: boolean): Either<Error, T> {
        return expecting(
            `an${required ? ' ' : ' OPTIONAL '}${Field.TYPE} with a FIELD named '${name}'`,
            input
        );
    }

    protected mapSuccess(value: T): T {
        return value;
    }
}

class OptionalField<T> extends Field<T, Maybe<T>> {
    public constructor(name: string, decoder: Decoder<T>) {
        super(name, decoder);
    }

    protected decodeNullable(): Either<Error, Maybe<T>> {
        return Right(Nothing);
    }

    protected decodeNotObject(input: unknown): Either<Error, Maybe<T>> {
        return expecting(`an OPTIONAL ${Field.TYPE}`, input);
    }

    protected decodeMissedField(): Either<Error, Maybe<T>> {
        return this.decodeNullable();
    }

    protected mapSuccess(value: T): Maybe<T> {
        return Just(value);
    }
}

abstract class Index<T, R> extends Decoder<R> {
    protected static readonly TYPE = 'ARRAY';

    protected constructor(
        private readonly position: number,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, R> {
        if (input == null) {
            return this.decodeNullable(input, required);
        }

        if (!isArray(input)) {
            return this.decodeNotArray(input, required);
        }

        const position = this.position < 0 ? input.length + this.position : this.position;

        if (position < 0 || position >= input.length) {
            return this.decodeMissedIndex(position, input, required);
        }

        return this.decoder
            .decode(input[ this.position ])
            .mapBoth(
                (error: Error): Error => Error.Index(this.position, error),
                (value: T): R => this.mapSuccess(value)
            );
    }

    protected abstract decodeNullable(input: unknown, required: boolean): Either<Error, R>;

    protected abstract decodeNotArray(input: unknown, required: boolean): Either<Error, R>;

    protected abstract decodeMissedIndex(position: number, input: Array<unknown>, required: boolean): Either<Error, R>;

    protected abstract mapSuccess(value: T): R;
}

class RequiredIndex<T> extends Index<T, T> {
    public constructor(position: number, decoder: Decoder<T>) {
        super(position, decoder);
    }

    protected decodeNullable(input: unknown, required: boolean): Either<Error, T> {
        return expecting(`an${required ? ' ' : ' OPTIONAL '}${Index.TYPE}`, input);
    }

    protected decodeNotArray(input: unknown, required: boolean): Either<Error, T> {
        return this.decodeNullable(input, required);
    }

    protected decodeMissedIndex(position: number, input: Array<unknown>, required: boolean): Either<Error, T> {
        return expecting(
            `an${required ? ' ' : ' OPTIONAL '}ARRAY`
            + ` with an ELEMENT at [${position}] but only see ${input.length} entries`,
            input
        );
    }

    protected mapSuccess(value: T): T {
        return value;
    }
}

class OptionalIndex<T> extends Index<T, Maybe<T>> {
    public constructor(position: number, decoder: Decoder<T>) {
        super(position, decoder);
    }

    protected decodeNullable(): Either<Error, Maybe<T>> {
        return Right(Nothing);
    }

    protected decodeNotArray(input: unknown): Either<Error, Maybe<T>> {
        return expecting(`an OPTIONAL ${Index.TYPE}`, input);
    }

    protected decodeMissedIndex(): Either<Error, Maybe<T>> {
        return this.decodeNullable();
    }

    protected mapSuccess(value: T): Maybe<T> {
        return Just(value);
    }
}

export const optional: Optional = new Optional(
    <T>(decoder: Decoder<T>): Decoder<Maybe<T>> => decoder.map(Just)
);

export const string: Decoder<string> = new Primitive('a', 'STRING', isString);

export const boolean: Decoder<boolean> = new Primitive('a', 'BOOLEAN', isBoolean);

export const int: Decoder<number> = new Primitive('an', 'INTEGER', isInt);

export const float: Decoder<number> = new Primitive('a', 'FLOAT', isFloat);

export const value: Decoder<Value> = new Identity();

export function fail(message: string): Decoder<never> {
    return new Fail(message);
}

export function succeed<T>(value: T): Decoder<T> {
    return new Succeed(value);
}

export function props<O extends {}>(config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<O> {
    return new Props(config);
}

export function oneOf<T>(decoders: Array<Decoder<T>>): Decoder<T> {
    return new OneOf(decoders);
}

export function list<T>(decoder: Decoder<T>): Decoder<Array<T>> {
    return new List(decoder);
}

export function keyValue<T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;
export function keyValue<K, T>(
    convertKey: (key: string) => Either<string, K>,
    decoder: Decoder<T>
): Decoder<Array<[ K, T ]>>;
export function keyValue<K, T>(
    ...args: [ Decoder<T> ] | [ (key: string) => Either<string, K>, Decoder<T> ]
): Decoder<Array<[ string, T ]>> | Decoder<Array<[ K, T ]>> {
    if (args.length === 1) {
        return new KeyValue(Right, args[ 0 ]);
    }

    return new KeyValue(args[ 0 ], args[ 1 ]);
}

export function dict<T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> {
    return keyValue(decoder).map((pairs: Array<[ string, T ]>): {[ key: string ]: T } => {
        const acc: {[ key: string ]: T } = {};

        for (const [ key, value ] of pairs) {
            acc[ key ] = value;
        }

        return acc;
    });
}

export function lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
    return succeed(null).chain(callDecoder);
}

export function field(name: string): Path {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => new RequiredField(name, decoder));
}

export function index(position: number): Path {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => new RequiredIndex(position, decoder));
}

function requiredAt<T>(path: Array<string | number>, decoder: Decoder<T>): Decoder<T> {
    let acc: Decoder<T> = decoder;

    for (let index = path.length - 1; index >= 0; index--) {
        const fragment: string | number = path[ index ];

        acc = isString(fragment)
            ? new RequiredField(fragment, acc)
            : new RequiredIndex(fragment, acc);
    }

    return acc;
}

function optionalAt<T>(path: Array<string | number>, decoder: Decoder<T>): Decoder<Maybe<T>> {
    let acc: Decoder<Maybe<T>> = decoder.map(Just);

    for (let index = path.length - 1; index >= 0; index--) {
        const fragment: string | number = path[ index ];

        acc = isString(fragment)
            ? new OptionalField(fragment, acc).map(Maybe.join)
            : new OptionalIndex(fragment, acc).map(Maybe.join);
    }

    return acc;
}

export function at(path: Array<string | number>): Path {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => requiredAt(path, decoder));
}

export function fromEither<T>(either: Either<string, T>): Decoder<T> {
    return either.fold(fail, succeed);
}

export function fromMaybe<T>(message: string, maybe: Maybe<T>): Decoder<T> {
    return maybe.toEither(message).pipe(fromEither);
}
