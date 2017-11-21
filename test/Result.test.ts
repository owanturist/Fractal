import test from 'ava';

import {
    Nothing,
    Just
} from '../src/Maybe';
import {
    Result,
    Err,
    Ok
} from '../src/Result';

test('Result.map', t => {
    t.deepEqual(
        Result.map((a: number) => a * 2, Err('msg')),
        Err('msg')
    );

    t.deepEqual(
        Result.map(a => a * 2, Ok(3)),
        Ok(6)
    );
});

test('Result.map2', t => {
    t.deepEqual(
        Result.map2(
            (a: number, b: number) => a * 2 + b,
            Err('msg1'),
            Err('msg2')
        ),
        Err('msg1')
    );

    t.deepEqual(
        Result.map2(
            (a: number, b) => a * 2 + b,
            Ok(1),
            Err('msg2')
        ),
        Err('msg2')
    );

    t.deepEqual(
        Result.map2(
            (a, b) => a * 2 + b,
            Ok(1),
            Ok(2)
        ),
        Ok(4)
    );
});

test('Result.map3', t => {
    t.deepEqual(
        Result.map3(
            (a: number, b: number, c: number) => a * 2 + b - c,
            Err('msg1'),
            Err('msg2'),
            Err('msg3')
        ),
        Err('msg1')
    );

    t.deepEqual(
        Result.map3(
            (a, b: number, c: number) => a * 2 + b - c,
            Ok(1),
            Err('msg2'),
            Err('msg3')
        ),
        Err('msg2')
    );

    t.deepEqual(
        Result.map3(
            (a, b, c: number) => a * 2 + b - c,
            Ok(1),
            Ok(2),
            Err('msg3')
        ),
        Err('msg3')
    );

    t.deepEqual(
        Result.map3(
            (a, b, c) => a * 2 + b - c,
            Ok(1),
            Ok(2),
            Ok(3)
        ),
        Ok(1)
    );
});

test('Result.map4', t => {
    t.deepEqual(
        Result.map4(
            (a: number, b: number, c: number, d: number) => a * 2 + b - c * d,
            Err('msg1'),
            Err('msg2'),
            Err('msg3'),
            Err('msg4')
        ),
        Err('msg1')
    );

    t.deepEqual(
        Result.map4(
            (a, b: number, c: number, d: number) => a * 2 + b - c * d,
            Ok(1),
            Err('msg2'),
            Err('msg3'),
            Err('msg4')
        ),
        Err('msg2')
    );

    t.deepEqual(
        Result.map4(
            (a, b, c: number, d: number) => a * 2 + b - c * d,
            Ok(1),
            Ok(2),
            Err('msg3'),
            Err('msg4')
        ),
        Err('msg3')
    );

    t.deepEqual(
        Result.map4(
            (a, b, c, d: number) => a * 2 + b - c * d,
            Ok(1),
            Ok(2),
            Ok(3),
            Err('msg4')
        ),
        Err('msg4')
    );

    t.deepEqual(
        Result.map4(
            (a, b, c, d) => a * 2 + b - c * d,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4)
        ),
        Ok(-8)
    );
});

test('Result.map5', t => {
    t.deepEqual(
        Result.map5(
            (a: number, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Err('msg1'),
            Err('msg2'),
            Err('msg3'),
            Err('msg4'),
            Err('msg5')
        ),
        Err('msg1')
    );

    t.deepEqual(
        Result.map5(
            (a, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Ok(1),
            Err('msg2'),
            Err('msg3'),
            Err('msg4'),
            Err('msg5')
        ),
        Err('msg2')
    );

    t.deepEqual(
        Result.map5(
            (a, b, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Ok(1),
            Ok(2),
            Err('msg3'),
            Err('msg4'),
            Err('msg5')
        ),
        Err('msg3')
    );

    t.deepEqual(
        Result.map5(
            (a, b, c, d: number, e: number) => a * 2 + b - c * d + e,
            Ok(1),
            Ok(2),
            Ok(3),
            Err('msg4'),
            Err('msg5')
        ),
        Err('msg4')
    );

    t.deepEqual(
        Result.map5(
            (a, b, c, d, e: number) => a * 2 + b - c * d + e,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4),
            Err('msg5')
        ),
        Err('msg5')
    );

    t.deepEqual(
        Result.map5(
            (a, b, c, d, e) => a * 2 + b - c * d + e,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4),
            Ok(5)
        ),
        Ok(-3)
    );
});

test('Result.map6', t => {
    t.deepEqual(
        Result.map6(
            (a: number, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Err('msg1'),
            Err('msg2'),
            Err('msg3'),
            Err('msg4'),
            Err('msg5'),
            Err('msg6'),
        ),
        Err('msg1')
    );

    t.deepEqual(
        Result.map6(
            (a, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Ok(1),
            Err('msg2'),
            Err('msg3'),
            Err('msg4'),
            Err('msg5'),
            Err('msg6'),
        ),
        Err('msg2')
    );

    t.deepEqual(
        Result.map6(
            (a, b, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Ok(1),
            Ok(2),
            Err('msg3'),
            Err('msg4'),
            Err('msg5'),
            Err('msg6'),
        ),
        Err('msg3')
    );

    t.deepEqual(
        Result.map6(
            (a, b, c, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Ok(1),
            Ok(2),
            Ok(3),
            Err('msg4'),
            Err('msg5'),
            Err('msg6'),
        ),
        Err('msg4')
    );

    t.deepEqual(
        Result.map6(
            (a, b, c, d, e: number, f: number) => a * 2 + b - c * d + e * f,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4),
            Err('msg5'),
            Err('msg6'),
        ),
        Err('msg5')
    );

    t.deepEqual(
        Result.map6(
            (a, b, c, d, e, f: number) => a * 2 + b - c * d + e * f,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4),
            Ok(5),
            Err('msg6'),
        ),
        Err('msg6')
    );

    t.deepEqual(
        Result.map6(
            (a, b, c, d, e, f) => a * 2 + b - c * d + e * f,
            Ok(1),
            Ok(2),
            Ok(3),
            Ok(4),
            Ok(5),
            Ok(6)
        ),
        Ok(22)
    );
});

test('Result.andThen', t => {
    t.deepEqual(
        Result.andThen(() => Err('msg2'), Err('msg1')),
        Err('msg1')
    );

    t.deepEqual(
        Result.andThen(() => Err('msg2'), Ok(1)),
        Err('msg2')
    );

    t.deepEqual(
        Result.andThen(a => Ok(a * 3), Err('msg1')),
        Err('msg1')
    );

    t.deepEqual(
        Result.andThen(a => Ok(a * 3), Ok(1)),
        Ok(3)
    );
});

test('Result.withDefault', t => {
    t.is(
        Result.withDefault(1, Err('msg')),
        1
    );

    t.is(
        Result.withDefault(1, Ok(2)),
        2
    );
});

test('Result.toMaybe', t => {
    t.deepEqual(
        Result.toMaybe(Err('msg')),
        Nothing
    );

    t.deepEqual(
        Result.toMaybe(Ok(1)),
        Just(1)
    );
});

test('Result.fromMaybe', t => {
    t.deepEqual(
        Result.fromMaybe('msg', Nothing),
        Err('msg')
    );

    t.deepEqual(
        Result.fromMaybe('msg', Just(1)),
        Ok(1)
    );
});

test('Result.mapError', t => {
    t.deepEqual(
        Result.mapError(msg => 'new_' + msg, Err('msg')),
        Err('new_msg')
    );

    t.deepEqual(
        Result.mapError(msg => 'new_' + msg, Ok(1)),
        Ok(1)
    );
});

test('Result.cata', t => {
    t.is(
        Result.cata({
            Err: msg => 'new_' + msg,
            Ok: value => value * 2 + 'km'
        }, Err('msg')),
        'new_msg'
    );

    t.is(
        Result.cata({
            Err: msg => 'new_' + msg,
            Ok: value => value * 2 + 'km'
        }, Ok(1)),
        '2km'
    );
});
