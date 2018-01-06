import test from 'ava';

import {
    Value,
    Encode
} from '../../src/Json/Encode';

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

test('Json.Encode.bool', t => {
    t.is(
        Encode.bool(false).encode(0),
        'false'
    );
});

test('Json.Encode.nill', t => {
    t.is(
        Encode.nill.encode(0),
        'null'
    );
});

test('Json.Encode.list', t => {
    t.is(
        Encode.list([
            Encode.number(1),
            Encode.number(2),
            Encode.number(3)
        ]).encode(0),
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
});
