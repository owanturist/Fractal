import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../src/Maybe';
import {
    List
} from '../src/List';

test('Maybe.fromNullable()', t => {
    const m1: Maybe<{}> = Maybe.fromNullable(undefined);
    const m2: Maybe<{}> = Maybe.fromNullable(null);
    const m3: Maybe<number> = Maybe.fromNullable(0);
    const m4: Maybe<string> = Maybe.fromNullable('str');
    const m5: Maybe<boolean> = Maybe.fromNullable(true);
    const m6: Maybe<number> = Maybe.fromNullable<number>(null);
    const m7: Maybe<boolean> = Maybe.fromNullable<boolean>(null);

    t.deepEqual(m1, Nothing());
    t.deepEqual(m2, Nothing());
    t.deepEqual(m3, Just(0));
    t.deepEqual(m4, Just('str'));
    t.deepEqual(m5, Just(true));
    t.deepEqual(m6, Nothing());
    t.deepEqual(m7, Nothing());
});

test('Maybe.isNothing()', t => {
    t.true(Nothing().isNothing());

    t.false(Just(1).isNothing());
});

test('Maybe.isJust()', t => {
    t.false(Nothing().isJust());

    t.true(Just(1).isJust());
});

test('Maybe.isEqual()', t => {
    t.false(
        Just(1).isEqual(Nothing())
    );

    t.false(
        Nothing().isEqual(Just(1))
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
        Nothing().isEqual(Nothing())
    );
});

test('Maybe.getOrElse()', t => {
    t.is(
        Nothing().getOrElse(1),
        1
    );

    t.is(
        Just(0).getOrElse(1),
        0
    );
});

test('Maybe.ap()', t => {
    t.deepEqual(
        Nothing().ap(Nothing()),
        Nothing()
    );

    t.deepEqual(
        Nothing<number>().ap(Just((a: number) => a * 2)),
        Nothing()
    );

    t.deepEqual(
        Just(0).ap(Nothing()),
        Nothing()
    );

    t.deepEqual(
        Just(1).ap(Just((a: number) => a * 2)),
        Just(2)
    );
});

test('Maybe.map()', t => {
    t.deepEqual(
        Nothing<number>().map(a => a * 2),
        Nothing()
    );

    t.deepEqual(
        Just(1).map(a => a * 2),
        Just(2)
    );

    interface Foo {
        bar: Maybe<number>;
    }

    const foo: Foo = {
        bar: Nothing()
    };

    t.deepEqual(
        foo.bar.map(a => a * 2),
        Nothing()
    );
});

test('Maybe.chain()', t => {
    t.deepEqual(
        Nothing().chain(Nothing),
        Nothing()
    );

    t.deepEqual(
        Just(1).chain(Nothing),
        Nothing()
    );

    t.deepEqual(
        Nothing<number>().chain(a => Just(a * 2)),
        Nothing()
    );

    t.deepEqual(
        Just(1).chain(a => Just(a * 2)),
        Just(2)
    );
});

test('Maybe.orElse()', t => {
    t.deepEqual(
        Nothing().orElse(Nothing),
        Nothing()
    );

    t.deepEqual(
        Just(1).orElse(Nothing),
        Just(1)
    );

    t.deepEqual(
        Nothing().orElse(() => Just(2)),
        Just(2)
    );

    t.deepEqual(
        Just(1).orElse(() => Just(2)),
        Just(1)
    );
});

test('Maybe.cata()', t => {
    t.is(
        Nothing<number>().cata({
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

test('Maybe.props()', t => {
    t.deepEqual(
        Maybe.props({}),
        Just({})
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing()
        }),
        Nothing()
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
            foo: Nothing(),
            bar: Nothing()
        }),
        Nothing()
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing(),
            bar: Just(1)
        }),
        Nothing()
    );

    t.deepEqual(
        Maybe.props({
            foo: Just('foo'),
            bar: Nothing()
        }),
        Nothing()
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
                baz: Nothing()
            })
        }),
        Nothing()
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
        Just(List.empty())
    );

    t.deepEqual(
        Maybe.all([ Nothing() ]),
        Nothing()
    );

    t.deepEqual(
        Maybe.all([ Just(1) ]),
        Just(List.singleton(1))
    );

    t.deepEqual(
        Maybe.all([ Nothing(), Nothing() ]),
        Nothing()
    );

    t.deepEqual(
        Maybe.all([ Nothing(), Just(2) ]),
        Nothing()
    );

    t.deepEqual(
        Maybe.all([ Just(1), Nothing() ]),
        Nothing()
    );

    t.deepEqual(
        Maybe.all([ Just(1), Just(2) ]),
        Just(List.of(1, 2))
    );
});
