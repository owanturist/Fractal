import {
    isString,
    isInt,
    isFloat,
    isBoolean,
    isObject,
    isArray
} from '../../Basics';
import Maybe, { Nothing, Just } from '../../Maybe';
import Either, { Left, Right } from '../../Either';
import Encode from '../Encode';
import Error from './Error';
import {
    Path as IPath,
    OptionalPath as IOptionalPath,
    Optional as IOptional
} from './index';

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

class Path implements IPath {
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

    public get value(): Decoder<Encode.Value> {
        return this.of(value);
    }

    public shape<T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T> {
        return this.of(shape(object));
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

    public enums<T>(config: Array<[ string | number | boolean | null, T ]>): Decoder<T> {
        return this.of(enums(config));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): IPath {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(Field.required(name, decoder));
        });
    }

    public index(position: number): IPath {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(Index.required(position, decoder));
        });
    }

    public at(path: Array<string | number>): IPath {
        return new Path(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(requiredAt(path, decoder));
        });
    }

    public get optional(): IOptional {
        return new Optional(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(decoder).map(Just);
        });
    }
}

class OptionalPath implements IOptionalPath {
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

    public get value(): Decoder<Maybe<Encode.Value>> {
        return this.of(value);
    }

    public shape<T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<Maybe<T>> {
        return this.of(shape(object));
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

    public enums<T>(config: Array<[ string | number | boolean | null, T ]>): Decoder<Maybe<T>> {
        return this.of(enums(config));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<Maybe<T>> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return Field.optional(name, decoder);
        });
    }

    public index(position: number): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return Index.optional(position, decoder);
        });
    }

    public at(path: Array<string | number>): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return optionalAt(path, decoder);
        });
    }

    public get optional(): IOptional {
        return new Optional(this.createDecoder);
    }
}

class Optional implements IOptional {
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

    public shape<T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<Maybe<T>> {
        return this.of(shape(object));
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

    public enums<T>(config: Array<[ string | number | boolean | null, T ]>): Decoder<Maybe<T>> {
        return this.of(enums(config));
    }

    public field(name: string): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(Field.optional(name, decoder)).map(Maybe.join);
        });
    }

    public index(position: number): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(Index.optional(position, decoder)).map(Maybe.join);
        });
    }

    public at(path: Array<string | number>): IOptionalPath {
        return new OptionalPath(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(optionalAt(path, decoder)).map(Maybe.join);
        });
    }
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

class Fail extends Decoder<never> {
    public constructor(private readonly message: string) {
        super();
    }

    protected decodeAs(input: unknown): Either<Error, never> {
        return Left(
            Error.Failure(this.message, input)
        );
    }
}

class Succeed<T> extends Decoder<T> {
    public constructor(private readonly value: T) {
        super();
    }

    protected decodeAs(): Either<Error, T> {
        return Right(this.value);
    }
}

class Shape<T> extends Decoder<T> {
    public constructor(private readonly object: {[ K in keyof T ]: Decoder<T[ K ]>}) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        let acc: Either<Error, T> = Right({} as T);

        for (const key in this.object) {
            if (this.object.hasOwnProperty(key)) {
                acc = acc.chain((obj: T): Either<Error, T> => {
                    return Decoder.decodeAs(this.object[ key ], input, required).map(
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
    public constructor(private readonly decoders: Array<Decoder<T>>) {
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

class Enums<T> extends Decoder<T> {
    public constructor(private readonly config: Array<[ string | number | boolean | null, T ]>) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        const errors: Array<Error> = [];

        for (const [ expected, value ] of this.config) {
            if (expected === input || expected !== expected && input !== input) {
                return Right(value);
            }

            const exp = typeof expected === 'string' ? `"${expected}"` : expected;

            errors.push(Error.Failure(
                `Expecting${required ? ' ' : ' an OPTIONAL '}\`${exp}\``,
                input
            ));
        }

        return Left(Error.OneOf(errors));
    }
}

class List<T> extends Decoder<Array<T>> {
    public constructor(private readonly decoder: Decoder<T>) {
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
    public constructor(
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
    public static required<T>(name: string, decoder: Decoder<T>): Decoder<T> {
        return new RequiredField(name, decoder);
    }

    public static optional<T>(name: string, decoder: Decoder<T>): Decoder<Maybe<T>> {
        return new OptionalField(name, decoder);
    }

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
    public static required<T>(position: number, decoder: Decoder<T>): Decoder<T> {
        return new RequiredIndex(position, decoder);
    }

    public static optional<T>(position: number, decoder: Decoder<T>): Decoder<Maybe<T>> {
        return new OptionalIndex(position, decoder);
    }

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

    protected abstract decodeMissedIndex(
        position: number,
        input: Array<unknown>,
        required: boolean
    ): Either<Error, R>;

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

    protected decodeMissedIndex(
        position: number,
        input: Array<unknown>,
        required: boolean
    ): Either<Error, T> {
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

class Encoder implements Encode.Value {
    public constructor(private readonly value: unknown) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): unknown {
        return this.value;
    }
}

const expecting = (type: string, source: unknown): Either<Error, never> => Left(
    Error.Failure(`Expecting ${type}`, source)
);

const requiredAt = <T>(path: Array<string | number>, decoder: Decoder<T>): Decoder<T> => {
    let acc: Decoder<T> = decoder;

    for (let index = path.length - 1; index >= 0; index--) {
        const fragment: string | number = path[ index ];

        acc = isString(fragment)
            ? Field.required(fragment, acc)
            : Index.required(fragment, acc);
    }

    return acc;
};

const optionalAt = <T>(path: Array<string | number>, decoder: Decoder<T>): Decoder<Maybe<T>> => {
    let acc: Decoder<Maybe<T>> = decoder.map(Just);

    for (let index = path.length - 1; index >= 0; index--) {
        const fragment: string | number = path[ index ];

        acc = isString(fragment)
            ? Field.optional(fragment, acc).map(Maybe.join)
            : Index.optional(fragment, acc).map(Maybe.join);
    }

    return acc;
};

export const value: Decoder<Encode.Value> = new class Identity extends Decoder<Encode.Value> {
    protected decodeAs(input: unknown): Either<Error, Encode.Value> {
        return Right(new Encoder(input));
    }
}();

export const string: Decoder<string> = new Primitive('a', 'STRING', isString);

export const boolean: Decoder<boolean> = new Primitive('a', 'BOOLEAN', isBoolean);

export const int: Decoder<number> = new Primitive('an', 'INTEGER', isInt);

export const float: Decoder<number> = new Primitive('a', 'FLOAT', isFloat);

export const fail = (message: string): Decoder<never> => new Fail(message);

export const succeed = <T>(value: T): Decoder<T> => new Succeed(value);

export const shape = <T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}): Decoder<T> => new Shape(object);

export const list = <T>(decoder: Decoder<T>): Decoder<Array<T>> => new List(decoder);

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

export const dict = <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> => {
    return keyValue(decoder).map((pairs: Array<[ string, T ]>): {[ key: string ]: T } => {
        const acc: {[ key: string ]: T } = {};

        for (const [ key, value ] of pairs) {
            acc[ key ] = value;
        }

        return acc;
    });
};

export const oneOf = <T>(decoders: Array<Decoder<T>>): Decoder<T> => new OneOf(decoders);

export const enums = <T>(config: Array<[ string | number | boolean | null, T ]>): Decoder<T> => new Enums(config);

export const lazy = <T>(callDecoder: () => Decoder<T>): Decoder<T> => {
    return succeed(null).chain(callDecoder);
};

export const field = (name: string): IPath => {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => Field.required(name, decoder));
};

export const index = (position: number): IPath => {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => Index.required(position, decoder));
};

export const at = (path: Array<string | number>): IPath => {
    return new Path(<T>(decoder: Decoder<T>): Decoder<T> => requiredAt(path, decoder));
};

export const optional: IOptional = new Optional(
    <T>(decoder: Decoder<T>): Decoder<Maybe<T>> => decoder.map(Just)
);

export const fromEither = <T>(either: Either<string, T>): Decoder<T> => {
    return either.fold(fail, succeed);
};

export const fromMaybe = <T>(message: string, maybe: Maybe<T>): Decoder<T> => {
    return maybe.toEither(message).pipe(fromEither);
};
