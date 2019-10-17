import test from 'ava';

import Maybe from '../../src/Maybe';
import Encode from '../../src/Json/Encode';

test('Json.Encode.nill', t => {
    t.is(Encode.nill.encode(0), 'null');
    t.is(Encode.nill.serialize(), null);
});

test('Json.Encode.string()', t => {
    t.is(Encode.string('msg').encode(0), '"msg"');
    t.is(Encode.string('msg').serialize(), 'msg');
});

test('Json.Encode.number()', t => {
    t.is(Encode.number(1).encode(0), '1');
    t.is(Encode.number(1).serialize(), 1);
});

test('Json.Encode.boolean()', t => {
    t.is(Encode.boolean(false).encode(0), 'false');
    t.is(Encode.boolean(false).serialize(), false);
});

test('Json.Encode.nullable()', t => {
    t.is(
        Encode.nullable(Encode.string, Maybe.Nothing).encode(0),
        'null'
    );

    t.is(
        Encode.nullable(Encode.string, Maybe.Nothing).serialize(),
        null
    );

    t.is(
        Encode.nullable(Encode.string, Maybe.Just('msg')).encode(0),
        '"msg"'
    );

    t.is(
        Encode.nullable(Encode.string, Maybe.Just('msg')).serialize(),
        'msg'
    );
});

test('Json.Encode.list(encoders)', t => {
    t.is(
        Encode.list([
            Encode.number(1),
            Encode.number(2),
            Encode.number(1)
        ]).encode(0),
        '[1,2,1]'
    );

    const array = [
        Encode.number(1),
        Encode.number(2),
        Encode.number(1)
    ];

    t.deepEqual(
        Encode.list(array).serialize(),
        [ 1, 2, 1 ]
    );

    t.deepEqual(
        array,
        [
            Encode.number(1),
            Encode.number(2),
            Encode.number(1)
        ],
        'checking of Array immutability'
    );

    t.is(
        Encode.list([
            Encode.list([
                Encode.list([
                    Encode.number(0),
                    Encode.number(1)
                ])
            ]),
            Encode.list([
                Encode.list([
                    Encode.number(1),
                    Encode.number(0)
                ])
            ])
        ]).encode(0),
        '[[[0,1]],[[1,0]]]'
    );

    t.is(
        Encode.list([
            Encode.number(0),
            Encode.string('1')
        ]).encode(0),
        '[0,"1"]'
    );

    t.is(
        Encode.list([
            Encode.number(0),
            Encode.object({
                bar: Encode.string('1')
            })
        ]).encode(0),
        '[0,{"bar":"1"}]'
    );
});

test('Json.Encode.list(encoder, values)', t => {
    t.is(
        Encode.list(Encode.number, [ 1, 2, 1 ]).encode(0),
        '[1,2,1]'
    );

    t.deepEqual(
        Encode.list(Encode.number, [ 1, 2, 1 ]).serialize(),
        [ 1, 2, 1 ]
    );
});

test('Json.Encode.object(object)', t => {
    const _1 = (foo: {
        bar: string;
        baz: number;
        foo: boolean;
    }): Encode.Value => Encode.object({
        _bar: Encode.string(foo.bar),
        _baz: Encode.number(foo.baz),
        _foo: Encode.boolean(foo.foo)
    });

    t.is(
        _1({
            bar: 'str',
            baz: 0,
            foo: false
        }).encode(0),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );

    t.is(
        _1({
            bar: 'str',
            baz: 0,
            foo: false
        }).encode(4),
        '{\n'
        + '    "_bar": "str",\n'
        + '    "_baz": 0,\n'
        + '    "_foo": false\n'
        + '}'
    );

    t.is(
        Encode.object({
            foo: Encode.object({
                bar: Encode.object({
                    baz: Encode.number(0)
                })
            })
        }).encode(0),
        '{"foo":{"bar":{"baz":0}}}'
    );

    t.deepEqual(
        Encode.object({
            foo: Encode.object({
                bar: Encode.object({
                    baz: Encode.number(0)
                })
            })
        }).serialize(),
        {
            foo: {
                bar: {
                    baz: 0
                }
            }
        }
    );

    t.is(
        Encode.object({
            foo: Encode.number(0),
            bar: Encode.list([
                Encode.boolean(false),
                Encode.string('1')
            ])
        }).encode(0),
        '{"foo":0,"bar":[false,"1"]}'
    );
});


test('Json.Encode.object(list)', t => {
    const _1 = (foo: {
        bar: string;
        baz: number;
        foo: boolean;
    }): Encode.Value => Encode.object([
        [ '_bar', Encode.string(foo.bar) ],
        [ '_baz', Encode.number(foo.baz) ],
        [ '_foo', Encode.boolean(foo.foo) ]
    ]);

    t.is(
        _1({
            bar: 'str',
            baz: 0,
            foo: false
        }).encode(0),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );

    t.is(
        _1({
            bar: 'str',
            baz: 0,
            foo: false
        }).encode(4),
        '{\n'
        + '    "_bar": "str",\n'
        + '    "_baz": 0,\n'
        + '    "_foo": false\n'
        + '}'
    );

    t.is(
        Encode.object([
            [
                'foo',
                Encode.object([
                    [
                        'bar',
                        Encode.object([
                            [ 'baz', Encode.number(0) ]
                        ])
                    ]
                ])
            ]
        ]).encode(0),
        '{"foo":{"bar":{"baz":0}}}'
    );

    t.deepEqual(
        Encode.object([
            [
                'foo',
                Encode.object([
                    [
                        'bar',
                        Encode.object([
                            [ 'baz', Encode.number(0) ]
                        ])
                    ]
                ])
            ]
        ]).serialize(),
        {
            foo: {
                bar: {
                    baz: 0
                }
            }
        }
    );

    t.is(
        Encode.object([
            [ 'foo', Encode.number(0) ],
            [
                'bar',
                Encode.list([
                    Encode.boolean(false),
                    Encode.string('1')
                ])
            ]
        ]).encode(0),
        '{"foo":0,"bar":[false,"1"]}'
    );
});

test('Json.Encode.object(optional object)', t => {
    const _1 = (foo: {
        bar: Maybe<string>;
        baz: Maybe<number>;
        foo: boolean;
    }): Encode.Value => Encode.object({
        _bar: foo.bar.map(Encode.string),
        _baz: foo.baz.map(Encode.number),
        _foo: Encode.boolean(foo.foo).tap(Maybe.Just)
    });

    t.is(
        _1({
            bar: Maybe.Nothing,
            baz: Maybe.Nothing,
            foo: false
        }).encode(0),
        '{"_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Nothing,
            baz: Maybe.Just(0),
            foo: false
        }).encode(0),
        '{"_baz":0,"_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Just('str'),
            baz: Maybe.Nothing,
            foo: false
        }).encode(0),
        '{"_bar":"str","_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Just('str'),
            baz: Maybe.Just(0),
            foo: false
        }).encode(0),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );
});

test('Json.Encode.object(optional list)', t => {
    const _1 = (foo: {
        bar: Maybe<string>;
        baz: Maybe<number>;
        foo: boolean;
    }): Encode.Value => Encode.object([
        [ '_bar', foo.bar.map(Encode.string) ],
        [ '_baz', foo.baz.map(Encode.number) ],
        [ '_foo', Encode.boolean(foo.foo).tap(Maybe.Just) ]
    ]);

    t.is(
        _1({
            bar: Maybe.Nothing,
            baz: Maybe.Nothing,
            foo: false
        }).encode(0),
        '{"_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Nothing,
            baz: Maybe.Just(0),
            foo: false
        }).encode(0),
        '{"_baz":0,"_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Just('str'),
            baz: Maybe.Nothing,
            foo: false
        }).encode(0),
        '{"_bar":"str","_foo":false}'
    );

    t.is(
        _1({
            bar: Maybe.Just('str'),
            baz: Maybe.Just(0),
            foo: false
        }).encode(0),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );
});
