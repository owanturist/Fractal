import {
    Cata,
    isString,
    isInt,
    isFloat,
    isBoolean
} from '../Basics';
import Maybe from '../Maybe';
import Either, { Left, Right } from '../Either';
import Encode from './Encode';

const isValidPropertyName = (name: string): boolean => /^[a-z_][0-9a-z_]*$/i.test(name);

const expecting = <T>(type: string, source: unknown): Either<Error, T> => {
    return Left(
        Error.Failure(`Expecting ${type}`, source)
    );
};

export type Value = Encode.Value;

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
        Field(field: string, error: Error): R;
        Index(index: number, error: Error): R;
        OneOf(errors: Array<Error>): R;
        Failure(message: string, source: unknown): R;
    }>;

    export const Field = (field: string, error: Error): Error => new Internal.Field(field, error);

    export const Index = (index: number, error: Error): Error => new Internal.Index(index, error);

    export const OneOf = (errors: Array<Error>): Error => new Internal.OneOf(errors);

    export const Failure = (message: string, source: unknown): Error => new Internal.Failure(message, source);
}

namespace Internal {
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

/*
export abstract class Decoder<T> {
    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Chain(fn, this);
    }

    public ap<R>(decoderFn: Decoder<(value: T) => R>): Decoder<R> {
        return this.chain((value: T): Decoder<R> => decoderFn.map((fn: (value: T) => R): R => fn(value)));
    }

    public pipe<R>(fn: (decoder: Decoder<T>) => R): R {
        return fn(this);
    }

    public decodeJSON(input: string): Either<Error, T> {
        try {
            return this.decode(JSON.parse(input));
        } catch (err) {
            return Left(
                Error.Failure(`This is not valid JSON! ${(err as SyntaxError).message}`, input)
            );
        }
    }

    public decodeOptional(input: unknown): Either<Error, Maybe<T>> {
        return typeof input === 'undefined' ? Right(Nothing) : this.decode(input).map(Just);
    }

    public abstract decode(input: unknown): Either<Error, T>;
}

class Map<T, R> extends Decoder<R> {
    constructor(
        private readonly fn: (value: T) => R,
        protected readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decode(input: unknown): Either<Error, R> {
        return this.decoder.decode(input).map(this.fn);
    }
}

class Chain<T, R> extends Decoder<R> {
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

class Primitive<T> extends Decoder<T> {
    constructor(
        private readonly type: string,
        private readonly check: (input: unknown) => input is T
    ) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        return this.check(input) ? Right(input) : expecting(this.type, input);
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
    public decode(input: unknown): Either<Error, Value> {
        return Right(new Encoder(input));
    }
}

class List<T> extends Decoder<Array<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: unknown): Either<Error, Array<T>> {
        if (!isArray(input)) {
            return expecting('a LIST', input);
        }

        let result: Either<Error, Array<T>> = Right([]);

        for (let index = 0; index < input.length; index++) {
            result = result.chain(
                (acc: Array<T>): Either<Error, Array<T>> => {
                    return this.decoder.decode(input[ index ]).mapBoth(
                        (error: Error): Error => Error.Index(index, error),
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

class KeyValue<T> extends Decoder<Array<[ string, T ]>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: unknown): Either<Error, Array<[ string, T ]>> {
        if (!isObject(input)) {
            return expecting('an OBJECT', input);
        }

        let result: Either<Error, Array<[ string, T ]>> = Right([]);

        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                result = result.chain(
                    (acc: Array<[ string, T ]>): Either<Error, Array<[ string, T ]>> => {
                        return this.decoder.decode(input[ key ]).mapBoth(
                            (error: Error): Error => Error.Field(key, error),
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

class Field<T> extends Decoder<T> {
    constructor(
        private readonly key: string,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decodeOptional(input: unknown): Either<Error, Maybe<T>> {
        if (!isObject(input)) {
            return expecting(`an OBJECT with an optional field named '${this.key}'`, input);
        }

        return this.key in input
            ? this.decoder.decode(input[ this.key ]).mapBoth(
                (error: Error): Error => Error.Field(this.key, error),
                Just
            )
            : Right(Nothing);
    }

    public decode(input: unknown): Either<Error, T> {
        if (isObject(input) && this.key in input) {
            return this.decoder
                .decode(input[ this.key ])
                .mapLeft((error: Error): Error => Error.Field(this.key, error));
        }

        return expecting(`an OBJECT with a field named '${this.key}'`, input);
    }
}

class Index<T> extends Decoder<T> {
    constructor(
        private readonly index: number,
        private readonly decoder: Decoder<T>
    ) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        if (!isArray(input)) {
            return expecting('an ARRAY', input);
        }

        if (this.index >= input.length) {
            return expecting(
                `a LONGER array. Need index ${this.index} but only see ${input.length} entries`,
                input
            );
        }

        return this.decoder
            .decode(input[ this.index ])
            .mapLeft((error: Error): Error => Error.Index(this.index, error));
    }
}

class OneOf<T> extends Decoder<T> {
    constructor(private readonly decoders: Array<Decoder<T>>) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        let result: Either<Array<Error>, T> = Left([]);

        for (const decoder of this.decoders) {
            result = result.orElse(
                (acc: Array<Error>): Either<Array<Error>, T> => {
                    return decoder.decode(input).mapLeft((error: Error): Array<Error> => {
                        acc.push(error);

                        return acc;
                    });
                }
            );
        }

        return result.mapLeft(Error.OneOf);
    }
}

class Props<T> extends Decoder<T> {
    constructor(private readonly config: {[ K in keyof T ]: Decoder<T[ K ]>}) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        let acc: Either<Error, T> = Right({} as T);

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

class Null<T> extends Decoder<T> {
    constructor(private readonly defaults: T) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        return input === null ? Right(this.defaults) : expecting('null', input);
    }
}

class Optional<T> extends Decoder<Maybe<T>> {
    constructor(private readonly decoder: Decoder<T>) {
        super();
    }

    public decode(input: unknown): Either<Error, Maybe<T>> {
        return this.decoder.decodeOptional(input);
    }
}

class Fail extends Decoder<never> {
    constructor(private readonly msg: string) {
        super();
    }

    public decode(input: unknown): Either<Error, never> {
        return Left(
            Error.Failure(this.msg, input)
        );
    }
}

class Succeed<T> extends Decoder<T> {
    constructor(private readonly value: T) {
        super();
    }

    public decode(): Either<Error, T> {
        return Right(this.value);
    }
}
*/

interface Decode {
    string: Decoder<unknown>;
    bool: Decoder<unknown>;
    int: Decoder<unknown>;
    float: Decoder<unknown>;

    props<O>(_config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<unknown>;
    of<T>(decoder: Decoder<T>): Decoder<unknown>;
    oneOf<T>(decoders: Array<Decoder<T>>): Decoder<unknown>;

    list<T>(decoder: Decoder<T>): Decoder<unknown>;
    dict<T>(decoder: Decoder<T>): Decoder<unknown>;

    keyValue<T>(decoder: Decoder<T>): Decoder<unknown>;
    keyValue<K, T>(convertKey: (key: string) => Either<string, K>, decoder: Decoder<T>): Decoder<unknown>;

    lazy<T>(callDecoder: () => Decoder<T>): Decoder<unknown>;

    field(key: string): unknown;
    index(position: number): unknown;
    at(path: Array<string | number>): unknown;
}

class Path implements Decode {
    public get optional(): Optional {
        throw new SyntaxError();
    }

    public get string(): Decoder<string> {
        throw new SyntaxError();
    }

    public get bool(): Decoder<boolean> {
        throw new SyntaxError();
    }

    public get int(): Decoder<number> {
        throw new SyntaxError();
    }

    public get float(): Decoder<number> {
        throw new SyntaxError();
    }

    public get value(): Decoder<Value> {
        throw new SyntaxError();
    }

    public props<O>(_config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<O> {
        throw new SyntaxError();
    }

    public of<T>(_decoder: Decoder<T>): Decoder<T> {
        throw new SyntaxError();
    }

    public oneOf<T>(_decoders: Array<Decoder<T>>): Decoder<T> {
        throw new SyntaxError();
    }

    public list<T>(_decoder: Decoder<T>): Decoder<Array<T>> {
        throw new SyntaxError();
    }

    public dict<T>(_decoder: Decoder<T>): Decoder<{[ key: string ]: T }> {
        throw new SyntaxError();
    }

    public keyValue<T>(_decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;
    public keyValue<K, T>(
        _convertKey: (key: string) => Either<string, K>,
        _decoder: Decoder<T>
    ): Decoder<Array<[ K, T ]>>;
    public keyValue(..._args: any): any {
        throw new SyntaxError();
    }

    public lazy<T>(_callDecoder: () => Decoder<T>): Decoder<T> {
        throw new SyntaxError();
    }

    public field(_name: string): Path {
        throw new SyntaxError();
    }

    public index(_position: number): Path {
        throw new SyntaxError();
    }

    public at(_path: Array<string | number>): Path {
        throw new SyntaxError();
    }
}

class Optional implements Decode {
    public get string(): Decoder<Maybe<string>> {
        throw new SyntaxError();
    }

    public get bool(): Decoder<Maybe<boolean>> {
        throw new SyntaxError();
    }

    public get int(): Decoder<Maybe<number>> {
        throw new SyntaxError();
    }

    public get float(): Decoder<Maybe<number>> {
        throw new SyntaxError();
    }

    public props<O>(_config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<Maybe<O>> {
        throw new SyntaxError();
    }

    public of<T>(_decoder: Decoder<T>): Decoder<Maybe<T>> {
        throw new SyntaxError();
    }

    public oneOf<T>(_decoders: Array<Decoder<T>>): Decoder<Maybe<T>> {
        throw new SyntaxError();
    }

    public list<T>(_decoder: Decoder<T>): Decoder<Maybe<Array<T>>> {
        throw new SyntaxError();
    }

    public dict<T>(_decoder: Decoder<T>): Decoder<Maybe<{[ key: string ]: T }>> {
        throw new SyntaxError();
    }

    public keyValue<T>(_decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;
    public keyValue<K, T>(
        _convertKey: (key: string) => Either<string, K>,
        _decoder: Decoder<T>
    ): Decoder<Maybe<Array<[ K, T ]>>>;
    public keyValue(..._args: any): any {
        throw new SyntaxError();
    }

    public lazy<T>(_callDecoder: () => Decoder<T>): Decoder<Maybe<T>> {
        throw new SyntaxError();
    }

    public field(_name: string): OptionalPath {
        throw new SyntaxError();
    }

    public index(_position: number): OptionalPath {
        throw new SyntaxError();
    }

    public at(_path: Array<string | number>): OptionalPath {
        throw new SyntaxError();
    }
}

class OptionalPath extends Optional {
    public get optional(): Optional {
        throw new SyntaxError();
    }

    public get value(): Decoder<Value> {
        throw new SyntaxError();
    }
}

export abstract class Decoder<T> {
    public map<R>(_fn: (value: T) => R): Decoder<R> {
        throw new SyntaxError();
    }

    public chain<R>(_fn: (value: T) => Decoder<R>): Decoder<R> {
        throw new SyntaxError();
    }

    public chainMaybe<R>(message: string, fn: (value: T) => Maybe<R>): Decoder<R> {
        return this.chain((value: T): Decoder<R> => fromMaybe(message, fn(value)));
    }

    public chainEither<R>(fn: (value: T) => Either<string, R>): Decoder<R> {
        return this.map(fn).chain(fromEither);
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

    public abstract decode(input: unknown): Either<Error, T>;

    protected abstract getType(): string;
}

class Primitive<T> extends Decoder<T> {
    public constructor(
        private readonly prefix: string,
        private readonly type: string,
        private readonly check: (input: unknown) => input is T
    ) {
        super();
    }

    public decode(input: unknown): Either<Error, T> {
        return this.check(input) ? Right(input) : expecting(`${this.prefix} ${this.type}`, input);
    }

    protected getType() {
        return this.type;
    }
}

export const optional: Optional = null as any;

export const string: Decoder<string> = new Primitive('a', 'STRING', isString);

export const bool: Decoder<boolean> = new Primitive('a', 'BOOLEAN', isBoolean);

export const int: Decoder<number> = new Primitive('an', 'INTEGER', isInt);

export const float: Decoder<number> = new Primitive('a', 'FLOAT', isFloat);

export const value: Decoder<Value> = null as any;

export function fail(_message: string): Decoder<never> {
    throw new SyntaxError();
}

export function succeed<T>(_value: T): Decoder<T> {
    throw new SyntaxError();
}

export function props<O>(_config: {[ K in keyof O ]: Decoder<O[ K ]>}): Decoder<O> {
    throw new SyntaxError();
}

export function oneOf<T>(_decoders: Array<Decoder<T>>): Decoder<T> {
    throw new SyntaxError();
}

export function list<T>(_decoder: Decoder<T>): Decoder<Array<T>> {
    throw new SyntaxError();
}

export function dict<T>(_decoder: Decoder<T>): Decoder<{[ key: string ]: T }> {
    throw new SyntaxError();
}

export function keyValue<T>(_decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;
export function keyValue<K, T>(
    _convertKey: (key: string) => Either<string, K>,
    _decoder: Decoder<T>
): Decoder<Array<[ K, T ]>>;
export function keyValue(..._args: any): any {
    throw new SyntaxError();
}

export function lazy<T>(_callDecoder: () => Decoder<T>): Decoder<T> {
    throw new SyntaxError();
}

export function field(_name: string): Path {
    throw new SyntaxError();
}

export function index(_position: number): Path {
    throw new SyntaxError();
}

export function at(_path: Array<string | number>): Path {
    throw new SyntaxError();
}

export function fromEither<T>(_either: Either<string, T>): Decoder<T> {
    throw new SyntaxError();
}

export function fromMaybe<T>(_message: string, _maybe: Maybe<T>): Decoder<T> {
    throw new SyntaxError();
}
