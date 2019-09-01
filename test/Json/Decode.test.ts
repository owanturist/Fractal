// tslint:disable:max-line-length

import test from 'ava';

import Maybe from '../../src/Maybe';
import Either from '../../src/Either';
import * as Decode from '../../src/Json/Decode';

test('Json.Decode.string', t => {
    t.deepEqual(
        Decode.string.decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting a STRING', undefined))
    );

    t.deepEqual(
        Decode.string.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a STRING', null))
    );

    t.deepEqual(
        Decode.string.decode('str'),
        Either.Right('str')
    );

    t.deepEqual(
        Decode.string.decode(true),
        Either.Left(Decode.Error.Failure('Expecting a STRING', true))
    );

    t.deepEqual(
        Decode.string.decode(1),
        Either.Left(Decode.Error.Failure('Expecting a STRING', 1))
    );

    t.deepEqual(
        Decode.string.decode(1.1),
        Either.Left(Decode.Error.Failure('Expecting a STRING', 1.1))
    );
});

test.todo('Json.Decode.bool');

test.todo('Json.Decode.int');

test.todo('Json.Decode.float');

test.todo('Json.Decode.value');

test.todo('Json.Decode.fail()');

test.todo('Json.Decode.succeed()');

test.todo('Json.Decode.props()');

test.todo('Json.Decode.of()');

test('Json.Decode.optional.of()', t => {
    t.deepEqual(
        Decode.optional.of(Decode.string).decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting an OPTIONAL STRING', undefined))
    );

    t.deepEqual(
        Decode.optional.of(Decode.string).decode(null),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.of(Decode.string).decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OPTIONAL STRING', 1))
    );

    t.deepEqual(
        Decode.optional.of(Decode.string).decode('str'),
        Either.Right(Maybe.Just('str'))
    );
});

test.todo('Json.Decode.oneOf()');

test.todo('Json.Decode.list()');

test.todo('Json.Decode.dict()');

test.todo('Json.Decode.keyValue()');

test.todo('Json.Decode.lazy()');

test.todo('Json.Decode.field()');

test('Json.Decode.field().of()', t => {
    t.deepEqual(
        Decode.field('_1').of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        Decode.field('_1').of(Decode.string).decode({}),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'_1\'', {}))
    );

    t.deepEqual(
        Decode.field('_1').of(Decode.string).decode({ _1: 1 }),
        Either.Left(Decode.Error.Field(
            '_1',
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.field('_1').of(Decode.string).decode({ _1: 'str' }),
        Either.Right('str')
    );
});

test('Json.Decode.optional.field().of()', t => {
    t.deepEqual(
        Decode.optional.field('_1').of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        Decode.optional.field('_1').of(Decode.string).decode({}),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.field('_1').of(Decode.string).decode({ _1: 1 }),
        Either.Left(Decode.Error.Field(
            '_1',
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.optional.field('_1').of(Decode.string).decode({ _1: null }),
        Either.Left(Decode.Error.Field(
            '_1',
            Decode.Error.Failure('Expecting a STRING', null)
        ))
    );

    t.deepEqual(
        Decode.optional.field('_1').of(Decode.string).decode({ _1: 'str' }),
        Either.Right(Maybe.Just('str'))
    );
});

test('Json.Decode.field().optional.of()', t => {
    t.deepEqual(
        Decode.field('_1').optional.of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        Decode.field('_1').optional.of(Decode.string).decode({}),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'_1\'', {}))
    );

    t.deepEqual(
        Decode.field('_1').optional.of(Decode.string).decode({ _1: 1 }),
        Either.Left(Decode.Error.Field(
            '_1',
            Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.field('_1').optional.of(Decode.string).decode({ _1: null }),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.field('_1').optional.of(Decode.string).decode({ _1: 'str' }),
        Either.Right(Maybe.Just('str'))
    );
});

test('Json.Decode.optional.field().optional.of()', t => {
    t.deepEqual(
        Decode.optional.field('_1').optional.of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        Decode.optional.field('_1').optional.of(Decode.string).decode({}),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.field('_1').optional.of(Decode.string).decode({ _1: 1 }),
        Either.Left(Decode.Error.Field(
            '_1',
            Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.optional.field('_1').optional.of(Decode.string).decode({ _1: null }),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.field('_1').optional.of(Decode.string).decode({ _1: 'str' }),
        Either.Right(Maybe.Just('str'))
    );
});

test.todo('Json.Decode.index()');

test('Json.Decode.index().of()', t => {
    t.deepEqual(
        Decode.index(0).string.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY', null))
    );

    t.deepEqual(
        Decode.index(0).string.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY with an ELEMENT at [0] but only see 0 entries', []))
    );

    t.deepEqual(
        Decode.index(0).string.decode([ 1 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.index(0).string.decode([ 'str' ]),
        Either.Right('str')
    );
});

test('Json.Decode.optional.index().of()', t => {
    t.deepEqual(
        Decode.optional.index(0).of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY', null))
    );

    t.deepEqual(
        Decode.optional.index(0).of(Decode.string).decode([]),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.index(0).of(Decode.string).decode([ 1 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.optional.index(0).of(Decode.string).decode([ null ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting a STRING', null)
        ))
    );

    t.deepEqual(
        Decode.optional.index(0).of(Decode.string).decode([ 'str' ]),
        Either.Right(Maybe.Just('str'))
    );
});

test.todo('Json.Decode.at()');

test.skip('Json.Decode.fromEither()', t => {
    const toDecimal = (str: string): Either<string, number> => {
        const int = parseInt(str, 10);

        return isNaN(int) ? Either.Left('error') : Either.Right(int);
    };

    const decoder /* Decoder<number> */ = Decode.string.map(toDecimal).chain(Decode.fromEither);

    t.deepEqual(
        decoder.decode('invalid'),
        Either.Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        decoder.decode('1'),
        Either.Right(1)
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting an OPTIONAL VALUE', undefined))
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode(null),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode('invalid'),
        Either.Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode('1'),
        Either.Right(Maybe.Just(1))
    );
});

test.skip('Json.Decode.fromMaybe()', t => {
    const toDecimal = (str: string): Maybe<number> => {
        const ing = parseInt(str, 10);

        return isNaN(ing) ? Maybe.Nothing : Maybe.Just(ing);
    };

    const decoder /* Decoder<number> */ = Decode.string.chain(
        str => Decode.fromMaybe('error', toDecimal(str))
    );

    t.deepEqual(
        decoder.decode('invalid'),
        Either.Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        decoder.decode('1'),
        Either.Right(1)
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting an OPTIONAL VALUE', undefined))
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode(null),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode('invalid'),
        Either.Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        Decode.optional.of(decoder).decode('1'),
        Either.Right(Maybe.Just(1))
    );
});

test.todo('Json.Decode.Decoder.map()');

test.todo('Json.Decode.Decoder.chain()');

test.todo('Json.Decode.Decoder.fromEither()');

test.todo('Json.Decode.Decoder.fromMaybe()');

test.todo('Json.Decode.Decoder.decode');

test.todo('Json.Decode.Decoder.decodeJSON()');

test('Json.Decode.Error.cata()', t => {
    const pattern: Decode.Error.Pattern<string> = {
        Field(field: string, error: Decode.Error): string {
            return `"${field}" ${error.cata(pattern)}`;
        },
        Index(index: number, error: Decode.Error): string {
            return `[${index}] ${error.cata(pattern)}`;
        },
        OneOf(errors: Array<Decode.Error>): string {
            return errors.map((error: Decode.Error): string => error.cata(pattern)).join('\n');
        },
        Failure(message: string, source: Decode.Value): string {
            return `"${message}" > ${JSON.stringify(source)}`;
        }
    };

    t.is(
        Decode.Error.Failure('Message', null).cata(pattern),
        '"Message" > null'
    );

    t.is(
        Decode.Error.OneOf([
            Decode.Error.Failure('First message', null),
            Decode.Error.Failure('Second message', null)
        ]).cata(pattern),
`"First message" > null
"Second message" > null`
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.Failure('Message', null)
        ).cata(pattern),
        '[0] "Message" > null'
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Message', null)
        ).cata(pattern),
        '"foo" "Message" > null'
    );

    t.is(
        Decode.Error.Failure('Message', null).cata({
            Failure: () => true,
            _: () => false
        }),
        true
    );

    t.is(
        Decode.Error.Failure('Message', null).cata({
            OneOf: () => true,
            Index: () => true,
            Field: () => true,
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.Failure('Message', null).cata({
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.OneOf([]).cata({
            OneOf: () => true,
            _: () => false
        }),
        true
    );

    t.is(
        Decode.Error.OneOf([]).cata({
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.OneOf([]).cata({
            Failure: () => true,
            Index: () => true,
            Field: () => true,
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.Index(
            1,
            Decode.Error.Failure('Message', null)
        ).cata({
            Index: () => true,
            _: () => false
        }),
        true
    );

    t.is(
        Decode.Error.Index(
            1,
            Decode.Error.Failure('Message', null)
        ).cata({
            Failure: () => true,
            OneOf: () => true,
            Field: () => true,
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.Index(
            1,
            Decode.Error.Failure('Message', null)
        ).cata({
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Message', null)
        ).cata({
            Field: () => true,
            _: () => false
        }),
        true
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Message', null)
        ).cata({
            Failure: () => true,
            OneOf: () => true,
            Index: () => true,
            _: () => false
        }),
        false
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Message', null)
        ).cata({
            _: () => false
        }),
        false
    );
});

test('Json.Decode.Error.Failure.stringify()', t => {
    t.is(
        Decode.Error.Failure('Message', null).stringify(0),
`Problem with the given value:

    null

Message`
    );

    t.is(
        Decode.Error.Failure('Message', 'string').stringify(4),
`Problem with the given value:

    "string"

Message`
    );

    t.is(
        Decode.Error.Failure('Message', {
            foo: 'bar',
            bar: 'foo'
        }).stringify(4),
`Problem with the given value:

    {
        "foo": "bar",
        "bar": "foo"
    }

Message`
    );

    t.is(
        Decode.Error.Failure('Message', [ 'foo', 'bar', 'baz' ]).stringify(0),
`Problem with the given value:

    ["foo","bar","baz"]

Message`
    );
});

test('Json.Decode.Error.OneOf.stringify()', t => {
    t.is(
        Decode.Error.OneOf([]).stringify(0),
        'Ran into a Json.Decode.oneOf with no possibilities!'
    );

    t.is(
        Decode.Error.OneOf([
            Decode.Error.Failure('Message', null)
        ]).stringify(0),
`Problem with the given value:

    null

Message`
    );

    t.is(
        Decode.Error.OneOf([
            Decode.Error.Failure('First message', null),
            Decode.Error.Failure('Second message', null)
        ]).stringify(0),
`Json.Decode.oneOf failed in the following 2 ways


(1) Problem with the given value:

    null

First message


(2) Problem with the given value:

    null

Second message`
    );
});

test('Json.Decode.Error.Index.stringify()', t => {
    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.Failure('Message', [ 1, 2, 3 ])
        ).stringify(4),
`Problem with the value at _[0]:

    [
        1,
        2,
        3
    ]

Message`
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.OneOf([])
        ).stringify(0),
        'Ran into a Json.Decode.oneOf with no possibilities at _[0]'
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.OneOf([
                Decode.Error.Failure('First message', null),
                Decode.Error.Failure('Second message', null)
            ])
        ).stringify(0),
`The Json.Decode.oneOf at _[0] failed in the following 2 ways


(1) Problem with the given value:

    null

First message


(2) Problem with the given value:

    null

Second message`
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.OneOf([
                Decode.Error.Field(
                    'foo',
                    Decode.Error.Failure('First message', null)
                ),
                Decode.Error.Index(
                    1,
                    Decode.Error.Failure('Second message', null)
                )
            ])
        ).stringify(0),
`The Json.Decode.oneOf at _[0] failed in the following 2 ways


(1) Problem with the value at _.foo:

    null

First message


(2) Problem with the value at _[1]:

    null

Second message`
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.Index(
                1,
                Decode.Error.Failure('Message', [ 0, 2, 3 ])
            )
        ).stringify(0),
`Problem with the value at _[0][1]:

    [0,2,3]

Message`
    );

    t.is(
        Decode.Error.Index(
            0,
            Decode.Error.Field(
                'foo',
                Decode.Error.Failure('Message', {
                    bar: 'foo',
                    foo: 'bar'
                })
            )
        ).stringify(0),
`Problem with the value at _[0].foo:

    {"bar":"foo","foo":"bar"}

Message`
    );
});

test('Json.Decode.Error.Field.stringify()', t => {
    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _.foo:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            '_0',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _._0:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            'foo_0',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _.foo_0:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            '0foo',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _['0foo']:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            'foo-bar',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _['foo-bar']:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            'foo bar',
            Decode.Error.Failure('Message', null)
        ).stringify(0),
`Problem with the value at _['foo bar']:

    null

Message`
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.OneOf([])
        ).stringify(0),
        'Ran into a Json.Decode.oneOf with no possibilities at _.foo'
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.OneOf([
                Decode.Error.Failure('First message', null),
                Decode.Error.Failure('Second message', null)
            ])
        ).stringify(0),
`The Json.Decode.oneOf at _.foo failed in the following 2 ways


(1) Problem with the given value:

    null

First message


(2) Problem with the given value:

    null

Second message`
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.OneOf([
                Decode.Error.Field(
                    'bar',
                    Decode.Error.Failure('First message', null)
                ),
                Decode.Error.Index(
                    1,
                    Decode.Error.Failure('Second message', null)
                )
            ])
        ).stringify(0),
`The Json.Decode.oneOf at _.foo failed in the following 2 ways


(1) Problem with the value at _.bar:

    null

First message


(2) Problem with the value at _[1]:

    null

Second message`
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Index(
                1,
                Decode.Error.Failure('Message', [ 0, 2, 3 ])
            )
        ).stringify(0),
`Problem with the value at _.foo[1]:

    [0,2,3]

Message`
    );

    t.is(
        Decode.Error.Field(
            'foo',
            Decode.Error.Field(
                'bar',
                Decode.Error.Failure('Message', {
                    bar: 'foo',
                    foo: 'bar'
                })
            )
        ).stringify(4),
`Problem with the value at _.foo.bar:

    {
        "bar": "foo",
        "foo": "bar"
    }

Message`
    );
});
