/* tslint:disable: no-magic-numbers */

import test from 'ava';

import * as Encode from '../../src/Json/Encode';

test('Json.Encode.nill', t => {
    t.is(
        Encode.nill.encode(0),
        'null'
    );
});

test('Json.Encode.string', t => {
    t.is(
        Encode.string('msg').encode(0),
        '"msg"'
    );
});

test('Json.Encode.number', t => {
    t.is(
        Encode.number(1).encode(0),
        '1'
    );
});

test('Json.Encode.boolean', t => {
    t.is(
        Encode.boolean(false).encode(0),
        'false'
    );
});

test('Json.Encode.list', t => {
    t.is(
        Encode.list([
            Encode.number(1),
            Encode.number(2),
            Encode.number(1)
        ]).encode(0),
        '[1,2,1]'
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
});

test('Json.Encode.object', t => {
    interface Foo {
        bar: string;
        baz: number;
        foo: boolean;
    }

    const encoder = (foo: Foo): Encode.Value => Encode.object({
        _bar: Encode.string(foo.bar),
        _baz: Encode.number(foo.baz),
        _foo: Encode.boolean(foo.foo)
    });

    t.is(
        encoder({
            bar: 'str',
            baz: 0,
            foo: false
        }).encode(0),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );

    t.is(
        encoder({
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
});
