import test from 'ava';

import {
    Nothing,
    Just
} from '../../src/Maybe';
import {
    Err,
    Ok
} from '../../src/Result';
import {
    decodeValue,
    Decode
} from '../../src/Json/Foo';

test('Json.Foo.string', t => {
    t.deepEqual(
        decodeValue(
            Decode.string,
            1
        ),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(
            Decode.string,
            'str'
        ),
        Ok('str')
    );
});

test('Json.Foo.number', t => {
    t.deepEqual(
        decodeValue(
            Decode.number,
            'str'
        ),
        Err('Value `"str"` is not a number.')
    );

    t.deepEqual(
        decodeValue(
            Decode.number,
            1
        ),
        Ok(1)
    );
});

test('Json.Foo.bool', t => {
    t.deepEqual(
        decodeValue(
            Decode.bool,
            1
        ),
        Err('Value `1` is not a bool.')
    );

    t.deepEqual(
        decodeValue(
            Decode.bool,
            false
        ),
        Ok(false)
    );
});

test('Json.Decode.nullable', t => {
    const decoder = Decode.nullable(Decode.string);

    t.deepEqual(
        decodeValue(decoder, undefined),
        Err('Value `undefined` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, null),
        Ok(Nothing)
    );

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, 'str'),
        Ok(Just('str'))
    );
});

test('Json.Decode.list', t => {
    const decoder = Decode.list(Decode.string);

    t.deepEqual(
        decodeValue(decoder, {}),
        Err('Value `{}` is not an array.')
    );

    t.deepEqual(
        decodeValue(decoder, [ 1, 2 ]),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, [ 'str1', 2 ]),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, [ 'str1', 'str2' ]),
        Ok([ 'str1', 'str2' ])
    );
});

test('Json.Decode.dict', t => {
    const decoder = Decode.dict(Decode.string);

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('Value `1` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, null),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, []),
        Err('Value `[]` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 1 }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 'str1', s2: 2 }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 'str1', s2: 'str2' }),
        Ok({ s1: 'str1', s2: 'str2' })
    );
});

test('Json.Decode.keyValuePairs', t => {
    const decoder = Decode.keyValuePairs(Decode.string);

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('Value `1` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, null),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, []),
        Err('Value `[]` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 1 }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 'str1', s2: 2 }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, { s1: 'str1', s2: 'str2' }),
        Ok([
            [ 's1', 'str1' ],
            [ 's2', 'str2' ]
        ])
    );
});

test('Json.Decode.field', t => {
    const decoder = Decode.field('foo', Decode.string);

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('Value `1` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, null),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, []),
        Err('Value `[]` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, { bar: 'str' }),
        Err('Field `foo` doesn\'t exist in an object {"bar":"str"}.')
    );

    t.deepEqual(
        decodeValue(decoder, { foo: 'str' }),
        Ok('str')
    );
});

test('Json.Decode.at', t => {
    const decoder = Decode.at([ 'foo', 'bar' ], Decode.string);

    t.deepEqual(
        decodeValue(decoder, null),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, { bar: 'str' }),
        Err('Field `foo` doesn\'t exist in an object {"bar":"str"}.')
    );

    t.deepEqual(
        decodeValue(decoder, { foo: null }),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        decodeValue(decoder, {
             foo: { baz: 'str' }
        }),
        Err('Field `bar` doesn\'t exist in an object {"baz":"str"}.')
    );

    t.deepEqual(
        decodeValue(decoder, {
             foo: { bar: 'str' }
        }),
        Ok('str')
    );
});

test('Json.Decode.index', t => {
    const decoder = Decode.index(1, Decode.string);

    t.deepEqual(
        decodeValue(decoder, {}),
        Err('Value `{}` is not an array.')
    );

    t.deepEqual(
        decodeValue(decoder, []),
        Err('Need index 1 but there are only 0 entries.')
    );

    t.deepEqual(
        decodeValue(decoder, [0, 1]),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, [0, 'str']),
        Ok('str')
    );
});

test('Json.Decode.maybe', t => {
    const input = {
        s1: 'str',
        s2: 1
    };

    t.deepEqual(
        decodeValue(Decode.maybe(Decode.field('s1', Decode.number)), input),
        Ok(Nothing)
    );

    t.deepEqual(
        decodeValue(Decode.maybe(Decode.field('s2', Decode.number)), input),
        Ok(Just(1))
    );

    t.deepEqual(
        decodeValue(Decode.maybe(Decode.field('s3', Decode.number)), input),
        Ok(Nothing)
    );

    t.deepEqual(
        decodeValue(Decode.field('s1', Decode.maybe(Decode.number)), input),
        Ok(Nothing)
    );

    t.deepEqual(
        decodeValue(Decode.field('s2', Decode.maybe(Decode.number)), input),
        Ok(Just(1))
    );

    t.deepEqual(
        decodeValue(Decode.field('s3', Decode.maybe(Decode.number)), input),
        Err('Field `s3` doesn\'t exist in an object {"s1":"str","s2":1}.')
    );
});

test('Json.Decode.fail', t => {
    t.deepEqual(
        decodeValue(Decode.fail('msg'), null),
        Err('msg')
    )
});

test('Json.Decode.succeed', t => {
    t.deepEqual(
        decodeValue(Decode.succeed(1), null),
        Ok(1)
    )
});

test('Json.Decode.map', t => {
    const decoder = Decode.map(
        t1 => ({ t1 }),
        Decode.string
    );

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, 'str'),
        Ok({
            t1: 'str'
        })
    );
});

test('Json.Decode.andThen', t => {
    const decoder = Decode.andThen(
        t1 => t1 % 2 === 0 ? Decode.succeed(t1 - 1) : Decode.fail('msg'),
        Decode.number
    );

    t.deepEqual(
        decodeValue(decoder, 'str'),
        Err('Value `"str"` is not a number.')
    );

    t.deepEqual(
        decodeValue(decoder, 1),
        Err('msg')
    );

    t.deepEqual(
        decodeValue(decoder, 2),
        Ok(1)
    );
});