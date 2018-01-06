import test from 'ava';

import {
    Nothing,
    Just
} from '../src/Maybe';
import {
    Either,
    Left,
    Right
} from '../src/Either';

// CONSTRUCTING

test('Either.fromNullable()', t => {
    t.deepEqual(
        Either.fromNullable('err', undefined),
        Left('err')
    );

    t.deepEqual(
        Either.fromNullable('err', null),
        Left('err')
    );

    t.deepEqual(
        Either.fromNullable('err', 0),
        Right(0)
    );

    t.deepEqual(
        Either.fromNullable('err', ''),
        Right('')
    );
});

test('Either.fromMaybe()', t => {
    t.deepEqual(
        Either.fromMaybe('err', Nothing),
        Left('err')
    );

    t.deepEqual(
        Either.fromMaybe('err', Just(0)),
        Right(0)
    );
});

// COMPARING

test('Either.isLeft', t => {
    t.true(Left('err').isLeft);

    t.false(Right(1).isLeft);
});

test('Either.isRight', t => {
    t.false(Left('err').isRight);

    t.true(Right(1).isRight);
});

test('Either.isEqual()', t => {
    t.true(
        Left('err').isEqual(Left('err'))
    );

    t.false(
        Left('err').isEqual(Right(1))
    );

    t.false(
        Right(1).isEqual(Left('err'))
    );

    t.false(
        Right(1).isEqual(Right(2))
    );

    t.false(
        Right([]).isEqual(Right([]))
    );

    t.true(
        Right(1).isEqual(Right(1))
    );
});

// EXTRACTING

test('Either.getOrElse()', t => {
    t.is(
        Left('err').getOrElse(1),
        1
    );

    t.is(
        Right(2).getOrElse(1),
        2
    );
});

// TRANSFORMING

test('Either.map()', t => {
    t.deepEqual(
        Left('err').map(a => a * 2),
        Left('err')
    );

    t.deepEqual(
        Right(3).map(a => a * 2),
        Right(6)
    );
});

test('Either.chain()', t => {
    t.deepEqual(
        Left('err').chain(() => Left('err')),
        Left('err')
    );

    t.deepEqual(
        Right(1).chain(() => Left('err')),
        Left('err')
    );

    t.deepEqual(
        Left('err').chain(a => Right(a * 3)),
        Left('err')
    );

    t.deepEqual(
        Right(1).chain(a => Right(a * 3)),
        Right(3)
    );
});

test('Either.fold()', t => {
    t.deepEqual(
        Left('err').fold(err => err + '_', a => '_' + a),
        'err_'
    );

    t.deepEqual(
        Right(1).fold(err => err + '_', a => '_' + a),
        '_1'
    );
});

test('Either.cata()', t => {
    t.is(
        Left('err').cata({
            Left: err => err + '_',
            Right: a => '_' + a
        }),
        'err_'
    );

    t.is(
        Right(3).cata({
            Left: err => err + '_',
            Right: a => '_' + a
        }),
        '_3'
    );
});

test('Either.swap()', t => {
    t.deepEqual(
        Left('err').swap(),
        Right('err')
    );

    t.deepEqual(
        Right(3).swap(),
        Left(3)
    );
});

test('Either.bimap()', t => {
    t.deepEqual(
        Left('err').bimap(err => err + '_', a => a * 2),
        Left('err_')
    );

    t.deepEqual(
        Right(3).bimap(err => err + '_', a => a * 2),
        Right(6)
    );
});

test('Either.leftMap()', t => {
    t.deepEqual(
        Left('err').leftMap(err => err + '_'),
        Left('err_')
    );

    t.deepEqual(
        Right(3).leftMap(err => err + '_'),
        Right(3)
    );
});

test('Either.orElse()', t => {
    t.deepEqual(
        Left('err').orElse(err => Left(err + '_')),
        Left('err_')
    );

    t.deepEqual(
        Right(1).orElse(err => Left(err + '_')),
        Right(1)
    );

    t.deepEqual(
        Left('err').orElse(() => Right(3)),
        Right(3)
    );

    t.deepEqual(
        Right(1).orElse(() => Right(3)),
        Right(1)
    );
});

test('Either.toMaybe()', t => {
    t.deepEqual(
        Left('err').toMaybe(),
        Nothing
    );

    t.deepEqual(
        Right(1).toMaybe(),
        Just(1)
    );
});

// MAPPING

test('Either.map2', t => {
    t.deepEqual(
        Either.map2(
            (a: number, b: number) => a * 2 + b,
            Left('msg1'),
            Left('msg2')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map2(
            (a: number, b) => a * 2 + b,
            Right(1),
            Left('msg2')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map2(
            (a, b) => a * 2 + b,
            Right(1),
            Right(2)
        ),
        Right(4)
    );
});

test('Either.map3', t => {Left
    t.deepEqual(
        Either.map3(
            (a: number, b: number, c: number) => a * 2 + b - c,
            Left('msg1'),
            Left('msg2'),
            Left('msg3')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map3(
            (a, b: number, c: number) => a * 2 + b - c,
            Right(1),
            Left('msg2'),
            Left('msg3')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map3(
            (a, b, c: number) => a * 2 + b - c,
            Right(1),
            Right(2),
            Left('msg3')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map3(
            (a, b, c) => a * 2 + b - c,
            Right(1),
            Right(2),
            Right(3)
        ),
        Right(1)
    );
});

test('Either.map4', t => {Left
    t.deepEqual(
        Either.map4(
            (a: number, b: number, c: number, d: number) => a * 2 + b - c * d,
            Left('msg1'),
            Left('msg2'),
            Left('msg3'),
            Left('msg4')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map4(
            (a, b: number, c: number, d: number) => a * 2 + b - c * d,
            Right(1),
            Left('msg2'),
            Left('msg3'),
            Left('msg4')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map4(
            (a, b, c: number, d: number) => a * 2 + b - c * d,
            Right(1),
            Right(2),
            Left('msg3'),
            Left('msg4')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map4(
            (a, b, c, d: number) => a * 2 + b - c * d,
            Right(1),
            Right(2),
            Right(3),
            Left('msg4')
        ),
        Left('msg4')
    );

    t.deepEqual(
        Either.map4(
            (a, b, c, d) => a * 2 + b - c * d,
            Right(1),
            Right(2),
            Right(3),
            Right(4)
        ),
        Right(-8)
    );
});

test('Either.map5', t => {Left
    t.deepEqual(
        Either.map5(
            (a: number, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Left('msg1'),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map5(
            (a, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Right(1),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map5(
            (a, b, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Right(1),
            Right(2),
            Left('msg3'),
            Left('msg4'),
            Left('msg5')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map5(
            (a, b, c, d: number, e: number) => a * 2 + b - c * d + e,
            Right(1),
            Right(2),
            Right(3),
            Left('msg4'),
            Left('msg5')
        ),
        Left('msg4')
    );

    t.deepEqual(
        Either.map5(
            (a, b, c, d, e: number) => a * 2 + b - c * d + e,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Left('msg5')
        ),
        Left('msg5')
    );

    t.deepEqual(
        Either.map5(
            (a, b, c, d, e) => a * 2 + b - c * d + e,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5)
        ),
        Right(-3)
    );
});

test('Either.map6', t => {Left
    t.deepEqual(
        Either.map6(
            (a: number, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Left('msg1'),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map6(
            (a, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Right(1),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map6(
            (a, b, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Right(1),
            Right(2),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map6(
            (a, b, c, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Right(1),
            Right(2),
            Right(3),
            Left('msg4'),
            Left('msg5'),
            Left('msg6')
        ),
        Left('msg4')
    );

    t.deepEqual(
        Either.map6(
            (a, b, c, d, e: number, f: number) => a * 2 + b - c * d + e * f,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Left('msg5'),
            Left('msg6')
        ),
        Left('msg5')
    );

    t.deepEqual(
        Either.map6(
            (a, b, c, d, e, f: number) => a * 2 + b - c * d + e * f,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Left('msg6')
        ),
        Left('msg6')
    );

    t.deepEqual(
        Either.map6(
            (a, b, c, d, e, f) => a * 2 + b - c * d + e * f,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6)
        ),
        Right(22)
    );
});

test('Either.map7', t => {
    t.deepEqual(
        Either.map7(
            (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Left('msg1'),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map7(
            (a, b: number, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Right(3),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg4')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c, d, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Left('msg5'),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg5')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c, d, e, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Left('msg6'),
            Left('msg7')
        ),
        Left('msg6')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c, d, e, f, g: number) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6),
            Left('msg7')
        ),
        Left('msg7')
    );

    t.deepEqual(
        Either.map7(
            (a, b, c, d, e, f, g) => a * 2 + b - c * d + e * f - g,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6),
            Right(7)
        ),
        Right(15)
    );
});

test('Either.map8', t => {
    t.deepEqual(
        Either.map8(
            (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Left('msg1'),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg1')
    );

    t.deepEqual(
        Either.map8(
            (a, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Left('msg2'),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg2')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Left('msg3'),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg3')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Left('msg4'),
            Left('msg5'),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg4')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Left('msg5'),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg5')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d, e, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Left('msg6'),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg6')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d, e, f, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6),
            Left('msg7'),
            Left('msg8')
        ),
        Left('msg7')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d, e, f, g, h: number) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6),
            Right(7),
            Left('msg8')
        ),
        Left('msg8')
    );

    t.deepEqual(
        Either.map8(
            (a, b, c, d, e, f, g, h) => a * 2 + b - c * d + e * f - g * h,
            Right(1),
            Right(2),
            Right(3),
            Right(4),
            Right(5),
            Right(6),
            Right(7),
            Right(8)
        ),
        Right(-34)
    );
});
