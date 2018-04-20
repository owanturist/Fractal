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
import {
    Record
} from '../src/Record';
import {
    List
} from '../src/List';

test('Either.fromNullable()', t => {
    const e1: Either<string, number> = Either.fromNullable('err', undefined);
    const e2: Either<string, boolean> = Either.fromNullable('err', null);
    const e3: Either<string, number> = Either.fromNullable('err', 0);
    const e4: Either<string, string> = Either.fromNullable('err', 'str');
    const e5: Either<string, boolean> = Either.fromNullable('err', true);

    t.deepEqual(e1, Left('err'));
    t.deepEqual(e2, Left('err'));
    t.deepEqual(e3, Right(0));
    t.deepEqual(e4, Right('str'));
    t.deepEqual(e5, Right(true));
});

test('Either.fromMaybe()', t => {
    t.deepEqual(
        Either.fromMaybe('err', Nothing()),
        Left('err')
    );

    t.deepEqual(
        Either.fromMaybe('err', Just(1)),
        Right(1)
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

    t.deepEqual(
        Either.props(Record.of({
            foo: Right('foo'),
            bar: Either.props({
                baz: Right(1)
            })
        })),
        Right({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});

test('Either.all()', t => {
    t.deepEqual(
        Either.all([]),
        Right(List.empty())
    );

    t.deepEqual(
        Either.all([ Left('1') ]),
        Left('1')
    );

    t.deepEqual(
        Either.all([ Right(1) ]),
        Right(List.singleton(1))
    );

    t.deepEqual(
        Either.all([ Left('1'), Left('2') ]),
        Left('1')
    );

    t.deepEqual(
        Either.all([ Left('1'), Right(2) ]),
        Left('1')
    );

    t.deepEqual(
        Either.all([ Right(1), Left('2') ]),
        Left('2')
    );

    const array = [ Right(1), Right(2) ];

    t.deepEqual(
        Either.all(array),
        Right(List.of(1, 2))
    );

    t.deepEqual(
        array,
        [ Right(1), Right(2) ],
        'checking of Array immutability'
    );

    const list = List.of(Right(1), Right(2));

    t.deepEqual(
        Either.all(list),
        Right(List.of(1, 2))
    );

    t.deepEqual(
        list,
        List.of(Right(1), Right(2)),
        'checking of List immutability'
    );
});

test('Either.prototype.isLeft()', t => {
    t.true(Left('err').isLeft());

    t.false(Right(1).isLeft());
});

test('Either.prototype.isRight()', t => {
    t.false(Left('err').isRight());

    t.true(Right(1).isRight());
});

test('Either.prototype.isEqual()', t => {
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

test('Either.prototype.getOrElse()', t => {
    t.is(
        Left('err').getOrElse(1),
        1
    );

    t.is(
        Right(2).getOrElse(1),
        2
    );
});

test('Either.prototype.ap()', t => {
    t.deepEqual(
        Left('1').ap(Left('2')),
        Left('1')
    );

    t.deepEqual(
        Left<string, number>('1').ap(Right((a: number) => a * 2)),
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

test('Either.prototype.map()', t => {
    t.deepEqual(
        Left<string, number>('err').map(a => a * 2),
        Left('err')
    );

    t.deepEqual(
        Right(1).map(a => a * 2),
        Right(2)
    );

    interface Foo {
        bar: Either<string, number>;
    }

    const foo: Foo = {
        bar: Left('err')
    };

    t.deepEqual(
        foo.bar.map(a => a * 2),
        Left('err')
    );
});

test('Either.prototype.chain()', t => {
    t.deepEqual(
        Left('err').chain(() => Left('err')),
        Left('err')
    );

    t.deepEqual(
        Right(1).chain(() => Left('err')),
        Left('err')
    );

    t.deepEqual(
        Left<string, number>('err').chain(a => Right(a * 2)),
        Left('err')
    );

    t.deepEqual(
        Right(1).chain(a => Right(a * 2)),
        Right(2)
    );
});

test('Either.prototype.bimap()', t => {
    t.deepEqual(
        Left<string, number>('err').bimap(err => err + '_', a => a * 2),
        Left('err_')
    );

    t.deepEqual(
        Right<string, number>(1).bimap(err => err + '_', a => a * 2),
        Right(2)
    );
});

test('Either.prototype.swap()', t => {
    t.deepEqual(
        Left('err').swap(),
        Right('err')
    );

    t.deepEqual(
        Right(1).swap(),
        Left(1)
    );
});

test('Either.prototype.leftMap()', t => {
    t.deepEqual(
        Left('err').leftMap(err => err + '_'),
        Left('err_')
    );

    t.deepEqual(
        Right<string, number>(1).leftMap(err => err + '_'),
        Right(1)
    );
});

test('Either.prototype.orElse()', t => {
    t.deepEqual(
        Left('err').orElse(err => Left(err + '_')),
        Left('err_')
    );

    t.deepEqual(
        Right<string, number>(1).orElse(err => Left(err + '_')),
        Right(1)
    );

    t.deepEqual(
        Left('err').orElse(() => Right(1)),
        Right(1)
    );

    t.deepEqual(
        Right(1).orElse(() => Right(2)),
        Right(1)
    );
});

test('Either.prototype.fold()', t => {
    t.deepEqual(
        Left<string, number>('err').fold(err => err + '_', a => '_' + a.toString()),
        'err_'
    );

    t.deepEqual(
        Right<string, number>(1).fold(err => err + '_', a => '_' + a.toString()),
        '_1'
    );
});

test('Either.prototype.cata()', t => {
    t.is(
        Left<string, number>('err').cata({
            Left: err => err + '_',
            Right: a => '_' + a.toString()
        }),
        'err_'
    );

    t.is(
        Right<string, number>(1).cata({
            Left: err => err + '_',
            Right: a => '_' + a.toString()
        }),
        '_1'
    );
});

test('Either.prototype.toMaybe()', t => {
    t.deepEqual(
        Left('err').toMaybe(),
        Nothing()
    );

    t.deepEqual(
        Right(1).toMaybe(),
        Just(1)
    );
});
