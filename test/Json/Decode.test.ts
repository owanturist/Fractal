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
import {
    List
} from '../../src/List';
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
        Left('error')
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
        Left('error')
    );

    t.deepEqual(
        decoder.decode('1'),
        Right(1)
    );
});

test('Json.Decode.string', t => {
    t.deepEqual(
        Decode.string.decode(1),
        Left('Expecting a String but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', Decode.string).decode({
            foo: 1
        }),
        Left('Expecting a String at _.foo but instead got: 1')
    );

    t.deepEqual(
        Decode.string.decode('str'),
        Right('str')
    );
});

test('Json.Decode.number', t => {
    t.deepEqual(
        Decode.number.decode('str'),
        Left('Expecting a Number but instead got: "str"')
    );

    t.deepEqual(
        Decode.field('foo', Decode.number).decode({
            foo: 'bar'
        }),
        Left('Expecting a Number at _.foo but instead got: "bar"')
    );

    t.deepEqual(
        Decode.number.decode(1),
        Right(1)
    );
});

test('Json.Decode.boolean', t => {
    t.deepEqual(
        Decode.boolean.decode(1),
        Left('Expecting a Boolean but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', Decode.boolean).decode({
            foo: 1
        }),
        Left('Expecting a Boolean at _.foo but instead got: 1')
    );

    t.deepEqual(
        Decode.boolean.decode(false),
        Right(false)
    );
});

test('Json.Decode.value', t => {
    Decode.value.decode({ foo: 'bar' }).cata({
        Left: err => {
            t.fail(err);
        },
        Right: value => {
            t.deepEqual(
                value,
                { foo: 'bar' }
            );
        }
    });
});

test('Json.Decode.nill()', t => {
    t.deepEqual(
        Decode.nill(0).decode(0),
        Left('Expecting null but instead got: 0')
    );

    t.deepEqual(
        Decode.field('foo', Decode.nill(0)).decode({
            foo: 0
        }),
        Left('Expecting null at _.foo but instead got: 0')
    );

    t.deepEqual(
        Decode.nill(0).decode(null),
        Right(0)
    );
});

test('Json.Decode.fail()', t => {
    t.deepEqual(
        Decode.fail('msg').decode(null),
        Left('msg')
    );
});

test('Json.Decode.succeed()', t => {
    t.deepEqual(
        Decode.succeed(1).decode(null),
        Right(1)
    );
});

test('Json.Decode.oneOf()', t => {
    t.deepEqual(
        Decode.oneOf([]).decode(null),
        Left('Expecting at least one Decoder for oneOf but instead got 0')
    );

    t.deepEqual(
        Decode.field('foo', Decode.oneOf([])).decode({
            foo: 0
        }),
        Left('Expecting at least one Decoder for oneOf at _.foo but instead got 0')
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number
        ])).decode([ 1, 2, null, 1 ]),
        Left(
            'I ran into the following problems:\n\n' +
            'Expecting a Number at _[2] but instead got: null'
        )
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nill(0)
        ])).decode([ 1, 2, null, 1, '4' ]),
        Left(
            'I ran into the following problems:\n\n' +
            'Expecting a Number at _[4] but instead got: "4"\n' +
            'Expecting null at _[4] but instead got: "4"'
        )
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nill(0)
        ])).decode([ 1, 2, null, 1 ]),
        Right(List.of(1, 2, 0, 1))
    );

    t.deepEqual(
        Decode.list(Decode.oneOf(List.of(
            Decode.number,
            Decode.nill(0)
        ))).decode([ 1, 2, null, 1 ]),
        Right(List.of(1, 2, 0, 1))
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
        Left(
            'I ran into the following problems:\n\n' +
            'Expecting null but instead got: 1\n' +
            'Expecting a String but instead got: 1'
        )
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: 1
        }),
        Left(
            'I ran into the following problems:\n\n' +
            'Expecting null at _.foo but instead got: 1\n' +
            'Expecting a String at _.foo but instead got: 1'
        )
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
        Left('Expecting an object with a field named `s3` but instead got: {"s1":"str","s2":1}')
    );
});

test('Json.Decode.list()', t => {
    const decoder = Decode.list(Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Left('Expecting a List but instead got: null')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: {}
        }),
        Left('Expecting a List at _.foo but instead got: {}')
    );

    t.deepEqual(
        decoder.decode([ 1, 2 ]),
        Left('Expecting a String at _[0] but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: [ 'str1', 2 ]
        }),
        Left('Expecting a String at _.foo[1] but instead got: 2')
    );

    t.deepEqual(
        decoder.decode([ 'str1', 'str2' ]),
        Right(List.of('str1', 'str2'))
    );
});

test('Json.Decode.dict()', t => {
    const decoder = Decode.dict(Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left('Expecting an object but instead got: 1')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Expecting an object but instead got: null')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: []
        }),
        Left('Expecting an object at _.foo but instead got: []')
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left('Expecting a String at _.s1 but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: { s1: 'str1', s2: 2 }
        }),
        Left('Expecting a String at _.foo.s2 but instead got: 2')
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
        Left('Expecting an object but instead got: 1')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Expecting an object but instead got: null')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: []
        }),
        Left('Expecting an object at _.foo but instead got: []')
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left('Expecting a String at _.s1 but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: { s1: 'str1', s2: 2 }
        }),
        Left('Expecting a String at _.foo.s2 but instead got: 2')
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 'str2' }),
        Right(List.of(
            [ 's1', 'str1' ],
            [ 's2', 'str2' ]
        ))
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
        Left('Expecting a String but instead got: null')
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
        Left('Expecting a Number at _.soo but instead got: "str"')
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
        Left('Expecting an object with a field named `saz` at _.sar but instead got: false')
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
        Left('Expecting a List but instead got: null')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: {}
        }),
        Left('Expecting a List at _.foo but instead got: {}')
    );

    t.deepEqual(
        decoder.decode([ '0' ]),
        Left('Expecting a longer List. Need index 1 but there are only 1 entries but instead got: ["0"]')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: [ 0, 1 ]
        }),
        Left('Expecting a String at _.foo[1] but instead got: 1')
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
        Left('Expecting an object with a field named `foo` but instead got: 1')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Expecting an object with a field named `foo` but instead got: null')
    );

    t.deepEqual(
        Decode.field('bar', decoder).decode({
            bar: []
        }),
        Left('Expecting an object with a field named `foo` at _.bar but instead got: []')
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left('Expecting an object with a field named `foo` but instead got: {"bar":"str"}')
    );

    t.deepEqual(
        decoder.decode({ foo: 1 }),
        Left('Expecting a String at _.foo but instead got: 1')
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
        Left('Expecting an object with a field named `foo` but instead got: null')
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left('Expecting an object with a field named `foo` but instead got: {"bar":"str"}')
    );

    t.deepEqual(
        Decode.index(0, decoder).decode([
            { foo: { baz: 'str' }}
        ]),
        Left('Expecting an object with a field named `bar` at _[0].foo but instead got: {"baz":"str"}')
    );

    t.deepEqual(
        decoder.decode({
             foo: { bar: 1 }
        }),
        Left('Expecting a String at _.foo.bar but instead got: 1')
    );

    t.deepEqual(
        decoder.decode({
             foo: { bar: 'str' }
        }),
        Right('str')
    );

    t.deepEqual(
        Decode.at(List.of('foo', 'bar'), Decode.string).decode({
             foo: { bar: 'str' }
        }),
        Right('str')
    );
});

test('Json.Decode.lazy()', t => {
    interface Comment {
        message: string;
        responses: List<Comment>;
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
        Left('Expecting an object with a field named `responses` at _.responses[0] but instead got: {"message":"msg-1"}')
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
            responses: List.of({
                message: 'msg-1',
                responses: List.empty()
            }, {
                message: 'msg-2',
                responses: List.of({
                    message: 'msg-2-1',
                    responses: List.empty()
                }, {
                    message: 'msg-2-2',
                    responses: List.empty()
                })
            })
        })
    );
});

test('Json.Decode.Decoder.prototype.map()', t => {
    const decoder = Decode.string.map(t1 => ({ t1 }));

    t.deepEqual(
        decoder.decode(1),
        Left('Expecting a String but instead got: 1')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: 1
        }),
        Left('Expecting a String at _.foo but instead got: 1')
    );

    t.deepEqual(
        decoder.decode('str'),
        Right({
            t1: 'str'
        })
    );
});

test('Json.Decode.Decoder.prototype.chain()', t => {
    const decoder = Decode.number.chain(
        t1 => t1 % 2 === 0 ? Decode.succeed(t1 - 1) : Decode.fail('msg')
    );

    t.deepEqual(
        decoder.decode('str'),
        Left('Expecting a Number but instead got: "str"')
    );

    t.deepEqual(
        Decode.field('foo', decoder).decode({
            foo: 'str'
        }),
        Left('Expecting a Number at _.foo but instead got: "str"')
    );

    t.deepEqual(
        decoder.decode(1),
        Left('msg')
    );

    t.deepEqual(
        decoder.decode(2),
        Right(1)
    );
});

test('Json.Decode.Decoder.prototype.decode', t => {
    interface User {
        id: number;
        username: string;
        comments: List<Comment>;
    }

    const userDecoder: Decode.Decoder<User> = Decode.props({
        id: Decode.field('id', Decode.number),
        username: Decode.field('username', Decode.string),
        comments: Decode.field('comments', Decode.list(Decode.lazy(() => commentDecoder)))
    });

    interface Comment {
        id: number;
        text: string;
        responses: List<Response>;
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
        Left('Expecting a String at _.comments[2].responses[2].text but instead got: 0')
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
            comments: List.singleton({
                id: 0,
                text: 'c-zero',
                responses: List.singleton({
                    id: 0,
                    text: 'r-zero',
                    user: {
                        id: 1,
                        username: 'u-one',
                        comments: List.empty()
                    }
                })
            })
        })
    );
});

test('Json.Decode.Decoder.prototype.decodeJSON()', t => {
    const decoder = Decode.props({
        t1: Decode.field('s1', Decode.string),
        t2: Decode.field('s2', Decode.string)
    });

    t.deepEqual(
        decoder.decodeJSON('invalid'),
        Left('Unexpected token i in JSON at position 0')
    );

    t.deepEqual(
        decoder.decodeJSON('{"s1":1}'),
        Left('Expecting a String at _.s1 but instead got: 1')
    );

    t.deepEqual(
        decoder.decodeJSON('{"s1":"str1","s2":"str2"}'),
        Right({
            t1: 'str1',
            t2: 'str2'
        })
    );
});
