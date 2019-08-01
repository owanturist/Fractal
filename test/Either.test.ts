import test from 'ava';

import Maybe from '../src/Maybe';
import Either, { Left, Right } from '../src/Either';

test('Either.fromNullable()', t => {
    const _1 /* Either<string, never> */ = Either.fromNullable('err', undefined);
    t.deepEqual(_1, Left('err'));

    const _2 /* Either<string, never> */ = Either.fromNullable('err', null);
    t.deepEqual(_2, Left('err'));

    const _3 /* Either<string, number> */ = Either.fromNullable('err', 0);
    t.deepEqual(_3, Right(0));

    const _4 /* Either<string, string> */ = Either.fromNullable('err', 'str');
    t.deepEqual(_4, Right('str'));

    const _5 /* Either<string, boolean> */ = Either.fromNullable('err', true);
    t.deepEqual(_5, Right(true));

    const _6: /* cast */ Either<string, number> = Either.fromNullable('err', null);
    t.deepEqual(_6, Left('err'));

    const _7: /* cast */ Either<string, boolean> = Either.fromNullable('err', null);
    t.deepEqual(_7, Left('err'));
});

test('Either.fromMaybe()', t => {
    const _1 /* Either<string, never> */ = Either.fromMaybe('err', Maybe.Nothing);
    t.deepEqual(_1, Left('err'));

    const _2 /* Either<string, number> */ = Either.fromMaybe('err', Maybe.Just(1));
    t.deepEqual(_2, Right(1));

    const _3: /* cast */ Either<string, number> = Either.fromMaybe('err', Maybe.Nothing);
    t.deepEqual(_3, Left('err'));
});

test('Either.props()', t => {
    const _1 /* Either<never, {}> */ = Either.props({});
    t.deepEqual(_1, Right({}));

    const _2 /* Either<string, {
        foo: never;
    }> */ = Either.props({
        foo: Left('err')
    });
    t.deepEqual(_2, Left('err'));

    const _3 /* Either<never, {
        foo: number;
    }> */ = Either.props({
        foo: Right(1)
    });
    t.deepEqual(
        _3,
        Right({
            foo: 1
        })
    );

    const _4 /* Either<string, {
        foo: never;
        bar: never;
    }> */ = Either.props({
        foo: Left('err1'),
        bar: Left(1)
    });
    t.deepEqual(_4, Left('err1'));

    const _5 /* Either<string, {
        foo: never;
        bar: number;
    }> */ = Either.props({
        foo: Left('err'),
        bar: Right(1)
    });
    t.deepEqual(_5, Left('err'));

    const _6 /* Either<string, {
        foo: number;
        bar: never;
    }> */ = Either.props({
        foo: Right(1),
        bar: Left('err')
    });
    t.deepEqual(_6, Left('err'));

    const _7 /* Either<never, {
        foo: string;
        bar: number;
    }> */ = Either.props({
        foo: Right('foo'),
        bar: Right(1)
    });
    t.deepEqual(
        _7,
        Right({
            foo: 'foo',
            bar: 1
        })
    );

    const _8 /* Either<string, never> */ = Either.props({
        foo: Left('err'),
        bar: Right(1)
    }).map(obj => obj.foo);
    t.deepEqual(_8, Left('err'));

    const _9 /* Either<string, number> */ = Either.props({
        foo: Left('err'),
        bar: Right(1)
    }).map(obj => obj.bar);
    t.deepEqual(_9, Left('err'));

    const _10 /* Either<never, string> */ = Either.props({
        foo: Right('foo'),
        bar: Right(1)
    }).map(obj => obj.foo);
    t.deepEqual(_10, Right('foo'));

    const _11 /* Either<never, number> */ = Either.props({
        foo: Right('foo'),
        bar: Right(1)
    }).map(obj => obj.bar);
    t.deepEqual(_11, Right(1));

    const _12 /* Either<string, {
        foo: string;
        bar: {
            baz: never;
        };
    }> */ = Either.props({
        foo: Right('foo'),
        bar: Either.props({
            baz: Left('err')
        })
    });
    t.deepEqual(_12, Left('err'));

    const _13 /* Either<never, {
        foo: string;
        bar: {
            baz: number;
        };
    }> */ = Either.props({
        foo: Right('foo'),
        bar: Either.props({
            baz: Right(1)
        })
    });
    t.deepEqual(
        _13,
        Right({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});

test('Either.combine()', t => {
    const _1 /* Either<never, never[]> */ = Either.combine([]);
    t.deepEqual(_1, Right([]));

    const _2 /* Either<string, never[]> */ = Either.combine([ Left('1') ]);
    t.deepEqual(_2, Left('1'));

    const _3 /* Either<never, number[]> */ = Either.combine([ Right(1) ]);
    t.deepEqual(_3, Right([ 1 ]));

    const _4 /* Either<string, never[]> */ = Either.combine([ Left('1'), Left('') ]);
    t.deepEqual(_4, Left('1'));

    const _5 /* Either<string, number[]> */ = Either.combine([ Left('1'), Right(2) ]);
    t.deepEqual(_5, Left('1'));

    const _6 /* Either<string, number[]> */ = Either.combine([ Right(1), Left('2') ]);
    t.deepEqual(_6, Left('2'));

    const _7 /* Either<never, number[]> */ = Either.combine([ Right(1), Right(2) ]);
    t.deepEqual(_7, Right([ 1, 2 ]));
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
    const _1 /* Either<string, boolean> */ = Left('err').map((a: number) => a > 0);
    t.deepEqual(_1, Left('err'));

    const _2 /* Either<never, boolean> */ = Right(1).map(a => a > 0);
    t.deepEqual(_2, Right(true));
});

test('Either.prototype.chain()', t => {
    const _1 /* Either<string, never> */ = Left('err1').chain(() => Left('err2'));
    t.deepEqual(_1, Left('err1'));

    const _2 /* Either<string, number> */ = Right(1).chain(() => Left('err'));
    t.deepEqual(_2, Left('err'));

    const _3 /* Either<string, boolean> */ = Left('err').chain(a => Right(a > 0));
    t.deepEqual(_3, Left('err'));

    const _4 /* Either<never, boolean> */ = Right(1).chain(a => Right(a > 0));
    t.deepEqual(_4, Right(true));
});

test('Either.prototype.ap()', t => {
    const _1 /* Either<string, never> */ = Left('1').ap(Left('2'));
    t.deepEqual(_1, Left('1'));

    const _2 /* Either<string, boolean> */ = Left('1').ap(Right((a: number) => a > 0));
    t.deepEqual(_2, Left('1'));

    const _3 /* Either<string, number> */ = Right(1).ap(Left('1'));
    t.deepEqual(_3, Left('1'));

    const _4 /* Either<never, boolean> */ = Right(1).ap(Right((a: number) => a > 0));
    t.deepEqual(_4, Right(true));
});

test('Either.prototype.pipe()', t => {
    const fnLeft: Either<string, (a: number) => string> = Left('_err_');
    const fnRight = Right((a: number) => a > 0);

    const _1 /* Either<string, string> */ = fnLeft.pipe(Left('err1'));
    t.deepEqual(_1, Left('_err_'));

    const _2 /* Either<string, string> */ = fnLeft.pipe(Right(2));
    t.deepEqual(_2, Left('_err_'));

    const _3 /* Either<string, boolean> */ = fnRight.pipe(Left('err1'));
    t.deepEqual(_3, Left('err1'));

    const _4 /* Either<never, boolean> */ = fnRight.pipe(Right(2));
    t.deepEqual(_4, Right(true));

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

    const _5 /* Either<string, boolean> */ = Either.fromNullable('err', (a: number) => a > 0).pipe(Right(2));
    t.deepEqual(_5, Right(true), 'Either.fromNullable is piping');

    const _6 /* Either<string, boolean> */ = Either.fromMaybe('err', Maybe.Just((a: number) => a > 0)).pipe(Right(-2));
    t.deepEqual(_6, Right(false), 'Either.fromMaybe is piping');

    const _7 /* Either<never, boolean> */  = Right(2).map(a => (b: number) => a - b > 0).pipe(Right(3));
    t.deepEqual(_7, Right(false), 'Either.prototype.map is piping');

    const _8 /* Either<never, boolean> */ = Right(2).chain(a => Right((b: number) => a > b)).pipe(Right(3));
    t.deepEqual(_8, Right(false), 'Either.prototype.chain is piping');

    const _9 /* Either<never, boolean> */ = Right(4).ap(Right((a: number) => (b: number) => a > b)).pipe(Right(3));
    t.deepEqual(_9, Right(true), 'Either.prototype.ap is piping');
});

test('Either.prototype.mapBoth()', t => {
    const _1 /* Either<boolean, boolean> */ = Left('err').mapBoth(err => err === 'err', (a: number) => a > 0);
    t.deepEqual(_1, Left(true));

    const _2 /* Either<string, boolean> */ = Right(1).mapBoth((err: string) => err + '_', a => a > 0);
    t.deepEqual(_2, Right(true));
});

test('Either.prototype.swap()', t => {
    const _1 /* Either<never, string> */ = Left('err').swap();
    t.deepEqual(_1, Right('err'));

    const _2 /* Either<number, never> */ = Right(1).swap();
    t.deepEqual(_2, Left(1));

    const _3 /* Either<number, string> */ = Right(1).orElse(() => Left('err')).swap();
    t.deepEqual(_3, Left(1));
});

test('Either.prototype.mapLeft()', t => {
    const _1 /* Either<boolean, never> */ = Left('err').mapLeft(err => err === 'err');
    t.deepEqual(_1, Left(true));

    const _2 /* Either<boolean, number> */ = Right(1).mapLeft((err: string) => err === 'err');
    t.deepEqual(_2, Right(1));
});

test('Either.prototype.orElse()', t => {
    const _1 /* Either<string, never> */ = Left('err').orElse(err => Left(err + '_'));
    t.deepEqual(_1, Left('err_'));

    const _2 /* Either<string, number> */ = Right(1).orElse((err: string) => Left(err + '_'));
    t.deepEqual(_2, Right(1));

    const _3 /* Either<string, number> */ = Left('err').orElse(() => Right(1));
    t.deepEqual(_3, Right(1));

    const _4 /* Either<never, number> */ = Right(1).orElse(() => Right(2));
    t.deepEqual(_4, Right(1));
});

test('Either.prototype.getOrElse()', t => {
    const _1 /* number */ = Left('err').getOrElse(1 * 1);
    t.is(_1, 1);

    const _2 /* number */ = Right(2).getOrElse(1);
    t.is(_2, 2);
});

test('Either.prototype.fold()', t => {
    const _1 /* string */ = Left('err').fold(err => err + '_', (a: number) => '_' + a * 2);
    t.deepEqual(_1, 'err_');

    const _2 /* string */ = Right(2).fold(err => err + '_', (a: number) => '_' + a * 2);
    t.deepEqual(_2, '_4');
});

test('Either.prototype.cata()', t => {
    const _1 /* string */ = Left('err').cata({
        Left: err => err + '_',
        Right: (a: number) => '_' + a * 2
    });
    t.is(_1, 'err_');

    const _2 /* string */ = Right(2).cata({
        Left: (err: string) => err + '_',
        Right: a => '_' + a * 2
    });
    t.is(_2, '_4');
});

test('Either.prototype.toMaybe()', t => {
    const _1 /* Maybe<never> */ = Left('err').toMaybe();
    t.deepEqual(_1, Maybe.Nothing);

    const _2 /* Maybe<number> */ = Right(1).toMaybe();
    t.deepEqual(_2, Maybe.Just(1));
});
