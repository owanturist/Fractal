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

        return isNaN(result) ? Nothing : Just(result);
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
        Right(Nothing)
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
    const decoder = Decode.keyValue(Decode.number);

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
        decoder.decode({ s1: 'str' }),
        Left(Decode.Error.Field('s1', Decode.Error.Failure('Expecting a NUMBER', 'str')))
    );

    t.deepEqual(
        decoder.decode({ s1: 1, s2: 2 }),
        Right<Array<[ string, number ]>>([
            [ 's1', 1 ],
            [ 's2', 2 ]
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

test('Json.Decode.Decoder.prototype.map()', t => {
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

test('Json.Decode.Decoder.prototype.chain()', t => {
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

test('Json.Decode.Decoder.prototype.ap()', t => {
    t.deepEqual(
        Decode.fail('err1').ap(Decode.fail('err2')).decode(1),
        Left(Decode.Error.Failure('err1', 1))
    );

    t.deepEqual(
        Decode.fail('err1').ap(Decode.succeed((a: number) => a * 2)).decode(1),
        Left(Decode.Error.Failure('err1', 1))
    );

    t.deepEqual(
        Decode.succeed(2).ap(Decode.fail('err2')).decode(1),
        Left(Decode.Error.Failure('err2', 1))
    );

    t.deepEqual(
        Decode.succeed(2).ap(Decode.succeed((a: number) => a * 2)).decode(1),
        Right(4)
    );
});

test('Json.Decode.Decoder.prototype.pipe()', t => {
    const fnFail: Decode.Decoder<(a: number) => string> = Decode.fail('_err_');
    const fnSucceed = Decode.succeed((a: number) => '_' + a * 2);

    t.deepEqual(
        fnFail.pipe(Decode.fail('err1')).decode('source'),
        Left(Decode.Error.Failure('_err_', 'source'))
    );

    t.deepEqual(
        fnFail.pipe(Decode.succeed(2)).decode('source'),
        Left(Decode.Error.Failure('_err_', 'source'))
    );

    t.deepEqual(
        fnSucceed.pipe(Decode.fail('err1')).decode('source'),
        Left(Decode.Error.Failure('err1', 'source'))
    );

    t.deepEqual(
        fnSucceed.pipe(Decode.succeed(2)).decode('source'),
        Right('_4')
    );

    const trippleFnLeft: Decode.Decoder<(a: number) => (b: string) => (c: boolean) => string> = Decode.fail('_err_');
    const trippleFnRight = Decode.succeed((a: number) => (b: string) => (c: boolean) => c ? b : '_' + a * 2);

    t.deepEqual(trippleFnLeft.pipe(Decode.fail('err1')).pipe(Decode.fail('err2'))  .pipe(Decode.fail('err3')) .decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.fail('err1')).pipe(Decode.fail('err2'))  .pipe(Decode.succeed(true)).decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.fail('err1')).pipe(Decode.succeed('hi')) .pipe(Decode.fail('err3')) .decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.fail('err1')).pipe(Decode.succeed('hi')) .pipe(Decode.succeed(true)).decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.succeed(2))  .pipe(Decode.fail('err2'))  .pipe(Decode.fail('err3')) .decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.succeed(2))  .pipe(Decode.fail('err2'))  .pipe(Decode.succeed(true)).decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.succeed(2))  .pipe(Decode.succeed('hi')) .pipe(Decode.fail('err3')) .decode('source'), Left(Decode.Error.Failure('_err_', 'source')));
    t.deepEqual(trippleFnLeft.pipe(Decode.succeed(2))  .pipe(Decode.succeed('hi')) .pipe(Decode.succeed(true)).decode('source'), Left(Decode.Error.Failure('_err_', 'source')));

    t.deepEqual(trippleFnRight.pipe(Decode.fail('err1')).pipe(Decode.fail('err2'))  .pipe(Decode.fail('err3')) .decode('source'),  Left(Decode.Error.Failure('err1', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.fail('err1')).pipe(Decode.fail('err2'))  .pipe(Decode.succeed(true)).decode('source'),  Left(Decode.Error.Failure('err1', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.fail('err1')).pipe(Decode.succeed('hi')) .pipe(Decode.fail('err3')) .decode('source'),  Left(Decode.Error.Failure('err1', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.fail('err1')).pipe(Decode.succeed('hi')) .pipe(Decode.succeed(true)).decode('source'),  Left(Decode.Error.Failure('err1', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.succeed(2))  .pipe(Decode.fail('err2'))  .pipe(Decode.fail('err3')) .decode('source'),  Left(Decode.Error.Failure('err2', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.succeed(2))  .pipe(Decode.fail('err2'))  .pipe(Decode.succeed(true)).decode('source'),  Left(Decode.Error.Failure('err2', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.succeed(2))  .pipe(Decode.succeed('hi')) .pipe(Decode.fail('err3')) .decode('source'),  Left(Decode.Error.Failure('err3', 'source')));
    t.deepEqual(trippleFnRight.pipe(Decode.succeed(2))  .pipe(Decode.succeed('hi')) .pipe(Decode.succeed(true)).decode('source'),  Right('hi'));
    t.deepEqual(trippleFnRight.pipe(Decode.succeed(2))  .pipe(Decode.succeed('hi')) .pipe(Decode.succeed(false)).decode('source'), Right('_4'));

    t.deepEqual(
        trippleFnRight
            .pipe(Decode.field('foo', Decode.number))
            .pipe(Decode.field('bar', Decode.string))
            .pipe(Decode.field('baz', Decode.boolean))
            .decode({
                foo: 2,
                bar: 'hi',
                baz: true
            }),
        Right('hi')
    );

    t.deepEqual(
        trippleFnRight
            .pipe(Decode.field('foo', Decode.number))
            .pipe(Decode.field('bar', Decode.string))
            .pipe(Decode.field('baz', Decode.boolean))
            .decode({
                foo: 2,
                bar: 'hi',
                baz: false
            }),
        Right('_4')
    );

    t.deepEqual(
        Decode.fromMaybe('err', Just((a: number) => '_' + a * 2)).pipe(Decode.succeed(2)).decode('source'),
        Right('_4'),
        'Decode.fromMaybe is piping'
    );

    t.deepEqual(
        Decode.fromEither(Right((a: number) => '_' + a * 2)).pipe(Decode.succeed(2)).decode('source'),
        Right('_4'),
        'Decode.fromEither is piping'
    );

    t.deepEqual(
        Decode.succeed(2).map(a => (b: number) => '_' + a * b).pipe(Decode.succeed(3)).decode('source'),
        Right('_6'),
        'Decode.prototype.map is piping'
    );

    t.deepEqual(
        Decode.succeed(2).chain(a => Decode.succeed((b: number) => '_' + a * b)).pipe(Decode.succeed(3)).decode('source'),
        Right('_6'),
        'Decode.prototype.chain is piping'
    );

    t.deepEqual(
        Decode.succeed(2).ap(Decode.succeed((a: number) => (b: number) => '_' + a * b)).pipe(Decode.succeed(3)).decode('source'),
        Right('_6'),
        'Decode.prototype.ap is piping'
    );
});

test('Json.Decode.Decoder.prototype.required()', t => {
    const decoder = Decode.succeed((a: number) => (b: string) => (c: boolean) => ({ a, b, c }))
        .require('foo', Decode.number)
        .require('bar', Decode.string)
        .require('baz', Decode.boolean)
        ;

    t.deepEqual(
        decoder.decode({}),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', {}))
    );

    t.deepEqual(
        decoder.decode({
            foo: 'str',
            bar: false,
            baz: 2
        }),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.Failure('Expecting a NUMBER', 'str')
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: false,
            baz: 2
        }),
        Left(Decode.Error.Field(
            'bar',
            Decode.Error.Failure('Expecting a STRING', false)
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: 'str',
            baz: 2
        }),
        Left(Decode.Error.Field(
            'baz',
            Decode.Error.Failure('Expecting a BOOLEAN', 2)
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: 'str',
            baz: false
        }),
        Right({
            a: 1,
            b: 'str',
            c: false
        })
    );
});

test('Json.Decode.Decoder.prototype.optional()', t => {
    const decoder = Decode.succeed((a: Maybe<number>) => (b: Maybe<string>) => (c: Maybe<boolean>) => ({ a, b, c }))
        .optional('foo', Decode.number)
        .optional('bar', Decode.string)
        .optional('baz', Decode.boolean)
        ;

    t.deepEqual(
        decoder.decode({}),
        Left(Decode.Error.Failure('Expecting an OBJECT with a field named \'foo\'', {}))
    );

    t.deepEqual(
        decoder.decode({
            foo: null,
            bar: null,
            baz: null
        }),
        Right({
            a: Nothing,
            b: Nothing,
            c: Nothing
        })
    );

    t.deepEqual(
        decoder.decode({
            foo: 'str',
            bar: false,
            baz: 2
        }),
        Left(Decode.Error.Field(
            'foo',
            Decode.Error.OneOf([
                Decode.Error.Failure('Expecting null', 'str'),
                Decode.Error.Failure('Expecting a NUMBER', 'str')
            ])
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: false,
            baz: 2
        }),
        Left(Decode.Error.Field(
            'bar',
            Decode.Error.OneOf([
                Decode.Error.Failure('Expecting null', false),
                Decode.Error.Failure('Expecting a STRING', false)
            ])
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: 'str',
            baz: 2
        }),
        Left(Decode.Error.Field(
            'baz',
            Decode.Error.OneOf([
                Decode.Error.Failure('Expecting null', 2),
                Decode.Error.Failure('Expecting a BOOLEAN', 2)
            ])
        ))
    );

    t.deepEqual(
        decoder.decode({
            foo: 1,
            bar: 'str',
            baz: false
        }),
        Right({
            a: Just(1),
            b: Just('str'),
            c: Just(false)
        })
    );
});

test('Json.Decode.Decoder.prototype.decode', t => {
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

test('Json.Decode.Decoder.prototype.decodeJSON()', t => {
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

test('Json.Decode.Error.prototype.cata()', t => {
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
