// tslint:disable:max-line-length

import test from 'ava';

import Maybe from '../../src/Maybe';
import Either from '../../src/Either';
import Encode from '../../src/Json/Encode';
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

test('Json.Decode.boolean', t => {
    t.deepEqual(
        Decode.boolean.decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting a BOOLEAN', undefined))
    );

    t.deepEqual(
        Decode.boolean.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a BOOLEAN', null))
    );

    t.deepEqual(
        Decode.boolean.decode('str'),
        Either.Left(Decode.Error.Failure('Expecting a BOOLEAN', 'str'))
    );

    t.deepEqual(
        Decode.boolean.decode(true),
        Either.Right(true)
    );

    t.deepEqual(
        Decode.boolean.decode(1),
        Either.Left(Decode.Error.Failure('Expecting a BOOLEAN', 1))
    );

    t.deepEqual(
        Decode.boolean.decode(1.1),
        Either.Left(Decode.Error.Failure('Expecting a BOOLEAN', 1.1))
    );
});

test('Json.Decode.int', t => {
    t.deepEqual(
        Decode.int.decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting an INTEGER', undefined))
    );

    t.deepEqual(
        Decode.int.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an INTEGER', null))
    );

    t.deepEqual(
        Decode.int.decode('str'),
        Either.Left(Decode.Error.Failure('Expecting an INTEGER', 'str'))
    );

    t.deepEqual(
        Decode.int.decode(true),
        Either.Left(Decode.Error.Failure('Expecting an INTEGER', true))
    );

    t.deepEqual(
        Decode.int.decode(1),
        Either.Right(1)
    );

    t.deepEqual(
        Decode.int.decode(1.1),
        Either.Left(Decode.Error.Failure('Expecting an INTEGER', 1.1))
    );
});

test('Json.Decode.float', t => {
    t.deepEqual(
        Decode.float.decode(undefined),
        Either.Left(Decode.Error.Failure('Expecting a FLOAT', undefined))
    );

    t.deepEqual(
        Decode.float.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a FLOAT', null))
    );

    t.deepEqual(
        Decode.float.decode('str'),
        Either.Left(Decode.Error.Failure('Expecting a FLOAT', 'str'))
    );

    t.deepEqual(
        Decode.float.decode(true),
        Either.Left(Decode.Error.Failure('Expecting a FLOAT', true))
    );

    t.deepEqual(
        Decode.float.decode(1),
        Either.Right(1)
    );

    t.deepEqual(
        Decode.float.decode(1.1),
        Either.Right(1.1)
    );
});

test('Json.Decode.value', t => {
    t.deepEqual(
        Decode.value.decode(null),
        Either.Right(Encode.nill)
    );

    t.deepEqual(
        Decode.value.decode('str'),
        Either.Right(Encode.string('str'))
    );

    t.deepEqual(
        Decode.value.decode(true),
        Either.Right(Encode.boolean(true))
    );

    t.deepEqual(
        Decode.value.decode(1),
        Either.Right(Encode.number(1))
    );

    t.deepEqual(
        Decode.value.decode(1.1),
        Either.Right(Encode.number(1.1))
    );

    t.deepEqual(
        Decode.value.decode([]),
        Either.Right(Encode.list([]))
    );

    t.deepEqual(
        Decode.value.decode([ 0, '_1', false ]),
        Either.Right(Encode.list([ Encode.number(0), Encode.string('_1'), Encode.boolean(false) ]))
    );

    t.deepEqual(
        Decode.value.decode({}),
        Either.Right(Encode.object({}))
    );

    t.deepEqual(
        Decode.value.decode({
            _0: 0,
            _1: '_1',
            _2: false
        }),
        Either.Right(Encode.object({
            _0: Encode.number(0),
            _1: Encode.string('_1'),
            _2: Encode.boolean(false)
        }))
    );
});

test('Json.Decode.fail(message)', t => {
    t.deepEqual(
        Decode.fail('Some error').decode(undefined),
        Either.Left(Decode.Error.Failure('Some error', undefined))
    );

    t.deepEqual(
        Decode.fail('Some error').decode(null),
        Either.Left(Decode.Error.Failure('Some error', null))
    );

    t.deepEqual(
        Decode.fail('Some error').decode('str'),
        Either.Left(Decode.Error.Failure('Some error', 'str'))
    );

    t.deepEqual(
        Decode.fail('Some error').decode(true),
        Either.Left(Decode.Error.Failure('Some error', true))
    );

    t.deepEqual(
        Decode.fail('Some error').decode(1),
        Either.Left(Decode.Error.Failure('Some error', 1))
    );

    t.deepEqual(
        Decode.fail('Some error').decode(1.1),
        Either.Left(Decode.Error.Failure('Some error', 1.1))
    );
});

test('Json.Decode.succeed(value)', t => {
    t.deepEqual(
        Decode.succeed('str').decode(undefined),
        Either.Right('str')
    );

    t.deepEqual(
        Decode.succeed(false).decode(null),
        Either.Right(false)
    );

    t.deepEqual(
        Decode.succeed(1).decode('str'),
        Either.Right(1)
    );

    t.deepEqual(
        Decode.succeed(1.1).decode(true),
        Either.Right(1.1)
    );

    t.deepEqual(
        Decode.succeed(null).decode(1),
        Either.Right(null)
    );

    t.deepEqual(
        Decode.succeed([]).decode(1.1),
        Either.Right([])
    );
});

test('Json.Decode.props(config)', t => {
    t.deepEqual(
        Decode.props({}).decode(undefined),
        Either.Right({})
    );

    t.deepEqual(
        Decode.props({}).decode(null),
        Either.Right({})
    );

    t.deepEqual(
        Decode.props({}).decode('str'),
        Either.Right({})
    );

    t.deepEqual(
        Decode.props({}).decode(true),
        Either.Right({})
    );

    t.deepEqual(
        Decode.props({}).decode(1),
        Either.Right({})
    );

    t.deepEqual(
        Decode.props({}).decode(1.1),
        Either.Right({})
    );

    const _0 /* Decoder<{
        _0_: string
    }> */ = Decode.props({
        _0_: Decode.string
    });
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a STRING', null))
    );
    t.deepEqual(
        _0.decode(1),
        Either.Left(Decode.Error.Failure('Expecting a STRING', 1))
    );
    t.deepEqual(
        _0.decode('str'),
        Either.Right({
            _0_: 'str'
        })
    );

    const _1 /* Decoder<{
        _0_: Maybe<string>
    }> */ = Decode.props({
        _0_: Decode.optional.string
    });
    t.deepEqual(
        _1.decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OPTIONAL STRING', 1))
    );
    t.deepEqual(
        _1.decode(null),
        Either.Right({
            _0_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _1.decode('str'),
        Either.Right({
            _0_: Maybe.Just('str')
        })
    );

    const _2 /* Decoder<{
        _0_: string
    }> */ = Decode.props({
        _0_: Decode.field('__0__').of(Decode.string)
    });
    t.deepEqual(
        _2.decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );
    t.deepEqual(
        _2.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _2.decode({}),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'__0__\'', {}))
    );
    t.deepEqual(
        _2.decode({
            __0__: null
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting a STRING', null)
            )
        )
    );
    t.deepEqual(
        _2.decode({
            __0__: 1
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting a STRING', 1)
            )
        )
    );
    t.deepEqual(
        _2.decode({
            __0__: 'str'
        }),
        Either.Right({
            _0_: 'str'
        })
    );

    const _3 /* Decoder<{
        _0_: Maybe<string>
    }> */ = Decode.props({
        _0_: Decode.optional.field('__0__').of(Decode.string)
    });
    t.deepEqual(
        _3.decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );
    t.deepEqual(
        _3.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _3.decode({}),
        Either.Right({
            _0_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _3.decode({
            __0__: null
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting a STRING', null)
            )
        )
    );
    t.deepEqual(
        _3.decode({
            __0__: 1
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting a STRING', 1)
            )
        )
    );
    t.deepEqual(
        _3.decode({
            __0__: 'str'
        }),
        Either.Right({
            _0_: Maybe.Just('str')
        })
    );

    const _4 /* Decoder<{
        _0_: Maybe<string>
    }> */ = Decode.props({
        _0_: Decode.field('__0__').optional.of(Decode.string)
    });
    t.deepEqual(
        _4.decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );
    t.deepEqual(
        _4.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _4.decode({}),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'__0__\'', {}))
    );
    t.deepEqual(
        _4.decode({
            __0__: null
        }),
        Either.Right({
            _0_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _4.decode({
            __0__: 1
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
            )
        )
    );
    t.deepEqual(
        _4.decode({
            __0__: 'str'
        }),
        Either.Right({
            _0_: Maybe.Just('str')
        })
    );

    const _5 /* Decoder<{
        _0_: Maybe<string>
    }> */ = Decode.props({
        _0_: Decode.optional.field('__0__').optional.of(Decode.string)
    });
    t.deepEqual(
        _5.decode(1),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', 1))
    );
    t.deepEqual(
        _5.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _5.decode({}),
        Either.Right({
            _0_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _5.decode({
            __0__: null
        }),
        Either.Right({
            _0_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _5.decode({
            __0__: 1
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
            )
        )
    );
    t.deepEqual(
        _5.decode({
            __0__: 'str'
        }),
        Either.Right({
            _0_: Maybe.Just('str')
        })
    );

    const _6 = Decode.props({
        _0_: Decode.field('__0__').string,
        _1_: Decode.field('__1__').int
    });
    t.deepEqual(
        _6.decode({}),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'__0__\'', {}))
    );
    t.deepEqual(
        _6.decode({
            __0__: 0
        }),
        Either.Left(
            Decode.Error.Field(
                '__0__',
                Decode.Error.Failure('Expecting a STRING', 0)
            )
        )
    );
    t.deepEqual(
        _6.decode({
            __0__: 'str'
        }),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT with a FIELD named \'__1__\'', {
            __0__: 'str'
        }))
    );
    t.deepEqual(
        _6.decode({
            __0__: 'str',
            __1__: 1.1
        }),
        Either.Left(
            Decode.Error.Field(
                '__1__',
                Decode.Error.Failure('Expecting an INTEGER', 1.1)
            )
        )
    );
    t.deepEqual(
        _6.decode({
            __0__: 'str',
            __1__: 1
        }),
        Either.Right({
            _0_: 'str',
            _1_: 1
        })
    );
});

test('Json.Decode.oneOf(decoders)', t => {
    t.deepEqual(
        Decode.oneOf([]).decode(null),
        Either.Left(Decode.Error.OneOf([]))
    );

    t.deepEqual(
        Decode.oneOf([
            Decode.string
        ]).decode(null),
        Either.Left(Decode.Error.OneOf([
            Decode.Error.Failure('Expecting a STRING', null)
        ]))
    );

    t.deepEqual(
        Decode.oneOf([
            Decode.string.map(Maybe.Just),
            Decode.succeed(Maybe.Nothing)
        ]).decode(undefined),
        Either.Right(Maybe.Nothing)
    );

    const _0 /* Decoder<string> */ = Decode.oneOf([
        Decode.string,
        Decode.float.map(float => float.toFixed(2))
    ]);
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.OneOf([
            Decode.Error.Failure('Expecting a STRING', null),
            Decode.Error.Failure('Expecting a FLOAT', null)
        ]))
    );
    t.deepEqual(
        _0.decode(false),
        Either.Left(Decode.Error.OneOf([
            Decode.Error.Failure('Expecting a STRING', false),
            Decode.Error.Failure('Expecting a FLOAT', false)
        ]))
    );
    t.deepEqual(
        _0.decode('123.45'),
        Either.Right('123.45')
    );
    t.deepEqual(
        _0.decode(234.567),
        Either.Right('234.57')
    );
});

test('Json.Decode.list(decoder)', t => {
    const _0 /* Decoder<Array<string>> */ = Decode.list(Decode.string);
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a LIST', null))
    );
    t.deepEqual(
        _0.decode({}),
        Either.Left(Decode.Error.Failure('Expecting a LIST', {}))
    );
    t.deepEqual(
        _0.decode([]),
        Either.Right([])
    );
    t.deepEqual(
        _0.decode([ 0 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting a STRING', 0)
        ))
    );
    t.deepEqual(
        _0.decode([ '_0_', null ]),
        Either.Left(Decode.Error.Index(
            1,
            Decode.Error.Failure('Expecting a STRING', null)
        ))
    );
    t.deepEqual(
        _0.decode([ '_0_', '_1_' ]),
        Either.Right([ '_0_', '_1_' ])
    );

    const _1 /* Decoder<Array<Maybe<string>>> */ = Decode.list(Decode.optional.string);
    t.deepEqual(
        _1.decode(null),
        Either.Left(Decode.Error.Failure('Expecting a LIST', null))
    );
    t.deepEqual(
        _1.decode({}),
        Either.Left(Decode.Error.Failure('Expecting a LIST', {}))
    );
    t.deepEqual(
        _1.decode([]),
        Either.Right([])
    );
    t.deepEqual(
        _1.decode([ 0 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting an OPTIONAL STRING', 0)
        ))
    );
    t.deepEqual(
        _1.decode([ '_0_', null ]),
        Either.Right([ Maybe.Just('_0_'), Maybe.Nothing ])
    );
    t.deepEqual(
        _1.decode([ '_0_', '_1_' ]),
        Either.Right([ Maybe.Just('_0_'), Maybe.Just('_1_') ])
    );
});

test('Json.Decode.keyValue(decoder)', t => {
    const _0 /* Decoder<Array<[ string, number ]>> */ = Decode.keyValue(Decode.int);
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _0.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _0.decode({}),
        Either.Right([])
    );
    t.deepEqual(
        _0.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting an INTEGER', '0')
        ))
    );
    t.deepEqual(
        _0.decode({
            _0_: 0,
            _1_: null
        }),
        Either.Left(Decode.Error.Field(
            '_1_',
            Decode.Error.Failure('Expecting an INTEGER', null)
        ))
    );
    t.deepEqual(
        _0.decode({
            _0_: 0,
            _1_: 1
        }),
        Either.Right<Array<[ string, number ]>>([
            [ '_0_', 0 ],
            [ '_1_', 1 ]
        ])
    );

    const _1 /* Decoder<Array<[ string, Maybe<number> ]>> */ = Decode.keyValue(Decode.optional.int);
    t.deepEqual(
        _1.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _1.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _1.decode({}),
        Either.Right([])
    );
    t.deepEqual(
        _1.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting an OPTIONAL INTEGER', '0')
        ))
    );
    t.deepEqual(
        _1.decode({
            _0_: 0,
            _1_: null
        }),
        Either.Right<Array<[ string, Maybe<number> ]>>([
            [ '_0_', Maybe.Just(0) ],
            [ '_1_', Maybe.Nothing ]
        ])
    );
    t.deepEqual(
        _1.decode({
            _0_: 0,
            _1_: 1
        }),
        Either.Right<Array<[ string, Maybe<number> ]>>([
            [ '_0_', Maybe.Just(0) ],
            [ '_1_', Maybe.Just(1) ]
        ])
    );
});

test('Json.Decode.keyValue(convertKey, decoder)', t => {
    const toDate = (str: string): Either<string, Date> => {
        const date = new Date(str);

        return isNaN(date.getTime())
            ? Either.Left('Expecting a DATE')
            : Either.Right(date);
    };

    const _0 /* Decoder<Array<[ Date, number ]>> */ = Decode.keyValue(toDate, Decode.int);
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _0.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _0.decode({}),
        Either.Right([])
    );
    t.deepEqual(
        _0.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting a DATE', '_0_')
        ))
    );
    t.deepEqual(
        _0.decode({
            '2019-09-02': '0'
        }),
        Either.Left(Decode.Error.Field(
            '2019-09-02',
            Decode.Error.Failure('Expecting an INTEGER', '0')
        ))
    );
    t.deepEqual(
        _0.decode({
            '2019-09-02': 0,
            '2019-10-02': null
        }),
        Either.Left(Decode.Error.Field(
            '2019-10-02',
            Decode.Error.Failure('Expecting an INTEGER', null)
        ))
    );
    t.deepEqual(
        _0.decode({
            '2019-09-02': 0,
            '2019-10-02': 1
        }),
        Either.Right<Array<[ Date, number ]>>([
            [ new Date(2019, 8, 2, 7), 0 ],
            [ new Date(2019, 9, 2, 7), 1 ]
        ])
    );

    const _1 /* Decoder<Array<[ Date, Maybe<number> ]>> */ = Decode.keyValue(toDate, Decode.optional.int);
    t.deepEqual(
        _1.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _1.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _1.decode({}),
        Either.Right([])
    );
    t.deepEqual(
        _1.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting a DATE', '_0_')
        ))
    );
    t.deepEqual(
        _1.decode({
            '2019-09-02': '0'
        }),
        Either.Left(Decode.Error.Field(
            '2019-09-02',
            Decode.Error.Failure('Expecting an OPTIONAL INTEGER', '0')
        ))
    );
    t.deepEqual(
        _1.decode({
            '2019-09-02': 0,
            '2019-10-02': null
        }),
        Either.Right<Array<[ Date, Maybe<number> ]>>([
            [ new Date(2019, 8, 2, 7), Maybe.Just(0) ],
            [ new Date(2019, 9, 2, 7), Maybe.Nothing ]
        ])
    );
    t.deepEqual(
        _1.decode({
            '2019-09-02': 0,
            '2019-10-02': 1
        }),
        Either.Right<Array<[ Date, Maybe<number> ]>>([
            [ new Date(2019, 8, 2, 7), Maybe.Just(0) ],
            [ new Date(2019, 9, 2, 7), Maybe.Just(1) ]
        ])
    );
});

test('Json.Decode.dict(decoder)', t => {
    const _0 /* Decoder<{
        [ key: string ]: number;
    }> */ = Decode.dict(Decode.int);
    t.deepEqual(
        _0.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _0.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _0.decode({}),
        Either.Right({})
    );
    t.deepEqual(
        _0.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting an INTEGER', '0')
        ))
    );
    t.deepEqual(
        _0.decode({
            _0_: 0,
            _1_: null
        }),
        Either.Left(Decode.Error.Field(
            '_1_',
            Decode.Error.Failure('Expecting an INTEGER', null)
        ))
    );
    t.deepEqual(
        _0.decode({
            _0_: 0,
            _1_: 1
        }),
        Either.Right({
            _0_: 0,
            _1_: 1
        })
    );

    const _1 /* Decoder<{
        [ key: string ]: Maybe<number>;
    }> */ = Decode.dict(Decode.optional.int);
    t.deepEqual(
        _1.decode(null),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', null))
    );
    t.deepEqual(
        _1.decode([]),
        Either.Left(Decode.Error.Failure('Expecting an OBJECT', []))
    );
    t.deepEqual(
        _1.decode({}),
        Either.Right({})
    );
    t.deepEqual(
        _1.decode({
            _0_: '0'
        }),
        Either.Left(Decode.Error.Field(
            '_0_',
            Decode.Error.Failure('Expecting an OPTIONAL INTEGER', '0')
        ))
    );
    t.deepEqual(
        _1.decode({
            _0_: 0,
            _1_: null
        }),
        Either.Right({
            _0_: Maybe.Just(0),
            _1_: Maybe.Nothing
        })
    );
    t.deepEqual(
        _1.decode({
            _0_: 0,
            _1_: 1
        }),
        Either.Right({
            _0_: Maybe.Just(0),
            _1_: Maybe.Just(1)
        })
    );
});

test.todo('Json.Decode.lazy()');

test.todo('Json.Decode.field()');

test('Json.Decode.field(name).of(decoder)', t => {
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

test('Json.Decode.optional.field(name).of(decoder)', t => {
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

test('Json.Decode.field(name).optional.of(decoder)', t => {
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

test('Json.Decode.optional.field(name).optional.of(decoder)', t => {
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

test('Json.Decode.index(position).of(decoder)', t => {
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

test('Json.Decode.optional.index(position).of(decoder)', t => {
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

test('Json.Decode.index(position).optional.of(decoder)', t => {
    t.deepEqual(
        Decode.index(0).optional.of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY', null))
    );

    t.deepEqual(
        Decode.index(0).optional.of(Decode.string).decode([]),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY with an ELEMENT at [0] but only see 0 entries', []))
    );

    t.deepEqual(
        Decode.index(0).optional.of(Decode.string).decode([ 1 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.index(0).optional.of(Decode.string).decode([ null ]),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.index(0).optional.of(Decode.string).decode([ 'str' ]),
        Either.Right(Maybe.Just('str'))
    );
});

test('Json.Decode.optional.index(position).optional.of(decoder)', t => {
    t.deepEqual(
        Decode.optional.index(0).optional.of(Decode.string).decode(null),
        Either.Left(Decode.Error.Failure('Expecting an ARRAY', null))
    );

    t.deepEqual(
        Decode.optional.index(0).optional.of(Decode.string).decode([]),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.index(0).optional.of(Decode.string).decode([ 1 ]),
        Either.Left(Decode.Error.Index(
            0,
            Decode.Error.Failure('Expecting an OPTIONAL STRING', 1)
        ))
    );

    t.deepEqual(
        Decode.optional.index(0).optional.of(Decode.string).decode([ null ]),
        Either.Right(Maybe.Nothing)
    );

    t.deepEqual(
        Decode.optional.index(0).optional.of(Decode.string).decode([ 'str' ]),
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

test.todo('Json.Decode.optional');

test('Json.Decode.optional.of(decoder)', t => {
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

test.todo('Json.Decode.Decoder.map()');

test.todo('Json.Decode.Decoder.chain()');

test.todo('Json.Decode.Decoder.fromEither()');

test.todo('Json.Decode.Decoder.fromMaybe()');

test.todo('Json.Decode.Decoder.decode');

test.todo('Json.Decode.Decoder.decodeJSON()');

test('Json.Decode.Error.cata(pattern)', t => {
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

test('Json.Decode.Error.Failure.stringify(indent)', t => {
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

test('Json.Decode.Error.OneOf.stringify(indent)', t => {
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

test('Json.Decode.Error.Index.stringify(indent)', t => {
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

test('Json.Decode.Error.Field.stringify(indent)', t => {
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
