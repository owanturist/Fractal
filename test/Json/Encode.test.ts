import test from 'ava';

import {
    Value,
    Encode,
    encode
} from '../../src/Json/Encode';

test('Json.Encode.string', t => {
    const encoder = (value: string): Value => Encode.string(value);

    t.is(
        encode(0, encoder('msg')),
        '"msg"'
    );
});

test('Json.Encode.number', t => {
    const encoder = (value: number): Value => Encode.number(value);

    t.is(
        encode(0, encoder(1)),
        '1'
    );
});

test('Json.Encode.bool', t => {
    const encoder = (value: boolean): Value => Encode.bool(value);

    t.is(
        encode(0, encoder(false)),
        'false'
    );
});

test('Json.Encode.nul', t => {
    t.is(
        encode(0, Encode.nul),
        'null'
    );
});

test('Json.Encode.list', t => {
    t.is(
        encode(0, Encode.list([
            Encode.number(1),
            Encode.number(2),
            Encode.number(3)
        ])),
        '[1,2,3]'
    );
});

test('Json.Encode.object', t => {
    type Foo = {
        bar: string,
        baz: number,
        foo: boolean
    };

    const encoder = (foo: Foo): Value => Encode.object([
        [ '_bar', Encode.string(foo.bar) ],
        [ '_baz', Encode.number(foo.baz) ],
        [ '_foo', Encode.bool(foo.foo) ]
    ]);

    t.is(
        encode(0, encoder({
            bar: 'str',
            baz: 0,
            foo: false
        })),
        '{"_bar":"str","_baz":0,"_foo":false}'
    );

    t.is(
        encode(4, encoder({
            bar: 'str',
            baz: 0,
            foo: false
        })),
        '{\n'
        + '    "_bar": "str",\n'
        + '    "_baz": 0,\n'
        + '    "_foo": false\n'
        + '}'
    );
});
