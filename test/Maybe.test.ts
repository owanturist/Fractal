import test from 'ava';

import Maybe, { Nothing, Just } from '../src/Maybe';
import Either from '../src/Either';

test('Maybe.fromNullable()', t => {
    const _1 /* Maybe<never> */ = Maybe.fromNullable(undefined);
    const _2 /* Maybe<never> */ = Maybe.fromNullable(null);
    const _3 /* Maybe<number> */ = Maybe.fromNullable(0);
    const _4 /* Maybe<string> */ = Maybe.fromNullable('str');
    const _5 /* Maybe<boolean> */ = Maybe.fromNullable(true);
    const _6: /* cast */ Maybe<number> = Maybe.fromNullable(null);
    const _7: /* cast */ Maybe<boolean> = Maybe.fromNullable(null);

    t.deepEqual(_1, Nothing);
    t.deepEqual(_2, Nothing);
    t.deepEqual(_3, Just(0));
    t.deepEqual(_4, Just('str'));
    t.deepEqual(_5, Just(true));
    t.deepEqual(_6, Nothing);
    t.deepEqual(_7, Nothing);
});

test('Maybe.fromEither()', t => {
    const _1 /* Maybe<never> */ = Maybe.fromEither(Either.Left('err'));
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<number> */ = Maybe.fromEither(Either.Right(1));
    t.deepEqual(_2, Just(1));
});

test('Maybe.join()', t => {
    const _1 /* Maybe<never> */ = Maybe.join(Nothing);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<never> */  = Maybe.join(Just(Nothing));
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<number> */ = Maybe.join(Just(Just(1)));
    t.deepEqual(_3, Just(1));
});

test('Maybe.shape()', t => {
    const _1 /* Maybe<{}> */  = Maybe.shape({});
    t.deepEqual(_1, Just({}));

    const _2 /* Maybe<{
        foo: never;
    }> */ = Maybe.shape({
        foo: Nothing
    });
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<{
        foo: number;
    }> */ = Maybe.shape({
        foo: Just(1)
    });
    t.deepEqual(
        _3,
        Just({
            foo: 1
        })
    );

    const _4 /* Maybe<{
        foo: never;
        bar: never;
    }> */ = Maybe.shape({
        foo: Nothing,
        bar: Nothing
    });
    t.deepEqual(_4, Nothing);

    const _5 /* Maybe<{
        foo: never;
        bar: number;
    }> */ = Maybe.shape({
        foo: Nothing,
        bar: Just(1)
    });
    t.deepEqual(_5, Nothing);

    const _6 /* Maybe<{
        foo: number;
        bar: never;
    }> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Nothing
    });
    t.deepEqual(_6, Nothing);

    const _7 /* Maybe<{
        foo: string;
        bar: number;
    }> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Just(1)
    });
    t.deepEqual(
        _7,
        Just({
            foo: 'foo',
            bar: 1
        })
    );

    const _8 /* Maybe<never> */ = Maybe.shape({
        foo: Nothing,
        bar: Just(1)
    }).map(obj => obj.foo);
    t.deepEqual(_8, Nothing);

    const _9 /* Maybe<number> */ = Maybe.shape({
        foo: Nothing,
        bar: Just(1)
    }).map(obj => obj.bar);
    t.deepEqual(_9, Nothing);

    const _10 /* Maybe<string> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Just(1)
    }).map(obj => obj.foo);
    t.deepEqual(_10, Just('foo'));

    const _11 /* Maybe<number> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Just(1)
    }).map(obj => obj.bar);
    t.deepEqual(_11, Just(1));

    const _12 /* Maybe<{
        foo: string;
        bar: {
            baz: never;
        };
    }> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Maybe.shape({
            baz: Nothing
        })
    });
    t.deepEqual(_12, Nothing);

    const _13 /* Maybe<{
        foo: string;
        bar: {
            baz: number;
    }> */ = Maybe.shape({
        foo: Just('foo'),
        bar: Maybe.shape({
            baz: Just(1)
        })
    });
    t.deepEqual(
        _13,
        Just({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});

test('Maybe.combine()', t => {
    const _1 /* Maybe<never[]> */ = Maybe.combine([]);
    t.deepEqual(_1, Just([]));

    const _2 /* Maybe<never[]> */ = Maybe.combine([ Nothing ]);
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<number[]> */ = Maybe.combine([ Just(1) ]);
    t.deepEqual(_3, Just([ 1 ]));

    const _4 /* Maybe<never[]> */ = Maybe.combine([ Nothing, Nothing ]);
    t.deepEqual(_4, Nothing);

    const _5 /* Maybe<number[]> */ = Maybe.combine([ Nothing, Just(2) ]);
    t.deepEqual(_5, Nothing);

    const _6 /* Maybe<number[]> */ = Maybe.combine([ Just(1), Nothing ]);
    t.deepEqual(_6, Nothing);

    const _7 /* Maybe<number[]> */ = Maybe.combine([ Just(1), Just(2) ]);

    t.deepEqual(_7, Just([ 1, 2 ]));
});

test('Maybe.values()', t => {
    const _1 /* never[] */ = Maybe.values([]);
    t.deepEqual(_1, []);

    const _2 /* never[] */ = Maybe.values([ Nothing ]);
    t.deepEqual(_2, []);

    const _3 /* number[] */ = Maybe.values([ Just(1) ]);
    t.deepEqual(_3, [ 1 ]);

    const _4 /* never[] */ = Maybe.values([ Nothing, Nothing ]);
    t.deepEqual(_4, []);

    const _5 /* number[] */ = Maybe.values([ Nothing, Just(2) ]);
    t.deepEqual(_5, [ 2 ]);

    const _6 /* number[] */ = Maybe.values([ Just(1), Nothing ]);
    t.deepEqual(_6, [ 1 ]);

    const _7 /* number[] */ = Maybe.values([ Just(1), Just(2) ]);
    t.deepEqual(_7, [ 1, 2 ]);
});

test('Maybe.prototype.isNothing()', t => {
    t.true(Nothing.isNothing());

    t.false(Just(1).isNothing());
});

test('Maybe.prototype.isJust()', t => {
    t.false(Nothing.isJust());

    t.true(Just(1).isJust());
});

test('Maybe.prototype.isEqual()', t => {
    t.false(
        Just(1).isEqual(Nothing)
    );

    t.false(
        Nothing.isEqual(Just(1))
    );

    t.false(
        Just(1).isEqual(Just(0))
    );

    t.false(
        Just([]).isEqual(Just([]))
    );

    t.true(
        Just(1).isEqual(Just(1))
    );

    t.true(
        Nothing.isEqual(Nothing)
    );
});

test('Maybe.prototype.map()', t => {
    const _1 /* Maybe<boolean> */ = Nothing.map((a: number) => a > 0);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<boolean> */ = Just(1).map(a => a > 0);
    t.deepEqual(_2, Just(true));
});

test('Maybe.prototype.chain()', t => {
    const _1 /* Maybe<never> */ = Nothing.chain(() => Nothing);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<never> */ = Just(1).chain(() => Nothing);
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<boolean> */ = Nothing.chain((a: number) => Just(a > 0));
    t.deepEqual(_3, Nothing);

    const _4 /* Maybe<boolean> */ = Just(1).chain(a => Just(a > 0));
    t.deepEqual(_4, Just(true));
});

test('Maybe.prototype.filter()', t => {
    const isEven = (a: number) => a % 2 === 0;

    const _1 /* Maybe<number> */ = Nothing.filter(isEven);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<number> */ = Just(1).filter(isEven);
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<number> */ = Just(2).filter(isEven);
    t.deepEqual(_3, Just(2));
});

test('Maybe.prototype.ap()', t => {
    const _1 /* Maybe<never> */ = Nothing.ap(Nothing);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<boolean> */ = Nothing.ap(Just((a: number) => a > 0));
    t.deepEqual(_2, Nothing);

    const _3 /* Maybe<never> */ = Just(0).ap(Nothing);
    t.deepEqual(_3, Nothing);

    const _4 /* Maybe<boolean> */ = Just(1).ap(Just((a: number) => a > 0));
    t.deepEqual(_4, Just(true));
});

test('Maybe.prototype.orElse()', t => {
    const _1 /* Maybe<never> */ = Nothing.orElse(() => Nothing);
    t.deepEqual(_1, Nothing);

    const _2 /* Maybe<number> */ = Just(1).orElse(() => Nothing);
    t.deepEqual(_2, Just(1));

    const _3 /* Maybe<number> */ = Nothing.orElse(() => Just(2));
    t.deepEqual(_3, Just(2));

    const _4 /* Maybe<number> */ = Just(1).orElse(() => Just(2));
    t.deepEqual(_4, Just(1));
});

test('Maybe.prototype.getOrElse()', t => {
    const _1 /* number */ = Nothing.getOrElse(0);
    t.is(_1, 0);

    const _2 /* number */ = Just(1).getOrElse(0);
    t.is(_2, 1);
});

test('Maybe.prototype.fold()', t => {
    const _1 /* boolean */ = Nothing.fold(
        () => false,
        (a: number) => a > 0
    );
    t.is(_1, false);

    const _2 /* boolean */ = Just(1).fold(
        () => false,
        a => a > 0
    );
    t.is(_2, true);
});

test('Maybe.prototype.cata()', t => {
    const _1 /* number */ = Nothing.cata({
        _: () => -1
    });
    t.is(_1, -1);

    const _2 /* number */ = Just(2).cata({
        _: () => -1
    });
    t.is(_2, -1);

    const _3 /* number */ = Nothing.cata({
        _: () => -1,
        Nothing: () => 0
    });
    t.is(_3, 0);

    const _4 /* number */ = Just(2).cata({
        _: () => -1,
        Nothing: () => 0
    });
    t.is(_4, -1);

    const _5 /* number */ = Nothing.cata({
        _: () => -1,
        Just: (a: number) => a * 10
    });
    t.is(_5, -1);

    const _6 /* number */ = Just(2).cata({
        _: () => -1,
        Just: a => a * 10
    });
    t.is(_6, 20);

    const _7 /* number */ = Nothing.cata({
        Nothing: () => 0,
        Just: (a: number) => a * 10
    });
    t.is(_7, 0);

    const _8 /* number */ = Just(2).cata({
        Nothing: () => 0,
        Just: a => a * 10
    });
    t.is(_8, 20);
});

test('Maybe.prototype.tap()', t => {
    const someFuncHandeMaybe = (maybeNumber: Maybe<number>): string => {
        return maybeNumber.map(num => num * 2 + '_').getOrElse('_');
    };

    t.is(
        Nothing
            .orElse(() => Just(20))
            .map(a => a * a)
            .tap(someFuncHandeMaybe)
            .replace('_', '|')
            .trim(),

        someFuncHandeMaybe(
            Nothing
                .orElse(() => Just(20))
                .map(a => a * a)
        )
        .replace('_', '|')
        .trim()
    );

    t.is(
        Just(1)
            .map(a => a - 1)
            .chain(a => a > 0 ? Just(a) : Nothing)
            .tap(someFuncHandeMaybe)
            .repeat(10)
            .trim(),

        someFuncHandeMaybe(
            Just(1)
            .map(a => a - 1)
            .chain(a => a > 0 ? Just(a) : Nothing)
        )
        .repeat(10)
        .trim()
    );

    t.deepEqual(
        Nothing.tap(Maybe.join),
        Nothing
    );

    t.deepEqual(
        Just(1).tap(Just).tap(Maybe.join),
        Just(1)
    );
});

test('Maybe.prototype.toEither()', t => {
    const _1 /* Either<string, never> */ = Nothing.toEither('err');
    t.deepEqual(_1, Either.Left('err'));

    const _2 /* Either<string, number> */ = Just(1).toEither('err');
    t.deepEqual(_2, Either.Right(1));
});
