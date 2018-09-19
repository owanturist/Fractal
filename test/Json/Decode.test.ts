/* tslint:disable: max-line-length */

import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../../src/Maybe';
import {
    Either,
    Left,
    Right
} from '../../src/Either';
import * as Decode from '../../src/Json/Decode';

test('Json.Decode.fromEither()', t => {
    const toDecimal = (str: string): Either<string, number> => {
        const result = parseInt(str, 10);

        return isNaN(result) ? Left('error') : Right(result);
    };

    const decoder = Decode.string.chain(
        str => Decode.fromEither(toDecimal(str))
    );

    t.deepEqual(
        decoder.decode('invalid'),
        Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        decoder.decode('1'),
        Right(1)
    );
});

test('Json.Decode.fromMaybe()', t => {
    const toDecimal = (str: string): Maybe<number> => {
        const result = parseInt(str, 10);

        return isNaN(result) ? Nothing() : Just(result);
    };

    const decoder = Decode.string.chain(
        str => Decode.fromMaybe('error', toDecimal(str))
    );

    t.deepEqual(
        decoder.decode('invalid'),
        Left(Decode.Error.Failure('error', 'invalid'))
    );

    t.deepEqual(
        decoder.decode('1'),
        Right(1)
    );
});

test('Json.Decode.string', t => {
    t.deepEqual(
        Decode.string.decode(1),
        Left(Decode.Error.Failure('Expecting a STRING', 1))
    );

    t.deepEqual(
        Decode.string.decode('str'),
        Right('str')
    );
});

test('Json.Decode.number', t => {
    t.deepEqual(
        Decode.number.decode('str'),
        Left(Decode.Error.Failure('Expecting a NUMBER', 'str'))
    );

    t.deepEqual(
        Decode.number.decode(1),
        Right(1)
    );
});

test('Json.Decode.boolean', t => {
    t.deepEqual(
        Decode.boolean.decode(1),
        Left(Decode.Error.Failure('Expecting a BOOLEAN', 1))
    );

    t.deepEqual(
        Decode.boolean.decode(false),
        Right(false)
    );
});

test('Json.Decode.value', t => {
    t.deepEqual(
        Decode.value.decode({ foo: 'bar' }),
        Right({ foo: 'bar'})
    );
});

test('Json.Decode.nill()', t => {
    t.deepEqual(
        Decode.nill(0).decode(0),
        Left(Decode.Error.Failure('Expecting null', 0))
    );

    t.deepEqual(
        Decode.nill(0).decode(null),
        Right(0)
    );
});

test('Json.Decode.fail()', t => {
    t.deepEqual(
        Decode.fail('msg').decode({ foo: 'bar' }),
        Left(Decode.Error.Failure('msg', { foo: 'bar' }))
    );
});

test('Json.Decode.succeed()', t => {
    t.deepEqual(
        Decode.succeed(1).decode({ foo: 'bar' }),
        Right(1)
    );
});

test('Json.Decode.oneOf()', t => {
    t.deepEqual(
        Decode.oneOf([]).decode(null),
        Left(Decode.Error.OneOf([]))
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number
        ])).decode([ 1, 2, null, 1 ]),
        Left(Decode.Error.Index(2, Decode.Error.OneOf([
            Decode.Error.Failure('Expecting a NUMBER', null)
        ])))
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nill(0)
        ])).decode([ 1, 2, null, 1, '4' ]),
        Left(Decode.Error.Index(4, Decode.Error.OneOf([
            Decode.Error.Failure('Expecting a NUMBER', '4'),
            Decode.Error.Failure('Expecting null', '4')
        ])))
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nill(0)
        ])).decode([ 1, 2, null, 1 ]),
        Right([ 1, 2, 0, 1 ])
    );
});

test('Json.Decode.nullable()', t => {
    const decoder = Decode.nullable(Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Right(Nothing())
    );

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.OneOf([
            Decode.Error.Failure('Expecting null', 1),
            Decode.Error.Failure('Expecting a STRING', 1)
        ]))
    );

    t.deepEqual(
        decoder.decode('str'),
        Right(Just('str'))
    );
});

test('Json.Decode.maybe()', t => {
    const input = {
        s1: 'str',
        s2: 1
    };

    t.deepEqual(
        Decode.maybe(Decode.field('s1', Decode.number)).decode(input),
        Right(Nothing())
    );

    t.deepEqual(
        Decode.maybe(Decode.field('s2', Decode.number)).decode(input),
        Right(Just(1))
    );

    t.deepEqual(
        Decode.maybe(Decode.field('s3', Decode.number)).decode(input),
        Right(Nothing())
    );

    t.deepEqual(
        Decode.field('s1', Decode.maybe(Decode.number)).decode(input),
        Right(Nothing())
    );

    t.deepEqual(
        Decode.field('s2', Decode.maybe(Decode.number)).decode(input),
        Right(Just(1))
    );

    t.deepEqual(
        Decode.field('s3', Decode.maybe(Decode.number)).decode(input),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'s3\'', { s1: 'str', s2: 1 }))
    );
});

test('Json.Decode.list()', t => {
    const decoder = Decode.list(Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting a LIST', null))
    );

    t.deepEqual(
        decoder.decode([ 1, 2 ]),
        Left(Decode.Error.Index(0, Decode.Error.Failure('Expecting a STRING', 1)))
    );

    t.deepEqual(
        decoder.decode([ 'str1', 'str2' ]),
        Right([ 'str1', 'str2' ])
    );
});

test('Json.Decode.dict()', t => {
    const decoder = Decode.dict(Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        decoder.decode([]),
        Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left(Decode.Error.Field('s1', Decode.Error.Failure('Expecting a STRING', 1)))
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 'str2' }),
        Right({ s1: 'str1', s2: 'str2' })
    );
});

test('Json.Decode.keyValue()', t => {
    const decoder = Decode.keyValue(Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );

    t.deepEqual(
        decoder.decode([]),
        Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left(Decode.Error.Field('s1', Decode.Error.Failure('Expecting a STRING', 1)))
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 'str2' }),
        Right([
            [ 's1', 'str1' ],
            [ 's2', 'str2' ]
        ])
    );
});

test('Json.Decode.props()', t => {
    t.deepEqual(
        Decode.props({}).decode(null),
        Right({})
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.string
        }).decode(null),
        Left(Decode.Error.Failure('Expecting a STRING', null))
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.string
        }).decode('bar'),
        Right({
            foo: 'bar'
        })
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.boolean)
        }).decode({
            soo: 'str',
            sar: false
        }),
        Left(Decode.Error.Field('soo', Decode.Error.Failure('Expecting a NUMBER', 'str')))
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.boolean)
        }).decode({
            soo: 1,
            sar: false
        }),
        Right({
            foo: 1,
            bar: false
        })
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.boolean)
        }).map(obj => obj.foo).decode({
            soo: 1,
            sar: false
        }),
        Right(1)
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.props({
                baz: Decode.field('saz', Decode.string)
            }))
        }).decode({
            soo: 1,
            sar: false
        }),
        Left(Decode.Error.Field(
            'sar',
            Decode.Error.Failure('Expecting an OBJECT with a field named \'saz\'', false)
        ))
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.props({
                baz: Decode.field('saz', Decode.string)
            }))
        }).decode({
            soo: 1,
            sar: {
                saz: '1'
            }
        }),
        Right({
            foo: 1,
            bar: {
                baz: '1'
            }
        })
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.props({
                baz: Decode.field('saz', Decode.string)
            }))
        }).decode({
            soo: 1,
            sar: {
                saz: '1'
            }
        }),
        Right({
            foo: 1,
            bar: {
                baz: '1'
            }
        })
    );
});

test('Json.Decode.index()', t => {
    const decoder = Decode.index(1, Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting an ARRAY', null))
    );

    t.deepEqual(
        decoder.decode({}),
        Left(Decode.Error.Failure('Expecting an ARRAY', {}))
    );

    t.deepEqual(
        decoder.decode([ '0' ]),
        Left(Decode.Error.Failure('Expecting a LONGER array. Need index 1 but only see 1 entries', [ '0' ]))
    );

    t.deepEqual(
        decoder.decode([ 0, 1 ]),
        Left(Decode.Error.Index(1, Decode.Error.Failure('Expecting a STRING', 1)))
    );

    t.deepEqual(
        decoder.decode([0, 'str']),
        Right('str')
    );
});

test('Json.Decode.field()', t => {
    const decoder = Decode.field('foo', Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', 1))
    );

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', null))
    );

    t.deepEqual(
        Decode.field('bar', decoder).decode({
            bar: []
        }),
        Left(Decode.Error.Field(
            'bar',
            Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', [])
        ))
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', { bar: 'str' }))
    );

    t.deepEqual(
        decoder.decode({ foo: 1 }),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        decoder.decode({ foo: 'str' }),
        Right('str')
    );
});

test('Json.Decode.at()', t => {
    const decoder = Decode.at([ 'foo', 'bar' ], Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', null))
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', { bar: 'str' }))
    );

    t.deepEqual(
        decoder.decode({ foo: { baz: 'str' }}),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Expecting an OBJECT with a field named \'bar\'', { baz: 'str' })
        ))
    );

    t.deepEqual(
        decoder.decode({ foo: { bar: 1 }}),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Field(
                'bar',
                Decode.Error.Failure('Expecting a STRING', 1)
            )
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: { bar: 'str' }
        }),
        Right('str')
    );
});

test('Json.Decode.lazy()', t => {
    interface Comment {
        message: string;
        responses: Array<Comment>;
    }

    const decoder: Decode.Decoder<Comment> = Decode.props({
        message: Decode.field('message', Decode.string),
        responses: Decode.field('responses', Decode.lazy(() => Decode.list(decoder)))
    });

    t.deepEqual(
        decoder.decode({
            message: 'msg',
            responses: [{
                message: 'msg-1'
            }]
        }),
        Left(Decode.Error.Field(
            'responses',
            Decode.Error.Index(
                0,
                Decode.Error.Failure('Expecting an OBJECT with a field named \'responses\'', { message: 'msg-1' })
            )
        ))
    );

    t.deepEqual(
        decoder.decode({
            message: 'msg',
            responses: [{
                message: 'msg-1',
                responses: []
            }, {
                message: 'msg-2',
                responses: [{
                    message: 'msg-2-1',
                    responses: []
                }, {
                    message: 'msg-2-2',
                    responses: []
                }]
            }]
        }),
        Right({
            message: 'msg',
            responses: [{
                message: 'msg-1',
                responses: []
            }, {
                message: 'msg-2',
                responses: [{
                    message: 'msg-2-1',
                    responses: []
                }, {
                    message: 'msg-2-2',
                    responses: []
                }]
            }]
        })
    );
});

test('Json.Decode.Decoder.map()', t => {
    const decoder = Decode.string.map(t1 => ({ t1 }));

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.Failure('Expecting a STRING', 1))
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: 1
        }),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        decoder.decode('str'),
        Right({
            t1: 'str'
        })
    );
});

test('Json.Decode.Decoder.chain()', t => {
    const decoder = Decode.number.chain(
        t1 => t1 % 2 === 0 ? Decode.succeed(t1 - 1) : Decode.fail('msg')
    );

    t.deepEqual(
        decoder.decode('str'),
        Left(Decode.Error.Failure('Expecting a NUMBER', 'str'))
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: 'str'
        }),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Expecting a NUMBER', 'str')
        ))
    );

    t.deepEqual(
        decoder.decode(1),
        Left(Decode.Error.Failure('msg', 1))
    );

    t.deepEqual(
        decoder.decode(2),
        Right(1)
    );
});

test('Json.Decode.Decoder.decode', t => {
    interface User {
        id: number;
        username: string;
        comments: Array<Comment>;
    }

    const userDecoder: Decode.Decoder<User> = Decode.props({
        id: Decode.field('id', Decode.number),
        username: Decode.field('username', Decode.string),
        comments: Decode.field('comments', Decode.list(Decode.lazy(() => commentDecoder)))
    });

    interface Comment {
        id: number;
        text: string;
        responses: Array<Response>;
    }

    const commentDecoder: Decode.Decoder<Comment> = Decode.props({
        id: Decode.field('id', Decode.number),
        text: Decode.field('text', Decode.string),
        responses: Decode.field('responses', Decode.list(Decode.lazy(() => responseDecoder)))
    });

    interface Response {
        id: number;
        text: string;
        user: User;
    }

    const responseDecoder: Decode.Decoder<Response> = Decode.props({
        id: Decode.field('id', Decode.number),
        text: Decode.field('text', Decode.string),
        user: Decode.field('user', userDecoder)
    });

    t.deepEqual(
        userDecoder.decode({
            id: 0,
            username: 'u-zero',
            comments: [
                {
                    id: 0,
                    text: 'c-zero',
                    responses: []
                },
                {
                    id: 1,
                    text: 'c-one',
                    responses: []
                },
                {
                    id: 2,
                    text: 'c-two',
                    responses: [
                        {
                            id: 0,
                            text: 'r-zero',
                            user: {
                                id: 1,
                                username: 'u-one',
                                comments: []
                            }
                        },
                        {
                            id: 1,
                            text: 'r-one',
                            user: {
                                id: 2,
                                username: 'u-two',
                                comments: []
                            }
                        },
                        {
                            id: 2,
                            text: 0,
                            user: null
                        }
                    ]
                }
            ]
        }),
        Left(Decode.Error.Field(
            'comments',
            Decode.Error.Index(
                2,
                Decode.Error.Field(
                    'responses',
                    Decode.Error.Index(
                        2,
                        Decode.Error.Field(
                            'text',
                            Decode.Error.Failure('Expecting a STRING', 0)
                        )
                    )
                )
            )
        ))
    );

    t.deepEqual(
        userDecoder.decode({
            id: 0,
            username: 'u-zero',
            comments: [
                {
                    id: 0,
                    text: 'c-zero',
                    responses: [
                        {
                            id: 0,
                            text: 'r-zero',
                            user: {
                                id: 1,
                                username: 'u-one',
                                comments: []
                            }
                        }
                    ]
                }
            ]
        }),
        Right({
            id: 0,
            username: 'u-zero',
            comments: [{
                id: 0,
                text: 'c-zero',
                responses: [{
                    id: 0,
                    text: 'r-zero',
                    user: {
                        id: 1,
                        username: 'u-one',
                        comments: []
                    }
                }]
            }]
        })
    );
});

test('Json.Decode.Decoder.decodeJSON()', t => {
    const decoder = Decode.props({
        t1: Decode.field('s1', Decode.string),
        t2: Decode.field('s2', Decode.string)
    });

    t.deepEqual(
        decoder.decodeJSON('invalid'),
        Left(Decode.Error.Failure('This is not valid JSON! Unexpected token i in JSON at position 0', 'invalid'))
    );

    t.deepEqual(
        decoder.decodeJSON('{"s1":1}'),
        Left(Decode.Error.Field(
            's1',
            Decode.Error.Failure('Expecting a STRING', 1)
        ))
    );

    t.deepEqual(
        decoder.decodeJSON('{"s1":"str1","s2":"str2"}'),
        Right({
            t1: 'str1',
            t2: 'str2'
        })
    );
});

test('Json.Decode.Error.Failure.stringify()', t => {
    t.is(
        Decode.Error.Failure('Message', null).stringify(),
`Problem with the given value:

    null

Message`
    );

    t.is(
        Decode.Error.Failure('Message', 'string').stringify(),
`Problem with the given value:

    "string"

Message`
    );

    t.is(
        Decode.Error.Failure('Message', {
            foo: 'bar',
            bar: 'foo'
        }).stringify(),
`Problem with the given value:

    {
        "foo": "bar",
        "bar": "foo"
    }

Message`
    );

    t.is(
        Decode.Error.Failure('Message', [ 'foo', 'bar', 'baz' ]).stringify(),
`Problem with the given value:

    [
        "foo",
        "bar",
        "baz"
    ]

Message`
    );
});
