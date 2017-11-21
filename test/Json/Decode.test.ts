import test from 'ava';

import {
    Err,
    Ok
} from '../../src/Result';
import {
    decodeValue,
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

test.todo('Json.Decode.nullable');

test.todo('Json.Decode.list');

test.todo('Json.Decode.dict');

test.todo('Json.Decode.keyValuePairs');

test('Json.Decode.field', t => {
    const decoder = Decode.field('foo', Decode.string);

    t.deepEqual(
        decodeValue(decoder, null),
        Err('Value `null` is not an object.')
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

test.todo('Json.Decode.at');

test.todo('Json.Decode.index');

test.todo('Json.Decode.maybe');

test.todo('Json.Decode.oneOf');

test.todo('Json.Decode.value');

test.todo('Json.Decode.nil');

test.todo('Json.Decode.succeed');

test.todo('Json.Decode.fail');

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

test.todo('Json.Decode.map5');

test.todo('Json.Decode.map6');

test.todo('Json.Decode.map7');

test.todo('Json.Decode.map8');

test.todo('Json.Decode.andThen');

test.todo('Json.Decode.decodeString');

test.todo('Json.Decode.fromResult');

