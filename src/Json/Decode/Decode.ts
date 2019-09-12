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

export interface RequiredKeyValue {
    /**
     * @param decoder Decoder of the object element.
     */
    <T>(decoder: Decoder<T>): Decoder<Array<[ string, T ]>>;

    /**
     * @param convertKey Converts field name from string to `K`.
     * @param decoder Decoder of the object element.
     */
    <K, T>(convertKey: (key: string) => Either<string, K>, decoder: Decoder<T>): Decoder<Array<[ K, T ]>>;
}

export interface OptionalKeyValue {
    /**
     * @param decoder Decoder of the object element.
     */
    <T>(decoder: Decoder<T>): Decoder<Maybe<Array<[ string, T ]>>>;

    /**
     * @param convertKey Converts field name from string to `K`.
     * @param decoder Decoder of the object element.
     */
    <K, T>(convertKey: (key: string) => Either<string, K>, decoder: Decoder<T>): Decoder<Maybe<Array<[ K, T ]>>>;
}

export type RequiredDict = <T>(decoder: Decoder<T>) => Decoder<{[ key: string ]: T}>;

export type OptionalDict = <T>(decoder: Decoder<T>) => Decoder<Maybe<{[ key: string ]: T}>>;

export type RequiredList = <T>(decoder: Decoder<T>) => Decoder<Array<T>>;

export type OptionaldList = <T>(decoder: Decoder<T>) => Decoder<Maybe<Array<T>>>;

export type RequiredShape = <T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}) => Decoder<T>;

export type OptionalShape = <T extends {}>(object: {[ K in keyof T ]: Decoder<T[ K ]>}) => Decoder<Maybe<T>>;

export type RequiredOf = <T>(decoder: Decoder<T>) => Decoder<T>;

export type OptionalOf = <T>(decoder: Decoder<T>) => Decoder<Maybe<T>>;

export type RequiredOneOf = <T>(decoders: Array<Decoder<T>>) => Decoder<T>;

export type OptionalOneOf = <T>(decoders: Array<Decoder<T>>) => Decoder<Maybe<T>>;

export type RequiredEnums = <T>(variants: Array<[ string | number | boolean | null, T ]>) => Decoder<T>;

export type OptionalEnums = <T>(variants: Array<[ string | number | boolean | null, T ]>) => Decoder<Maybe<T>>;

export type RequiredLazy = <T>(callDecoder: () => Decoder<T>) => Decoder<T>;

export type OptionalLazy = <T>(callDecoder: () => Decoder<T>) => Decoder<Maybe<T>>;

interface Common {
    string: unknown;
    boolean: unknown;
    int: unknown;
    float: unknown;

    keyValue: unknown;
    shape: unknown;
    list: unknown;
    dict: unknown;

    of: unknown;
    oneOf: unknown;
    enums: unknown;

    field(key: string): Common;
    index(position: number): Common;
    at(path: Array<string | number>): Common;
}

interface NotOptional extends Common {
    optional: Optional;

    value: unknown;
    lazy: unknown;
}

export interface Optional extends Common {
    /**
     * Decode a JSON into an optional `string`.
     *
     * @example
     * optional.string.decodeJSON('null')              // Right(Nothing)
     * optional.string.decodeJSON('true')              // Left(...)
     * optional.string.decodeJSON('42')                // Left(...)
     * optional.string.decodeJSON('3.14')              // Left(...)
     * optional.string.decodeJSON('"hello"')           // Right(Just('hello'))
     * optional.string.decodeJSON('{ "hello": 42 }')   // Left(..)
     */
    string: Decoder<Maybe<string>>;

    /**
     * Decode a JSON into an optional `boolean`.
     *
     * @example
     * optional.boolean.decodeJSON('null')             // Right(Nothing)
     * optional.boolean.decodeJSON('true')             // Right(Just(true))
     * optional.boolean.decodeJSON('42')               // Left(..)
     * optional.boolean.decodeJSON('3.14')             // Left(..)
     * optional.boolean.decodeJSON('"hello"')          // Left(..)
     * optional.boolean.decodeJSON('{ "hello": 42 }')  // Left(..)
     */
    boolean: Decoder<Maybe<boolean>>;

    /**
     * Decode a JSON into an optional `int` (`number` in fact).
     *
     * @example
     * optional.int.decodeJSON('null')              // Right(Nothing)
     * optional.int.decodeJSON('true')              // Left(..)
     * optional.int.decodeJSON('42')                // Right(Just(42))
     * optional.int.decodeJSON('3.14')              // Left(..)
     * optional.int.decodeJSON('"hello"')           // Left(..)
     * optional.int.decodeJSON('{ "hello": 42 }')   // Left(..)
     */
    int: Decoder<Maybe<number>>;

    /**
     * Decode a JSON into an optional `float` (`number` in fact).
     *
     * @example
     * optional.float.decodeJSON('null')             // Right(Nothing)
     * optional.float.decodeJSON('true')             // Left(..)
     * optional.float.decodeJSON('42')               // Right(Just(42))
     * optional.float.decodeJSON('3.14')             // Right(Just(3.41))
     * optional.float.decodeJSON('"hello"')          // Left(..)
     * optional.float.decodeJSON('{ "hello": 42 }')  // Left(..)
     */
    float: Decoder<Maybe<number>>;

    /**
     * Take an object of `Decoder`s and return a `Decoder` with an optional object of values.
     * Decoding fails if at least one of the fields fails.
     *
     * @param object Object schema.
     *
     * @example
     * const decoder = optional.shape({
     *     x: field('_x_').float,
     *     y: field('_y_').float,
     * })
     *
     * decoder.decodeJSON('null')
     * // Right(Nothing)
     *
     * decoder.decodeJSON('{ "_x_": 12.34, "_y_": 56.78 }')
     * // Right(Just({ x: 12.34, y: 56.78 }))
     */
    shape: OptionalShape;

    /**
     * Decode a JSON into an optional `Array`.
     *
     * @param decoder Decoder of the `Array`'s element.
     *
     * @example
     * optional.list(int).decodeJSON('null')
     * // Right(Nothing)
     * optional.list(boolean).decodeJSON('[ true, false ]')
     * // Right(Just([ true, false ]))
     */
    list: OptionaldList;

    /**
     * Decode a JSON into an optional `Array` of pairs.
     *
     * @example
     * optional.keyValue(number).decodeJSON('null')
     * // Right(Nothing)
     * optional.keyValue(number).decodeJSON('{ "key_1": 2, "key_2": 1 }')
     * // Right(Just([[ 'key_1', 2 ], [ 'key_2', 1 ]]))
     */
    keyValue: OptionalKeyValue;

    /**
     * Decode a JSON into an optional object.
     *
     * @param decoder Decoder of the object value.
     *
     * @example
     * optional.dict(number).decodeJSON('null')
     * // Right(Nothing)
     * optional.dict(number).decodeJSON('{ "key_1": 2, "key_2": 1 }')
     * // Right(Just({ key_1: 2, key_2: 1 }))
     */
    dict: OptionalDict;

    /**
     * Makes the `decoder` optional.
     *
     * @example
     * optional.of(string) === optional.string
     */
    of: OptionalOf;

    /**
     * Try a bunch of different decoders.
     * This can be useful if the JSON value may come in a couple different formats.
     * For example, say you want to read an array of int, but some of them are strings.
     *
     * @param decoders Bunch of potential decoders.
     *
     * @example
     * list(
     *     optional.oneOf([
     *         int,
     *         string.chain(str => fromMaybe('Expecting an INTEGER', Basics.toInt(str)))
     *     ])
     * ).decodeJSON('[ null, 1, "2", 3, "4" ]')
     * // Right([ Nothing, Just(1), Just(2), Just(3), Just(4) ])
     */
    oneOf: OptionalOneOf;

    /**
     * Creates optional enum decoder based on variants.
     *
     * @param variants Pairs of primitives (string | number | boolean | null) and variants.
     *
     * @example
     * const currencyDecoder = optional.enums([
     *     [ 'USD', new USD(0) ],
     *     [ 'EUR', new EUR(0) ],
     *     [ 'RUB', new RUB(0) ],
     * ])
     *
     * currencyDecoder.decodeJSON('null')  // Right(Nothing)
     * currencyDecoder.decodeJSON('"RUB"') // Right(Just(new RUB(0)))
     */
    enums: OptionalEnums;

    /**
     * Decode a JSON object, requiring a particular optional field.
     *
     * @param name Name of the field.
     *
     * @example
     * optional.field('name').string.decodeJSON('null')               // Right(Nothing)
     * optional.field('name').string.decodeJSON('{}')                 // Right(Nothing)
     * optional.field('name').string.decodeJSON('{ "name": null }')   // Left(..)
     * optional.field('name').string.decodeJSON('{ "name": 1 }')      // Left(..)
     * optional.field('name').string.decodeJSON('{ "name": "tom" }')  // Right(Just('tom'))
     */
    field(name: string): OptionalPath;

    /**
     * Decode a JSON array, requiring a particular optional index.
     *
     * @param position Exact index of the decoding value.
     *
     * @example
     * const json = '[ "alise", null, "chuck" ]';
     *
     * optional.index(0).string.decodeJSON(json)   // Right(Just('alise'))
     * optional.index(1).string.decodeJSON(json)   // Left(..)
     * optional.index(2).string.decodeJSON(json)   // Right(Just('chuck'))
     * optional.index(-1).string.decodeJSON(json)  // Right(Just('chuck'))
     * optional.index(3).string.decodeJSON(json)   // Right(Nothing)
     */
    index(position: number): OptionalPath;

    /**
     * Decode a nested JSON object, requiring certain optional fields and indexes.
     *
     * @param path
     *
     * @example
     * const json = '{ "person": { "name": "tom", "age": 42, "accounts": [ "tom_42" ] } }';
     *
     * optional.at([ 'count' ]).int.decodeJSON(json)                     // Right(Nothing)
     * optional.at([ 'person', 'height' ]).float.decodeJSON(json)        // Right(Nothing)
     * optional.at([ 'person', 'name' ]).string.decodeJSON(json)         // Right(Just('tom'))
     * optional.at([ 'person', 'age' ]).int.decodeJSON(json)             // Right(Just(42))
     * optional.at([ 'person', 'accounts', 0 ]).string.decodeJSON(json)  // Right(Just('tom_42"'))
     * optional.at([ 'person', 'accounts', 1 ]).string.decodeJSON(json)  // Right(Nothing)
     *
     * // This is really just a shorthand for saying things like:
     *
     * optional.field('count').int
     * optional.field('person').optional.field('height').float
     * optional.field('person').optional.field('name').string
     * optional.field('person').optional.field('age').int
     * optional.field('person').optional.field('accounts').optional.index(0).string
     * optional.field('person').optional.field('accounts').optional.index(1).string
     */
    at(path: Array<string | number>): OptionalPath;
}

export interface Path extends NotOptional {
    optional: Optional;

    string: Decoder<string>;

    boolean: Decoder<boolean>;
    int: Decoder<number>;
    float: Decoder<number>;
    value: Decoder<Encode.Value>;

    shape: RequiredShape;
    list: RequiredList;
    keyValue: RequiredKeyValue;
    dict: RequiredDict;

    of: RequiredOf;
    oneOf: RequiredOneOf;
    enums: RequiredEnums;

    lazy: RequiredLazy;

    field(name: string): Path;
    index(position: number): Path;
    at(path: Array<string | number>): Path;
}

export interface OptionalPath extends NotOptional {
    optional: Optional;

    string: Decoder<Maybe<string>>;
    boolean: Decoder<Maybe<boolean>>;
    int: Decoder<Maybe<number>>;
    float: Decoder<Maybe<number>>;
    value: Decoder<Maybe<Encode.Value>>;

    shape: OptionalShape;
    list: OptionaldList;
    keyValue: OptionalKeyValue;
    dict: OptionalDict;

    of: OptionalOf;
    oneOf: OptionalOneOf;
    enums: OptionalEnums;

    lazy: OptionalLazy;

    field(name: string): OptionalPath;
    index(position: number): OptionalPath;
    at(path: Array<string | number>): OptionalPath;
}

/**
 * A Containers that knows how to decode JSON and unknown JS values.
 */
export abstract class Decoder<T> {
    protected static decodeAs<T>(decoder: Decoder<T>, input: unknown, required: boolean) {
        return decoder.decodeAs(input, required);
    }

    /**
     * Transform the `Decoder` with a given function.
     *
     * @param fn Transforming function.
     *
     * @example
     * Decode.string.map((str: string): number => str.length).decode('1234') // Right(4)
     */
    public map<R>(fn: (value: T) => R): Decoder<R> {
        return new Map(fn, this);
    }

    /**
     * Create decoders that depend on previous results.
     *
     * @param fn Chaining function.
     *
     * @example
     * Decode.string.chain((str: string): Decoder<Date> => {
     *     const date = new Date(str);
     *
     *     return isNaN(date.getTime()) ? Decode.fail('Expecting a DATE') : Decode.succeed(date);
     * }).decode('2010-01-02') // Right(new Date('2010-01-02'))
     */
    public chain<R>(fn: (value: T) => Decoder<R>): Decoder<R> {
        return new Chain(fn, this);
    }

    /**
     * Parse the given string into a JSON and then run the `Decoder` on it.
     * This will fail if the string is not well-formed JSON or if the Decoder fails for some reason.
     *
     * @param json JSON string.
     */
    public decodeJSON(json: string): Either<Error, T> {
        try {
            return this.decode(JSON.parse(json));
        } catch (error) {
            const error_: SyntaxError = error;

            return Left(
                Error.Failure(`This is not valid JSON! ${error_.message}`, json)
            );
        }
    }

    /**
     * Run the `Decoder` on unknown JS value.
     *
     * @param input JS value.
     */
    public decode(input: unknown): Either<Error, T> {
        return this.decodeAs(input, true);
    }

    protected abstract decodeAs(input: unknown, required: boolean): Either<Error, T>;
}

class PathImpl implements Path {
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

    public enums<T>(variants: Array<[ string | number | boolean | null, T ]>): Decoder<T> {
        return this.of(enums(variants));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<T> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): Path {
        return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(Field.required(name, decoder));
        });
    }

    public index(position: number): Path {
        return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(Index.required(position, decoder));
        });
    }

    public at(path: Array<string | number>): Path {
        return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => {
            return this.createDecoder(requiredAt(path, decoder));
        });
    }

    public get optional(): Optional {
        return new OptionalImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(decoder).map(Just);
        });
    }
}

class OptionalPathImpl implements OptionalPath {
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

    public enums<T>(variants: Array<[ string | number | boolean | null, T ]>): Decoder<Maybe<T>> {
        return this.of(enums(variants));
    }

    public lazy<T>(callDecoder: () => Decoder<T>): Decoder<Maybe<T>> {
        return this.of(lazy(callDecoder));
    }

    public field(name: string): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return Field.optional(name, decoder);
        });
    }

    public index(position: number): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return Index.optional(position, decoder);
        });
    }

    public at(path: Array<string | number>): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return optionalAt(path, decoder);
        });
    }

    public get optional(): Optional {
        return new OptionalImpl(this.createDecoder);
    }
}

class OptionalImpl implements Optional {
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

    public enums<T>(variants: Array<[ string | number | boolean | null, T ]>): Decoder<Maybe<T>> {
        return this.of(enums(variants));
    }

    public field(name: string): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(Field.optional(name, decoder)).map(Maybe.join);
        });
    }

    public index(position: number): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
            return this.createDecoder(Index.optional(position, decoder)).map(Maybe.join);
        });
    }

    public at(path: Array<string | number>): OptionalPath {
        return new OptionalPathImpl(<T>(decoder: Decoder<T>): Decoder<Maybe<T>> => {
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
    public constructor(private readonly variants: Array<[ string | number | boolean | null, T ]>) {
        super();
    }

    protected decodeAs(input: unknown, required: boolean): Either<Error, T> {
        const errors: Array<Error> = [];

        for (const [ expected, value ] of this.variants) {
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
            .decode(input[ position ])
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

/**
 * Do not do anything with a JSON value, just bring it into an `Encode.Value`.
 * This can be useful if you have particularly complex data that you would like to deal with later.
 * Or if you are going to send it out somewhere and do not care about its structure.
 */
export const value: Decoder<Encode.Value> = new class Value extends Decoder<Encode.Value> {
    protected decodeAs(input: unknown): Either<Error, Encode.Value> {
        return Right(new Encoder(input));
    }
}();

/**
 * Decode a JSON into a `string`.
 *
 * @example
 * string.decodeJSON('true')              // Left(...)
 * string.decodeJSON('42')                // Left(...)
 * string.decodeJSON('3.14')              // Left(...)
 * string.decodeJSON('"hello"')           // Right('hello')
 * string.decodeJSON('{ "hello": 42 }')   // Left(..)
 */
export const string: Decoder<string> = new Primitive('a', 'STRING', isString);

/**
 * Decode a JSON into a `boolean`.
 *
 * @example
 * boolean.decodeJSON('true')             // Right(true)
 * boolean.decodeJSON('42')               // Left(..)
 * boolean.decodeJSON('3.14')             // Left(..)
 * boolean.decodeJSON('"hello"')          // Left(..)
 * boolean.decodeJSON('{ "hello": 42 }')  // Left(..)
 */
export const boolean: Decoder<boolean> = new Primitive('a', 'BOOLEAN', isBoolean);

/**
 * Decode a JSON into an `int` (`number` in fact).
 *
 * @example
 * int.decodeJSON('true')              // Left(..)
 * int.decodeJSON('42')                // Right(42)
 * int.decodeJSON('3.14')              // Left(..)
 * int.decodeJSON('"hello"')           // Left(..)
 * int.decodeJSON('{ "hello": 42 }')   // Left(..)
 */
export const int: Decoder<number> = new Primitive('an', 'INTEGER', isInt);

/**
 * Decode a JSON into a `float` (`number` in fact).
 *
 * @example
 * float.decodeJSON('true')             // Left(..)
 * float.decodeJSON('42')               // Right(42)
 * float.decodeJSON('3.14')             // Right(3.41)
 * float.decodeJSON('"hello"')          // Left(..)
 * float.decodeJSON('{ "hello": 42 }')  // Left(..)
 */
export const float: Decoder<number> = new Primitive('a', 'FLOAT', isFloat);

/**
 * Ignore the JSON value and make the decoder fail.
 * This is handy when used with `oneOf` or `chain` where you want to give a custom error message in some case.
 *
 * @param message Custom error message
 *
 * @example
 * string.chain((str: string): Decoder<Date> => {
 *     const date = new Date(str);
 *
 *     return isNaN(date.getTime()) ? Decode.fail('Expecting a DATE') : Decode.succeed(date);
 * }).decode('2010-01-02')
 * // Right(new Date('2010-01-02'))
 */
export const fail = (message: string): Decoder<never> => new Fail(message);

/**
 * Ignore the JSON value and produce a certain value.
 * This is handy when used with `oneOf` or `chain`.
 *
 * @param value The certain value.
 *
 * @example
 * string.chain((str: string): Decoder<Date> => {
 *     const date = new Date(str);
 *
 *     return isNaN(date.getTime()) ? Decode.fail('Expecting a DATE') : Decode.succeed(date);
 * }).decode('2010-01-02')
 * // Right(new Date('2010-01-02'))
 */
export const succeed = <T>(value: T): Decoder<T> => new Succeed(value);

/**
 * Take an object of `Decoder`s and return a `Decoder` with an object of values.
 * Decoding fails if at least one of the fields fails.
 *
 * @param object Object schema.
 *
 * @example
 * shape({
 *     x: field('_x_').float,
 *     y: field('_y_').float,
 * }).decodeJSON('{ "_x_": 12.34, "_y_": 56.78 }')
 * // Right({ x: 12.34, y: 56.78 })
 */
export const shape: RequiredShape = object => new Shape(object);

/**
 * Decode a JSON into an `Array`.
 *
 * @param decoder Decoder of the `Array`'s element.
 *
 * @example
 * list(int).decodeJSON('[ 1, 2, 3 ]')
 * // Right([ 1, 2, 3 ])
 *
 * list(boolean).decodeJSON('[ true, false ]')
 * // Right([ true, false ])
 */
export const list: RequiredList = decoder => new List(decoder);

/**
 * Decode a JSON into an `Array` of pairs.
 *
 * @example
 * keyValue(number).decodeJSON('{ "key_1": 2, "key_2": 1 }')
 * // Right([[ 'key_1', 2 ], [ 'key_2', 1 ]])
 *
 * keyValue(intFromString, boolean).decodeJSON('{ "1": true, "2": false }')
 * // Right([[ 1, true ], [ 2, false ]])
 */
export const keyValue: RequiredKeyValue = <T, K>(
    ...args: [ Decoder<T> ] | [ (key: string) => Either<string, K>, Decoder<T> ]
) => {
    if (args.length === 1) {
        return new KeyValue(Right, args[ 0 ]);
    }

    return new KeyValue(args[ 0 ], args[ 1 ]);
};

/**
 * Decode a JSON into an object.
 *
 * @param decoder Decoder of the object value.
 *
 * @example
 * dict(number).decodeJSON('{ "key_1": 2, "key_2": 1 }')
 * // Right({ key_1: 2, key_2: 1 })
 */
export const dict = <T>(decoder: Decoder<T>): Decoder<{[ key: string ]: T }> => {
    return keyValue(decoder).map((pairs: Array<[ string, T ]>): {[ key: string ]: T } => {
        const acc: {[ key: string ]: T } = {};

        for (const [ key, value ] of pairs) {
            acc[ key ] = value;
        }

        return acc;
    });
};

/**
 * Try a bunch of different decoders.
 * This can be useful if the JSON value may come in a couple different formats.
 * For example, say you want to read an array of int, but some of them are strings.
 *
 * Why would someone generate input like this?
 * Questions like this are not good for your health.
 * The point is that you can use `oneOf` to handle situations like this!
 *
 * You could also use `oneOf` to help version your data.
 * Try the latest format, then a few older ones that you still support.
 * You could use `chain` to be even more particular if you wanted.
 *
 * @param decoders Bunch of potential decoders.
 *
 * @example
 * list(
 *     oneOf([
 *         int,
 *         string.chain(str => fromMaybe('Expecting an INTEGER', Basics.toInt(str)))
 *     ])
 * ).decodeJSON('[ 0, 1, "2", 3, "4" ]')
 * // Right([ 0, 1, 2, 3, 4 ])
 */
export const oneOf: RequiredOneOf = decoders => new OneOf(decoders);

/**
 * Creates enum decoder based on variants.
 *
 * @param variants Pairs of primitives (string | number | boolean | null) and variants.
 *
 * @example
 * enums([
 *     [ 'USD', new USD(0) ],
 *     [ 'EUR', new EUR(0) ],
 *     [ 'RUB', new RUB(0) ],
 * ]).decodeJSON('"RUB"')
 * // Right(new RUB(0))
 */
export const enums: RequiredEnums = variants => new Enums(variants);

/**
 * Sometimes you have a JSON with recursive structure,like nested comments.
 * You can use `lazy` to make sure your decoder unrolls lazily.
 *
 * @param callDecoder Lazy `Decoder` initializer.
 *
 * @example
 * interface Comment {
 *     message: string;
 *     comments: Array<Comment>;
 * }
 *
 * const commentDecoder: Decoder<Comment> = shape({
 *     message: field('message').string,
 *     comments: field('message').list(lazy(() => commentDecoder))
 * });
 */
export const lazy: RequiredLazy = callDecoder => succeed(null).chain(callDecoder);

/**
 * Decode a JSON object, requiring a particular field.
 *
 * @param name Name of the field.
 *
 * @example
 * field('x').int.decodeJSON('{ "x": 3 }')          // Right(3)
 * field('x').int.decodeJSON('{ "x": 3, "y": 4 }')  // Right(3)
 * field('x').int.decodeJSON('{ "x": true }')       // Left(..)
 * field('x').int.decodeJSON('{ "x": null }')       // Left(..)
 * field('x').int.decodeJSON('{ y": 4 }')           // Left(..)
 */
export const field = (name: string): Path => {
    return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => Field.required(name, decoder));
};

/**
 * Decode a JSON array, requiring a particular index.
 *
 * @param position Exact index of the decoding value.
 *
 * @example
 * const json = '[ "alise", "bob", "chuck" ]';
 *
 * index(0).string.decodeJSON(json)   // Right('alise')
 * index(1).string.decodeJSON(json)   // Right('bob')
 * index(2).string.decodeJSON(json)   // Right('chuck')
 * index(-1).string.decodeJSON(json)  // Right('chuck')
 * index(3).string.decodeJSON(json)   // Left(..)
 */
export const index = (position: number): Path => {
    return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => Index.required(position, decoder));
};

/**
 * Decode a nested JSON object, requiring certain fields and indexes.
 *
 * @param path
 *
 * @example
 * const json = '{ "person": { "name": "tom", "age": 42, "accounts": [ "tom_42" ] } }';
 *
 * at([ 'person', 'name' ]).string.decodeJSON(json)         // Right('tom')
 * at([ 'person', 'age' ]).int.decodeJSON(json)             // Right(42)
 * at([ 'person', 'accounts', 0 ]).string.decodeJSON(json)  // Right('tom_42"')
 *
 * // This is really just a shorthand for saying things like:
 *
 * field('person').field('name').string
 * field('person').field('age').int
 * field('person').field('accounts').index(0).string
 */
export const at = (path: Array<string | number>): Path => {
    return new PathImpl(<T>(decoder: Decoder<T>): Decoder<T> => requiredAt(path, decoder));
};


/**
 * Lets create an optional `Decoder`.
 *
 * @example
 * optional.string.decodeJSON('null')        // Right(Nothing)
 * optional.string.decodeJSON('"anything"')  // Right(Just('anything))
 *
 * optional.field('name').optional.string.decodeJSON('null')               // Right(Nothing)
 * optional.field('name').optional.string.decodeJSON('{}')                 // Right(Nothing)
 * optional.field('name').optional.string.decodeJSON('{ "name": null }')   // Right(Nothing)
 * optional.field('name').optional.string.decodeJSON('{ "name": 1 }')      // Left(..)
 * optional.field('name').optional.string.decodeJSON('{ "name": "tom" }')  // Right(Just('tom'))
 */
export const optional: Optional = new OptionalImpl(
    <T>(decoder: Decoder<T>): Decoder<Maybe<T>> => decoder.map(Just)
);

/**
 * Transform an either into a `Decoder`.
 * Sometimes it can be useful to use functions that primarily operate on `Either` in decoders.
 *
 * @param either Container to transform.
 *
 * @example
 * const validateNumber = (num: number): Either<string, number> => {
 *     return num > 0 ? Either.Right(num) : Either.Left('Expecting a POSITIVE NUMBER');
 * };
 *
 * number.map(validateNumber).chain(fromEither).decodeJSON('1')   // Right(1)
 * number.map(validateNumber).chain(fromEither).decodeJSON('-1')  // Left(..)
 */
export const fromEither = <T>(either: Either<string, T>): Decoder<T> => {
    return either.fold(fail, succeed);
};

/**
 * Transform a maybe into a `Decoder`.
 * Sometimes it can be useful to use functions that primarily operate on `Maybe` in decoders.
 *
 * @param either Container to transform.
 *
 * @example
 * const nonBlankString = (str: string): Maybe<string> => {
 *     return str.trim() === '' ? Maybe.Nothing : Maybe.Just(str.trim());
 * };
 *
 * const decoder: Decoder<string> = string.chain(str => {
 *     return fromMaybe('Expecting a NON EMPTY STRING', nonBlankString(str));
 * });
 *
 * decoder.decodeJSON(' some string ')  // Right('some string')
 * decoder.decodeJSON('  ')             // Left(..)
 */
export const fromMaybe = <T>(message: string, maybe: Maybe<T>): Decoder<T> => {
    return maybe.toEither(message).pipe(fromEither);
};
