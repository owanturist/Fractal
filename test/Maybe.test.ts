import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../src/Maybe';

// CONSTRUCTING

test('Maybe.fromNullable()', t => {
    t.deepEqual(
        Maybe.fromNullable(undefined),
        Nothing
    );

    t.deepEqual(
        Maybe.fromNullable(null),
        Nothing
    );

    t.deepEqual(
        Maybe.fromNullable(0),
        Just(0)
    );

    t.deepEqual(
        Maybe.fromNullable(''),
        Just('')
    );
});

// COMPAREING AND TESTING

test('Maybe.isNothing', t => {
    t.true(Nothing.isNothing);

    t.false(Just(1).isNothing);
});

test('Maybe.isJust', t => {
    t.false(Nothing.isJust);

    t.true(Just(1).isJust);
});

test('Maybe.isEqual()', t => {
    t.false(
        Just(1).isEqual(Nothing)
    );

    t.false(
        Nothing.isEqual(Just(1))
    );

    t.false(
        Just(1).isEqual(Just(2))
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

// EXTRACTING

test('Maybe.getOrElse()', t => {
    t.is(
        Nothing.getOrElse(1),
        1
    );

    t.is(
        Just(2).getOrElse(1),
        2
    );
});

// TRANSFORMING

test('Maybe.ap()', t => {
    t.deepEqual(
        Nothing.ap(Nothing),
        Nothing
    );

    t.deepEqual(
        Nothing.ap(Just((a: number) => a * 2)),
        Nothing
    );

    t.deepEqual(
        Just(3).ap(Nothing),
        Nothing
    );

    t.deepEqual(
        Just(3).ap(Just((a: number) => a * 2)),
        Just(6)
    );
});

test('Maybe.map()', t => {
    t.deepEqual(
        Nothing.map((a: number) => a * 2),
        Nothing
    );

    t.deepEqual(
        Just(3).map(a => a * 2),
        Just(6)
    );
});

test('Maybe.chain()', t => {
    t.deepEqual(
        Nothing.chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Nothing.chain(a => Just(a * 3)),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(a => Just(a * 3)),
        Just(3)
    );
});

test('Maybe.orElse()', t => {
    t.deepEqual(
        Nothing.orElse(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).orElse(() => Nothing),
        Just(1)
    );

    t.deepEqual(
        Nothing.orElse(() => Just(3)),
        Just(3)
    );

    t.deepEqual(
        Just(1).orElse(() => Just(3)),
        Just(1)
    );
});

test('Maybe.cata()', t => {
    t.is(
        Nothing.cata({
            Nothing: () => 1,
            Just: a => a * 2
        }),
        1
    );

    t.is(
        Just(3).cata({
            Nothing: () => 1,
            Just: a => a * 2
        }),
        6
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

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Maybe.props({
                baz: Just(1)
            })
        }),
        Just({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});

test('Maybe.all()', t => {
    t.deepEqual(
        Maybe.all([]),
        Just([])
    );

    t.deepEqual(
        Maybe.all([ Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.all([ Just(1) ]),
        Just([ 1 ])
    );

    t.deepEqual(
        Maybe.all([ Nothing, Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.all([ Nothing, Just(2) ]),
        Nothing
    );

    t.deepEqual(
        Maybe.all([ Just(1), Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.all([ Just(1), Just(2) ]),
        Just([ 1, 2 ])
    );
});
