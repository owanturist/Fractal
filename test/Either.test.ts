import test from 'ava';

import { Nothing, Just } from '../src/Maybe';
import Either, { Left, Right } from '../src/Either';

test('Either.fromNullable()', t => {
    const e1: Either<string, never> = Either.fromNullable('err', undefined);
    const e2: Either<string, never> = Either.fromNullable('err', null);
    const e3: Either<string, number> = Either.fromNullable('err', 0);
    const e4: Either<string, string> = Either.fromNullable('err', 'str');
    const e5: Either<string, boolean> = Either.fromNullable('err', true);
    const e6: Either<string, number> = Either.fromNullable('err', null);
    const e7: Either<string, boolean> = Either.fromNullable('err', null);

    t.deepEqual(e1, Left('err'));
    t.deepEqual(e2, Left('err'));
    t.deepEqual(e3, Right(0));
    t.deepEqual(e4, Right('str'));
    t.deepEqual(e5, Right(true));
    t.deepEqual(e6, Left('err'));
    t.deepEqual(e7, Left('err'));
});

test('Either.fromMaybe()', t => {
    t.deepEqual(
        Either.fromMaybe('err', Nothing),
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
            foo: Left('err')
        }),
        Left('err')
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
            foo: Left('err1'),
            bar: Left('err2')
        }),
        Left('err1')
    );

    t.deepEqual(
        Either.props({
            foo: Left('err'),
            bar: Right(1)
        }),
        Left('err')
    );

    t.deepEqual(
        Either.props({
            foo: Right(1),
            bar: Left('err')
        }),
        Left('err')
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
            foo: Left('err'),
            bar: Right(1)
        }).map(obj => obj.foo),
        Left('err')
    );

    t.deepEqual(
        Either.props({
            foo: Left('err'),
            bar: Right(1)
        }).map(obj => obj.bar),
        Left('err')
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
                baz: Left('err')
            })
        }),
        Left('err')
    );

    const shape = {
        foo: Right('foo'),
        bar: Either.props({
            baz: Right(1)
        })
    };

    t.deepEqual(
        Either.props(shape),
        Right({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );

    t.deepEqual(
        shape,
        {
            foo: Right('foo'),
            bar: Either.props({
                baz: Right(1)
            })
        }
    );
});

test('Either.combine()', t => {
    t.deepEqual(
        Either.combine([]),
        Right([])
    );

    t.deepEqual(
        Either.combine([ Left('1') ]),
        Left('1')
    );

    t.deepEqual(
        Either.combine([ Right(1) ]),
        Right([ 1 ])
    );

    t.deepEqual(
        Either.combine([ Left('1'), Left('2') ]),
        Left('1')
    );

    t.deepEqual(
        Either.combine([ Left('1'), Right(2) ]),
        Left('1')
    );

    t.deepEqual(
        Either.combine([ Right(1), Left('2') ]),
        Left('2')
    );

    const array = [ Right(1), Right(2) ];

    t.deepEqual(
        Either.combine(array),
        Right([ 1, 2 ])
    );

    t.deepEqual(
        array,
        [ Right(1), Right(2) ],
        'checking of Array immutability'
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

test('Either.prototype.map()', t => {
    t.deepEqual(
        Nothing.map(a => '_' + a * 2),
        Nothing
    );

    t.deepEqual(
        Just(1).map(a => '_' + a * 2),
        Just('_2')
    );
});

test('Either.prototype.chain()', t => {
    t.deepEqual(
        Left('err1').chain(() => Left('err2')),
        Left('err1')
    );

    t.deepEqual(
        Right(1).chain(() => Left('err')),
        Left('err')
    );

    t.deepEqual(
        Left('err').chain(a => Right('_' + a * 2)),
        Left('err')
    );

    t.deepEqual(
        Right(1).chain(a => Right('_' + a * 2)),
        Right('_2')
    );
});

test('Either.prototype.ap()', t => {
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

test('Either.prototype.pipe()', t => {
    const fnLeft: Either<string, (a: number) => string> = Left('_err_');
    const fnRight = Right((a: number) => '_' + a * 2);

    t.deepEqual(
        fnLeft.pipe(Left('err1')),
        Left('_err_')
    );

    t.deepEqual(
        fnLeft.pipe(Right(2)),
        Left('_err_')
    );

    t.deepEqual(
        fnRight.pipe(Left('err1')),
        Left('err1')
    );

    t.deepEqual(
        fnRight.pipe(Right(2)),
        Right('_4')
    );

    const trippleFnLeft: Either<string, (a: number) => (b: string) => (c: boolean) => string> = Left('_err_');
    const trippleFnRight = Right((a: number) => (b: string) => (c: boolean) => c ? b : '_' + a * 2);

    t.deepEqual(trippleFnLeft.pipe(Left('err1')).pipe(Left('err2')).pipe(Left('err3')), Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Left('err1')).pipe(Left('err2')).pipe(Right(true)),  Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Left('err1')).pipe(Right('hi')) .pipe(Left('err3')), Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Left('err1')).pipe(Right('hi')) .pipe(Right(true)),  Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Right(2))    .pipe(Left('err2')).pipe(Left('err3')), Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Right(2))    .pipe(Left('err2')).pipe(Right(true)),  Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Right(2))    .pipe(Right('hi')) .pipe(Left('err3')), Left('_err_'));
    t.deepEqual(trippleFnLeft.pipe(Right(2))    .pipe(Right('hi')) .pipe(Right(true)),  Left('_err_'));

    t.deepEqual(trippleFnRight.pipe(Left('err1')).pipe(Left('err2')).pipe(Left('err3')), Left('err1'));
    t.deepEqual(trippleFnRight.pipe(Left('err1')).pipe(Left('err2')).pipe(Right(true)),  Left('err1'));
    t.deepEqual(trippleFnRight.pipe(Left('err1')).pipe(Right('hi')) .pipe(Left('err3')), Left('err1'));
    t.deepEqual(trippleFnRight.pipe(Left('err1')).pipe(Right('hi')) .pipe(Right(true)),  Left('err1'));
    t.deepEqual(trippleFnRight.pipe(Right(2))    .pipe(Left('err2')).pipe(Left('err3')), Left('err2'));
    t.deepEqual(trippleFnRight.pipe(Right(2))    .pipe(Left('err2')).pipe(Right(true)),  Left('err2'));
    t.deepEqual(trippleFnRight.pipe(Right(2))    .pipe(Right('hi')) .pipe(Left('err3')), Left('err3'));
    t.deepEqual(trippleFnRight.pipe(Right(2))    .pipe(Right('hi')) .pipe(Right(true)),  Right('hi'));
    t.deepEqual(trippleFnRight.pipe(Right(2))    .pipe(Right('hi')) .pipe(Right(false)), Right('_4'));

    t.deepEqual(
        Either.fromNullable('err', (a: number) => '_' + a * 2).pipe(Right(2)),
        Right('_4'),
        'Either.fromNullable is piping'
    );

    t.deepEqual(
        Either.fromMaybe('err', Just((a: number) => '_' + a * 2)).pipe(Right(2)),
        Right('_4'),
        'Either.fromMaybe is piping'
    );

    t.deepEqual(
        Right(2).map(a => (b: number) => '_' + a * b).pipe(Right(3)),
        Right('_6'),
        'Either.prototype.map is piping'
    );

    t.deepEqual(
        Right(2).chain(a => Right((b: number) => '_' + a * b)).pipe(Right(3)),
        Right('_6'),
        'Either.prototype.chain is piping'
    );

    t.deepEqual(
        Right(2).ap(Right((a: number) => (b: number) => '_' + a * b)).pipe(Right(3)),
        Right('_6'),
        'Either.prototype.ap is piping'
    );
});

test('Either.prototype.mapBoth()', t => {
    t.deepEqual(
        Left('err').mapBoth(err => err === 'err', a => '_' + a * 2),
        Left(true)
    );

    t.deepEqual(
        Right(1).mapBoth(err => err + '_', a => '_' + a * 2),
        Right('_2')
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

test('Either.prototype.mapLeft()', t => {
    t.deepEqual(
        Left('err').mapLeft(err => err === 'err'),
        Left(true)
    );

    t.deepEqual(
        Right(1).mapLeft(err => err === 'err'),
        Right(1)
    );
});

test('Either.prototype.orElse()', t => {
    t.deepEqual(
        Left('err').orElse(err => Left(err + '_')),
        Left('err_')
    );

    t.deepEqual(
        Right(1).orElse(err => Left(err + '_')),
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

test('Either.prototype.fold()', t => {
    t.deepEqual(
        Left('err').fold(err => err + '_', a => '_' + a * 2),
        'err_'
    );

    t.deepEqual(
        Right(2).fold(err => err + '_', a => '_' + a * 2),
        '_4'
    );
});

test('Either.prototype.cata()', t => {
    t.is(
        Left('err').cata({
            Left: err => err + '_',
            Right: a => '_' + a * 2
        }),
        'err_'
    );

    t.is(
        Right(2).cata({
            Left: err => err + '_',
            Right: a => '_' + a * 2
        }),
        '_4'
    );
});

test('Either.prototype.toMaybe()', t => {
    t.deepEqual(
        Left('err').toMaybe(),
        Nothing
    );

    t.deepEqual(
        Right(1).toMaybe(),
        Just(1)
    );
});
