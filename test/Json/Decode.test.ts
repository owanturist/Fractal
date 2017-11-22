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
    decodeString,
    Decode
} from '../../src/Json/Decode';

test('Json.Decode.string', t => {
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

test('Json.Decode.number', t => {
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

test('Json.Decode.bool', t => {
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

test('Json.Decode.oneOf', t => {
    const input = [ 1, 2, null, 3 ];

    t.deepEqual(
        decodeValue(Decode.list(Decode.oneOf([])), input),
        Err('OneOf Decoder shouldn\'t be empty.')
    );

    t.deepEqual(
        decodeValue(Decode.list(Decode.oneOf([
            Decode.number
        ])), input),
        Err('Value `null` is not a number.')
    );

    t.deepEqual(
        decodeValue(Decode.list(Decode.oneOf([
            Decode.number,
            Decode.nul(0)
        ])), input),
        Ok([ 1, 2, 0, 3 ])
    );
});

test('Json.Decode.nul', t => {
    const decoder = Decode.nul(0);

    t.deepEqual(
        decodeValue(decoder, 0),
        Err('Value `0` is not a null.')
    );

    t.deepEqual(
        decodeValue(decoder, '0'),
        Err('Value `"0"` is not a null.')
    );

    t.deepEqual(
        decodeValue(decoder, null),
        Ok(0)
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

test('Json.Decode.map2', t => {
    const decoder = Decode.map2(
        (t1, t2) => ({ t1, t2 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2'
        })
    );
});

test('Json.Decode.map3', t => {
    const decoder = Decode.map3(
        (t1, t2, t3) => ({ t1, t2, t3 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3'
        })
    );
});

test('Json.Decode.map4', t => {
    const decoder = Decode.map4(
        (t1, t2, t3, t4) => ({ t1, t2, t3, t4 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string),
        Decode.field('s4', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3,
            s4: 4
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3,
            s4: 4
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3,
            s4: 4
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 4
        }),
        Err('Value `4` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3',
            t4: 'str4'
        })
    );
});

test('Json.Decode.map5', t => {
    const decoder = Decode.map5(
        (t1, t2, t3, t4, t5) => ({ t1, t2, t3, t4, t5 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string),
        Decode.field('s4', Decode.string),
        Decode.field('s5', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3,
            s4: 4,
            s5: 5
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 4,
            s5: 5
        }),
        Err('Value `4` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 5
        }),
        Err('Value `5` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3',
            t4: 'str4',
            t5: 'str5'
        })
    );
});

test('Json.Decode.map6', t => {
    const decoder = Decode.map6(
        (t1, t2, t3, t4, t5, t6) => ({ t1, t2, t3, t4, t5, t6 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string),
        Decode.field('s4', Decode.string),
        Decode.field('s5', Decode.string),
        Decode.field('s6', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 4,
            s5: 5,
            s6: 6
        }),
        Err('Value `4` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 5,
            s6: 6
        }),
        Err('Value `5` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 6
        }),
        Err('Value `6` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3',
            t4: 'str4',
            t5: 'str5',
            t6: 'str6'
        })
    );
});

test('Json.Decode.map7', t => {
    const decoder = Decode.map7(
        (t1, t2, t3, t4, t5, t6, t7) => ({ t1, t2, t3, t4, t5, t6, t7 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string),
        Decode.field('s4', Decode.string),
        Decode.field('s5', Decode.string),
        Decode.field('s6', Decode.string),
        Decode.field('s7', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7
        }),
        Err('Value `4` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 5,
            s6: 6,
            s7: 7
        }),
        Err('Value `5` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 6,
            s7: 7
        }),
        Err('Value `6` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6',
            s7: 7
        }),
        Err('Value `7` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6',
            s7: 'str7'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3',
            t4: 'str4',
            t5: 'str5',
            t6: 'str6',
            t7: 'str7'
        })
    );
});

test('Json.Decode.map8', t => {
    const decoder = Decode.map8(
        (t1, t2, t3, t4, t5, t6, t7, t8) => ({ t1, t2, t3, t4, t5, t6, t7, t8 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string),
        Decode.field('s3', Decode.string),
        Decode.field('s4', Decode.string),
        Decode.field('s5', Decode.string),
        Decode.field('s6', Decode.string),
        Decode.field('s7', Decode.string),
        Decode.field('s8', Decode.string)
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 1,
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 2,
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `2` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 3,
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `3` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 4,
            s5: 5,
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `4` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 5,
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `5` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 6,
            s7: 7,
            s8: 8
        }),
        Err('Value `6` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6',
            s7: 7,
            s8: 8
        }),
        Err('Value `7` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6',
            s7: 'str7',
            s8: 8
        }),
        Err('Value `8` is not a string.')
    );

    t.deepEqual(
        decodeValue(decoder, {
            s1: 'str1',
            s2: 'str2',
            s3: 'str3',
            s4: 'str4',
            s5: 'str5',
            s6: 'str6',
            s7: 'str7',
            s8: 'str8'
        }),
        Ok({
            t1: 'str1',
            t2: 'str2',
            t3: 'str3',
            t4: 'str4',
            t5: 'str5',
            t6: 'str6',
            t7: 'str7',
            t8: 'str8'
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

test('Json.Decode.decodeString', t => {
    const decoder = Decode.map2(
        (t1, t2) => ({ t1, t2 }),
        Decode.field('s1', Decode.string),
        Decode.field('s2', Decode.string)
    );

    t.deepEqual(
        decodeString(decoder, 'invalid'),
        Err('Unexpected token i in JSON at position 0')
    );

    t.deepEqual(
        decodeString(decoder, '{"s1":1}'),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        decodeString(decoder, '{"s1":"str1","s2":"str2"}'),
        Ok({
            t1: 'str1',
            t2: 'str2'
        })
    );
});
