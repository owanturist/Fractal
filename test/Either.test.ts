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

// COMPAREING AND TESTING

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

test('Either.ap()', t => {
    t.deepEqual(
        Left('1').ap(Left('2')),
        Left('1')
    );

    t.deepEqual(
        Left('1').ap(Right((a: number) => a * 2)),
        Left('1')
    );

    t.deepEqual(
        Right(1).ap(Left('1')),
        Left('1')
    );

    t.deepEqual(
        Right(1).ap(Right((a: number) => a * 2)),
        Right(2)
    );
});

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

test('Either.props()', t => {
    t.deepEqual(
        Either.props({}),
        Right({})
    );

    t.deepEqual(
        Either.props({
            foo: Left('1')
        }),
        Left('1')
    );

    t.deepEqual(
        Either.props({
            foo: Right(1)
        }),
        Right({
            foo: 1
        })
    );

    t.deepEqual(
        Either.props({
            foo: Left('1'),
            bar: Left('2')
        }),
        Left('1')
    );

    t.deepEqual(
        Either.props({
            foo: Left('1'),
            bar: Right(1)
        }),
        Left('1')
    );

    t.deepEqual(
        Either.props({
            foo: Right(1),
            bar: Left('1')
        }),
        Left('1')
    );

    t.deepEqual(
        Either.props({
            foo: Right('foo'),
            bar: Right(1)
        }),
        Right({
            foo: 'foo',
            bar: 1
        })
    );

    t.deepEqual(
        Either.props({
            foo: Right('foo'),
            bar: Right(1)
        }).map(obj => obj.foo),
        Right('foo')
    );

    t.deepEqual(
        Either.props({
            foo: Right('foo'),
            bar: Right(1)
        }).map(obj => obj.bar),
        Right(1)
    );

    t.deepEqual(
        Either.props({
            foo: Right('foo'),
            bar: Either.props({
                baz: Left('1')
            })
        }),
        Left('1')
    );

    t.deepEqual(
        Either.props({
            foo: Right('foo'),
            bar: Either.props({
                baz: Right(1)
            })
        }),
        Right({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});
