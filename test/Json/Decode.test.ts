import test from 'ava';

import {
    Nothing,
    Just
} from '../../src/Maybe';
import {
    Either,
    Left,
    Right
} from '../../src/Either';
import {
    Value
} from '../../src/Json/Encode';
import {
    Decode,
    Decoder
} from '../../src/Json/Decode';

test('Json.Decode.string', t => {
    t.deepEqual(
        Decode.string.decode(1),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        Decode.string.decode('str'),
        Right('str')
    );
});

test('Json.Decode.number', t => {
    t.deepEqual(
        Decode.number.decode('str'),
        Left('Value `"str"` is not a number.')
    );

    t.deepEqual(
        Decode.number.decode(1),
        Right(1)
    );
});

test('Json.Decode.bool', t => {
    t.deepEqual(
        Decode.bool.decode(1),
        Left('Value `1` is not a bool.')
    );

    t.deepEqual(
        Decode.bool.decode(false),
        Right(false)
    );
});

test('Json.Decode.value', t => {
    t.deepEqual(
        Decode.value.decode({ foo: 'bar' }),
        Right(new Value({ foo: 'bar' }))
    );

    Decode.value.decode({ foo: 'bar' }).cata({
        Left: err => {
            t.fail(err);
        },
        Right: value => {
            t.deepEqual(
                value.encode(0),
                '{"foo":"bar"}'
            );
        }
    });
});

test('Json.Decode.nill', t => {
    const decoder = Decode.nill(0);

    t.deepEqual(
        decoder.decode(0),
        Left('Value `0` is not a null.')
    );

    t.deepEqual(
        decoder.decode('0'),
        Left('Value `"0"` is not a null.')
    );

    t.deepEqual(
        decoder.decode(null),
        Right(0)
    );
});

test('Json.Decode.fail', t => {
    t.deepEqual(
        Decode.fail('msg').decode(null),
        Left('msg')
    )
});

test('Json.Decode.succeed', t => {
    t.deepEqual(
        Decode.succeed(1).decode(null),
        Right(1)
    )
});

test('Json.Decode.oneOf', t => {
    const input = [1, 2, null, 3];

    t.deepEqual(
        Decode.list(Decode.oneOf([])).decode(input),
        Left('OneOf Decoder shouldn\'t be empty.')
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number
        ])).decode(input),
        Left('Value `null` is not a number.')
    );

    t.deepEqual(
        Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nill(0)
        ])).decode(input),
        Right([1, 2, 0, 3])
    );
});

test('Json.Decode.nullable', t => {
    const decoder = Decode.nullable(Decode.string);

    t.deepEqual(
        decoder.decode(undefined),
        Left('Value `undefined` is not a string.')
    );

    t.deepEqual(
        decoder.decode(null),
        Right(Nothing)
    );

    t.deepEqual(
        decoder.decode(1),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode('str'),
        Right(Just('str'))
    );
});

test('Json.Decode.maybe', t => {
    const input = {
        s1: 'str',
        s2: 1
    };

    t.deepEqual(
        Decode.maybe(Decode.field('s1', Decode.number)).decode(input),
        Right(Nothing)
    );

    t.deepEqual(
        Decode.maybe(Decode.field('s2', Decode.number)).decode(input),
        Right(Just(1))
    );

    t.deepEqual(
        Decode.maybe(Decode.field('s3', Decode.number)).decode(input),
        Right(Nothing)
    );

    t.deepEqual(
        Decode.field('s1', Decode.maybe(Decode.number)).decode(input),
        Right(Nothing)
    );

    t.deepEqual(
        Decode.field('s2', Decode.maybe(Decode.number)).decode(input),
        Right(Just(1))
    );

    t.deepEqual(
        Decode.field('s3', Decode.maybe(Decode.number)).decode(input),
        Left('Field `s3` doesn\'t exist in an object {"s1":"str","s2":1}.')
    );
});

test('Json.Decode.list', t => {
    const decoder = Decode.list(Decode.string);

    t.deepEqual(
        decoder.decode({}),
        Left('Value `{}` is not an array.')
    );

    t.deepEqual(
        decoder.decode([ 1, 2 ]),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode([ 'str1', 2 ]),
        Left('Value `2` is not a string.')
    );

    t.deepEqual(
        decoder.decode([ 'str1', 'str2' ]),
        Right([ 'str1', 'str2' ])
    );
});

test('Json.Decode.dict', t => {
    const decoder = Decode.dict(Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left('Value `1` is not an object.')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Value `null` is not an object.')
    );

    t.deepEqual(
        decoder.decode([]),
        Left('Value `[]` is not an object.')
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 2 }),
        Left('Value `2` is not a string.')
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 'str2' }),
        Right({ s1: 'str1', s2: 'str2' })
    );
});

test('Json.Decode.keyValuePairs', t => {
    const decoder = Decode.keyValuePairs(Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left('Value `1` is not an object.')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Value `null` is not an object.')
    );

    t.deepEqual(
        decoder.decode([]),
        Left('Value `[]` is not an object.')
    );

    t.deepEqual(
        decoder.decode({ s1: 1 }),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 2 }),
        Left('Value `2` is not a string.')
    );

    t.deepEqual(
        decoder.decode({ s1: 'str1', s2: 'str2' }),
        Right([
            [ 's1', 'str1' ],
            [ 's2', 'str2' ]
        ])
    );
});

test('Json.Decode.index', t => {
    const decoder = Decode.index(1, Decode.string);

    t.deepEqual(
        decoder.decode({}),
        Left('Value `{}` is not an array.')
    );

    t.deepEqual(
        decoder.decode([]),
        Left('Need index 1 but there are only 0 entries.')
    );

    t.deepEqual(
        decoder.decode([0, 1]),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode([0, 'str']),
        Right('str')
    );
});

test('Json.Decode.field', t => {
    const decoder = Decode.field('foo', Decode.string);

    t.deepEqual(
        decoder.decode(1),
        Left('Value `1` is not an object.')
    );

    t.deepEqual(
        decoder.decode(null),
        Left('Value `null` is not an object.')
    );

    t.deepEqual(
        decoder.decode([]),
        Left('Value `[]` is not an object.')
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left('Field `foo` doesn\'t exist in an object {"bar":"str"}.')
    );

    t.deepEqual(
        decoder.decode({ foo: 'str' }),
        Right('str')
    );
});

test('Json.Decode.at', t => {
    const decoder = Decode.at([ 'foo', 'bar' ], Decode.string);

    t.deepEqual(
        decoder.decode(null),
        Left('Value `null` is not an object.')
    );

    t.deepEqual(
        decoder.decode({ bar: 'str' }),
        Left('Field `foo` doesn\'t exist in an object {"bar":"str"}.')
    );

    t.deepEqual(
        decoder.decode({ foo: null }),
        Left('Value `null` is not an object.')
    );

    t.deepEqual(
        decoder.decode({
             foo: { baz: 'str' }
        }),
        Left('Field `bar` doesn\'t exist in an object {"baz":"str"}.')
    );

    t.deepEqual(
        decoder.decode({
             foo: { bar: 'str' }
        }),
        Right('str')
    );
});

test.skip('Json.Decode.lazy', t => {
    interface Comment {
        message: string;
        responses: Array<Comment>
    }

    const decoder: Decoder<Comment> = Decode.props({
        message: Decode.field('message', Decode.string),
        responses: Decode.field('responses', Decode.lazy(() => Decode.list(decoder)))
    });

    t.deepEqual(
        decoder.decode({
            message: 'msg',
            responces: [{
                message: 'msg-1'
            }]
        }),
        Left(
            'Field `responses` doesn\'t exist in an object '
            + '{"message":"msg","responces":['
            + '{"message":"msg-1"}'
            + ']}.'
        )
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

test('Json.Decode.chain', t => {
    const decoder = Decode.number.chain(
        t1 => t1 % 2 === 0 ? Decode.succeed(t1 - 1) : Decode.fail('msg')
    );

    t.deepEqual(
        decoder.decode('str'),
        Left('Value `"str"` is not a number.')
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

test('Json.Decode.map', t => {
    const decoder = Decode.string.map(t1 => ({ t1 }));

    t.deepEqual(
        decoder.decode(1),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decode('str'),
        Right({
            t1: 'str'
        })
    );
});

test('Json.Decode.decodeString', t => {
    const decoder = Decode.props({
        t1: Decode.field('s1', Decode.string),
        t2: Decode.field('s2', Decode.string),
    });

    t.deepEqual(
        decoder.decodeString('invalid'),
        Left('Unexpected token i in JSON at position 0')
    );

    t.deepEqual(
        decoder.decodeString('{"s1":1}'),
        Left('Value `1` is not a string.')
    );

    t.deepEqual(
        decoder.decodeString('{"s1":"str1","s2":"str2"}'),
        Right({
            t1: 'str1',
            t2: 'str2'
        })
    );
});

test('Decode.fromEither()', t => {
    const toDecimal = (str: string): Either<string, number> =>{
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
        decoder.decode('123'),
        Right(123)
    );
});


test('Decode.props()', t => {
    t.deepEqual(
        Decode.props({}).decode(null),
        Right({})
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.string
        }).decode(null),
        Left('Value `null` is not a string.')
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
            bar: Decode.field('sar', Decode.bool)
        }).decode({
            soo: 'str',
            sar: false
        }),
        Left('Value `"str"` is not a number.')
    );

    t.deepEqual(
        Decode.props({
            foo: Decode.field('soo', Decode.number),
            bar: Decode.field('sar', Decode.bool)
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
            bar: Decode.field('sar', Decode.bool)
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
        Left('Value `false` is not an object.')
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

