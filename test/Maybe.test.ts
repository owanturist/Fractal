import test from 'ava';

import Maybe, { Nothing, Just } from '../src/Maybe';
import {
    Left,
    Right
} from '../src/Either';

test('Maybe.fromNullable()', t => {
    const m1: Maybe<never> = Maybe.fromNullable(undefined);
    const m2: Maybe<never> = Maybe.fromNullable(null);
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
            foo: Nothing,
            bar: Just(1)
        }).map(obj => obj.foo),
        Nothing
    );

    t.deepEqual(
        Maybe.props({
            foo: Nothing,
            bar: Just(1)
        }).map(obj => obj.bar),
        Nothing
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

test('Maybe.list()', t => {
    t.deepEqual(
        Maybe.list([]),
        Just([])
    );

    t.deepEqual(
        Maybe.list([ Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.list([ Just(1) ]),
        Just([ 1 ])
    );

    t.deepEqual(
        Maybe.list([ Nothing, Nothing ]),
        Nothing
    );

    t.deepEqual(
        Maybe.list([ Nothing, Just(2) ]),
        Nothing
    );

    t.deepEqual(
        Maybe.list([ Just(1), Nothing ]),
        Nothing
    );

    const array = [ Just(1), Just(2) ];

    t.deepEqual(
        Maybe.list(array),
        Just([ 1, 2 ])
    );

    t.deepEqual(
        array,
        [ Just(1), Just(2) ],
        'checking of Array immutability'
    );
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
    t.deepEqual(
        Nothing.map(a => '_' + a * 2),
        Nothing
    );

    t.deepEqual(
        Just(1).map(a => '_' + a * 2),
        Just('_2')
    );
});

test('Maybe.prototype.chain()', t => {
    t.deepEqual(
        Nothing.chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Nothing.chain(a => Just(a * 2)),
        Nothing
    );

    t.deepEqual(
        Just(1).chain(a => Just('_' + a * 2)),
        Just('_2')
    );
});

test('Maybe.prototype.ap()', t => {
    t.deepEqual(
        Nothing.ap(Nothing),
        Nothing
    );

    t.deepEqual(
        Nothing.ap(Just((a: number) => '_' + a * 2)),
        Nothing
    );

    t.deepEqual(
        Just(0).ap(Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).ap(Just((a: number) => '_' + a * 2)),
        Just('_2')
    );
});

test('Maybe.prototype.pipe()', t => {
    const fnNothing: Maybe<(a: number) => string> = Nothing;
    const fnJust = Just((a: number) => '_' + a * 2);

    t.deepEqual(
        fnNothing.pipe(Nothing),
        Nothing
    );

    t.deepEqual(
        fnNothing.pipe(Just(2)),
        Nothing
    );

    t.deepEqual(
        fnJust.pipe(Nothing),
        Nothing
    );

    t.deepEqual(
        fnJust.pipe(Just(2)),
        Just('_4')
    );

    const trippleFnNothing: Maybe<(a: number) => (b: string) => (c: boolean) => string> = Nothing;
    const trippleFnJust = Just((a: number) => (b: string) => (c: boolean) => c ? b : '_' + a * 2);

    t.deepEqual(trippleFnNothing.pipe(Nothing).pipe(Nothing)   .pipe(Nothing),    Nothing);
    t.deepEqual(trippleFnNothing.pipe(Nothing).pipe(Nothing)   .pipe(Just(true)), Nothing);
    t.deepEqual(trippleFnNothing.pipe(Nothing).pipe(Just('hi')).pipe(Nothing),    Nothing);
    t.deepEqual(trippleFnNothing.pipe(Nothing).pipe(Just('hi')).pipe(Just(true)), Nothing);
    t.deepEqual(trippleFnNothing.pipe(Just(2)).pipe(Nothing)   .pipe(Nothing),    Nothing);
    t.deepEqual(trippleFnNothing.pipe(Just(2)).pipe(Nothing)   .pipe(Just(true)), Nothing);
    t.deepEqual(trippleFnNothing.pipe(Just(2)).pipe(Just('hi')).pipe(Nothing),    Nothing);
    t.deepEqual(trippleFnNothing.pipe(Just(2)).pipe(Just('hi')).pipe(Just(true)), Nothing);

    t.deepEqual(trippleFnJust.pipe(Nothing).pipe(Nothing)   .pipe(Nothing),     Nothing);
    t.deepEqual(trippleFnJust.pipe(Nothing).pipe(Nothing)   .pipe(Just(true)),  Nothing);
    t.deepEqual(trippleFnJust.pipe(Nothing).pipe(Just('hi')).pipe(Nothing),     Nothing);
    t.deepEqual(trippleFnJust.pipe(Nothing).pipe(Just('hi')).pipe(Just(true)),  Nothing);
    t.deepEqual(trippleFnJust.pipe(Just(2)).pipe(Nothing)   .pipe(Nothing),     Nothing);
    t.deepEqual(trippleFnJust.pipe(Just(2)).pipe(Nothing)   .pipe(Just(true)),  Nothing);
    t.deepEqual(trippleFnJust.pipe(Just(2)).pipe(Just('hi')).pipe(Nothing),     Nothing);
    t.deepEqual(trippleFnJust.pipe(Just(2)).pipe(Just('hi')).pipe(Just(true)),  Just('hi'));
    t.deepEqual(trippleFnJust.pipe(Just(2)).pipe(Just('hi')).pipe(Just(false)), Just('_4'));

    t.deepEqual(
        Maybe.fromNullable((a: number) => '_' + a * 2).pipe(Just(2)),
        Just('_4'),
        'Maybe.fromNullable is piping'
    );

    t.deepEqual(
        Maybe.fromEither(Right((a: number) => '_' + a * 2)).pipe(Just(2)),
        Just('_4'),
        'Maybe.fromEither is piping'
    );

    t.deepEqual(
        Just(2).map(a => (b: number) => '_' + a * b).pipe(Just(3)),
        Just('_6'),
        'Maybe.prototype.map is piping'
    );

    t.deepEqual(
        Just(2).chain(a => Just((b: number) => '_' + a * b)).pipe(Just(3)),
        Just('_6'),
        'Maybe.prototype.chain is piping'
    );

    t.deepEqual(
        Just(2).ap(Just((a: number) => (b: number) => '_' + a * b)).pipe(Just(3)),
        Just('_6'),
        'Maybe.prototype.ap is piping'
    );
});

test('Maybe.prototype.orElse()', t => {
    t.deepEqual(
        Nothing.orElse(() => Nothing),
        Nothing
    );

    t.deepEqual(
        Just(1).orElse(() => Nothing),
        Just(1)
    );

    t.deepEqual(
        Nothing.orElse(() => Just(2)),
        Just(2)
    );

    t.deepEqual(
        Just(1).orElse(() => Just(2)),
        Just(1)
    );
});

test('Maybe.prototype.getOrElse()', t => {
    t.is(
        Nothing.getOrElse(1),
        1
    );

    t.is(
        Just(0).getOrElse(1),
        0
    );
});

test('Maybe.prototype.fold()', t => {
    t.is(
        Nothing.fold(
            () => '_1',
            a => '_' + a * 2
        ),
        '_1'
    );

    t.is(
        Just(1).fold(
            () => '_1',
            a => '_' + a * 2
        ),
        '_2'
    );
});

test('Maybe.prototype.cata()', t => {
    t.is(
        Nothing.cata({
            _: () => '_0'
        }),
        '_0'
    );

    t.is(
        Just(1).cata({
            _: () => '_0'
        }),
        '_0'
    );

    t.is(
        Nothing.cata({
            Nothing: () => '_1',
            _: () => '_0'
        }),
        '_1'
    );

    t.is(
        Just(1).cata({
            Nothing: () => '_1',
            _: () => '_0'
        }),
        '_0'
    );

    t.is(
        Nothing.cata({
            Just: a => '_' + a * 2,
            _: () => '_0'
        }),
        '_0'
    );

    t.is(
        Just(1).cata({
            Just: a => '_' + a * 2,
            _: () => '_0'
        }),
        '_2'
    );

    t.is(
        Nothing.cata({
            Nothing: () => '_1',
            Just: a => '_' + a * 2
        }),
        '_1'
    );

    t.is(
        Just(1).cata({
            Nothing: () => '_1',
            Just: a => '_' + a * 2
        }),
        '_2'
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
