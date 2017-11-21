import test from 'ava';

import {
    Err,
    Ok
} from '../../src/Result';
import * as Decode from '../../src/Json/Decode';

test('Json.Decode.string', t => {
    t.deepEqual(
        Decode.decodeValue(
            Decode.string,
            1
        ),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        Decode.decodeValue(
            Decode.string,
            'str'
        ),
        Ok('str')
    );
});

test('Json.Decode.bool', t => {
    t.deepEqual(
        Decode.decodeValue(
            Decode.bool,
            1
        ),
        Err('Value `1` is not a bool.')
    );

    t.deepEqual(
        Decode.decodeValue(
            Decode.bool,
            false
        ),
        Ok(false)
    );
});

test('Json.Decode.number', t => {
    t.deepEqual(
        Decode.decodeValue(
            Decode.number,
            'str'
        ),
        Err('Value `"str"` is not a number.')
    );

    t.deepEqual(
        Decode.decodeValue(
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
        Decode.decodeValue(decoder, null),
        Err('Value `null` is not an object.')
    );

    t.deepEqual(
        Decode.decodeValue(decoder, { bar: 'str' }),
        Err('Field `foo` doesn\'t exist in an object {"bar":"str"}.')
    );

    t.deepEqual(
        Decode.decodeValue(decoder, { foo: 1 }),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        Decode.decodeValue(decoder, { foo: 'str' }),
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
        Decode.decodeValue(decoder, 1),
        Err('Value `1` is not a string.')
    );

    t.deepEqual(
        Decode.decodeValue(decoder, 'str'),
        Ok({
            t1: 'str'
        })
    );
});

test.todo('Json.Decode.map2');

test.todo('Json.Decode.map3');

test.todo('Json.Decode.map4');

test.todo('Json.Decode.map5');

test.todo('Json.Decode.map6');

test.todo('Json.Decode.map7');

test.todo('Json.Decode.map8');

test.todo('Json.Decode.andThen');

test.todo('Json.Decode.decodeString');

test.todo('Json.Decode.fromResult');

