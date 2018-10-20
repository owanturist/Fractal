import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../src/Maybe';
import {
    Left,
    Right
} from '../src/Either';

test('Maybe.fromNullable()', t => {
    const m1: Maybe<void> = Maybe.fromNullable(undefined);
    const m2: Maybe<void> = Maybe.fromNullable(null);
    const m3: Maybe<number> = Maybe.fromNullable(0);
    const m4: Maybe<string> = Maybe.fromNullable('str');
    const m5: Maybe<boolean> = Maybe.fromNullable(true);
    const m6: Maybe<number> = Maybe.fromNullable(null);
    const m7: Maybe<boolean> = Maybe.fromNullable(null);

    t.deepEqual(m1, Nothing);
    t.deepEqual(m2, Nothing);
    t.deepEqual(m3, Just(0));
    t.deepEqual(m4, Just('str'));
    t.deepEqual(m5, Just(true));
    t.deepEqual(m6, Nothing);
    t.deepEqual(m7, Nothing);
});

test('Maybe.fromEither()', t => {
    t.deepEqual(
        Maybe.fromEither(Left('err')),
        Nothing
    );

    t.deepEqual(
        Maybe.fromEither(Right(1)),
        Just(1)
    );
});

test('Maybe.props()', t => {
    t.deepEqual(
        Maybe.props({}),
        Just({})
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing
        }),
        Nothing
    );

    t.deepEqual(
        Maybe.props({
            foo: Just(1)
        }),
        Just({
            foo: 1
        })
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing,
            bar: Nothing
        }),
        Nothing
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing,
            bar: Just(1)
        }),
        Nothing
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Nothing
        }),
        Nothing
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Just(1)
        }),
        Just({
            foo: 'foo',
            bar: 1
        })
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Just(1)
        }).map(obj => obj.foo),
        Just('foo')
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Just(1)
        }).map(obj => obj.bar),
        Just(1)
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Maybe.props({
                baz: Nothing
            })
        }),
        Nothing
    );

    const shape = {
        foo: Just('foo'),
        bar: Maybe.props({
            baz: Just(1)
        })
    };

    t.deepEqual(
        Maybe.props(shape),
        Just({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );

    t.deepEqual(
        shape,
        {
            foo: Just('foo'),
            bar: Maybe.props({
                baz: Just(1)
            })
        }
    );
});

test('Maybe.sequence()', t => {
    t.deepEqual(
        Maybe.sequence([]),
        Just([])
    );

    t.deepEqual(
        Maybe.sequence([ Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.sequence([ Just(1) ]),
        Just([ 1 ])
    );

    t.deepEqual(
        Maybe.sequence([ Nothing, Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.sequence([ Nothing, Just(2) ]),
        Nothing
    );

    t.deepEqual(
        Maybe.sequence([ Just(1), Nothing ]),
        Nothing
    );

    const array = [ Just(1), Just(2) ];

    t.deepEqual(
        Maybe.sequence(array),
        Just([ 1, 2 ])
    );

    t.deepEqual(
        array,
        [ Just(1), Just(2) ],
        'checking of Array immutability'
    );
});

test('Maybe.prototype.isNothing', t => {
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

test('Maybe.prototype.getOrElse()', t => {
    t.is(
        (Nothing as Maybe<number>).getOrElse(1),
        1
    );

    t.is(
        Just(0).getOrElse(1),
        0
    );
});

test('Maybe.prototype.ap()', t => {
    t.deepEqual(
        (Nothing as Maybe<number>).ap(Nothing),
        Nothing
    );

    t.deepEqual(
        (Nothing as Maybe<number>).ap(Just((a: number) => a * 2)),
        Nothing
    );

    t.deepEqual(
        Just(0).ap(Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).ap(Just((a: number) => a * 2)),
        Just(2)
    );
});

test('Maybe.prototype.map()', t => {
    t.deepEqual(
        (Nothing as Maybe<number>).map(a => a * 2),
        Nothing
    );

    t.deepEqual(
        Just(1).map(a => a * 2),
        Just(2)
    );
});

test('Maybe.prototype.chain()', t => {
    t.deepEqual(
        (Nothing as Maybe<number>).chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        (Nothing as Maybe<number>).chain(a => Just(a * 2)),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(a => Just(a * 2)),
        Just(2)
    );
});

test('Maybe.prototype.orElse()', t => {
    t.deepEqual(
        (Nothing as Maybe<number>).orElse(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).orElse(() => Nothing),
        Just(1)
    );

    t.deepEqual(
        (Nothing as Maybe<number>).orElse(() => Just(2)),
        Just(2)
    );

    t.deepEqual(
        Just(1).orElse(() => Just(2)),
        Just(1)
    );
});

test('Maybe.prototype.fold()', t => {
    t.is(
        (Nothing as Maybe<number>).fold(
            () => 1,
            a => a * 2
        ),
        1
    );

    t.is(
        Just(1).fold(
            () => 1,
            a => a * 2
        ),
        2
    );
});

test('Maybe.prototype.cata()', t => {
    t.is(
        (Nothing as Maybe<number>).cata({
            Nothing: () => 1,
            Just: a => a * 2
        }),
        1
    );

    t.is(
        Just(1).cata({
            Nothing: () => 1,
            Just: a => a * 2
        }),
        2
    );
});

test('Maybe.prototype.toEither()', t => {
    t.deepEqual(
        Nothing.toEither('err'),
        Left('err')
    );

    t.deepEqual(
        Just(1).toEither('err'),
        Right(1)
    );
});
