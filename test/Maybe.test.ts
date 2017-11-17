import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../src/Maybe';

test('Maybe.map', t => {
    t.deepEqual(
        Maybe.map((a: number) => a * 2, Nothing),
        Nothing
    );

    t.deepEqual(
        Maybe.map(a => a * 2, Just(3)),
        Just(6)
    );
});

test('Maybe.map2', t => {
    t.deepEqual(
        Maybe.map2((a: number, b: number) => a * 2 + b, Nothing, Nothing),
        Nothing
    );

    t.deepEqual(
        Maybe.map2((a: number, b) => a * 2 + b, Nothing, Just(1)),
        Nothing
    );

    t.deepEqual(
        Maybe.map2((a, b) => a * 2 + b, Just(2), Just(1)),
        Just(5)
    );
});

test('Maybe.map3', t => {
    t.deepEqual(
        Maybe.map3(
            (a: number, b: number, c: number) => a * 2 + b - c,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a: number, b: number, c) => a * 2 + b - c,
            Nothing,
            Nothing,
            Just(1)
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a: number, b, c: number) => a * 2 + b - c,
            Nothing,
            Just(2),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a, b: number, c: number) => a * 2 + b - c,
            Just(1),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a, b: number, c: number) => a * 2 + b - c,
            Just(3),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a, b, c) => a * 2 + b - c,
            Just(3),
            Just(2),
            Just(1)
        ),
        Just(7)
    );
});

test('Maybe.map4', t => {
    t.deepEqual(
        Maybe.map4(
            (a: number, b: number, c: number, d: number) => a * 2 + b - c * d,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a: number, b: number, c: number, d) => a * 2 + b - c * d,
            Nothing,
            Nothing,
            Nothing,
            Just(1)
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a: number, b: number, c, d: number) => a * 2 + b - c * d,
            Nothing,
            Nothing,
            Just(2),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a: number, b, c: number, d: number) => a * 2 + b - c * d,
            Nothing,
            Just(3),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a, b: number, c: number, d: number) => a * 2 + b - c * d,
            Just(4),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a, b, c, d) => a * 2 + b - c * d,
            Just(4),
            Just(3),
            Just(2),
            Just(1)
        ),
        Just(9)
    );
});

test('Maybe.map5', t => {
    t.deepEqual(
        Maybe.map5(
            (a: number, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a: number, b: number, c: number, d: number, e) => a * 2 + b - c * d + e,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Just(1)
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a: number, b: number, c: number, d, e: number) => a * 2 + b - c * d + e,
            Nothing,
            Nothing,
            Nothing,
            Just(2),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a: number, b: number, c, d: number, e: number) => a * 2 + b - c * d + e,
            Nothing,
            Nothing,
            Just(3),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a: number, b, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Nothing,
            Just(4),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Just(5),
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b, c, d, e) => a * 2 + b - c * d + e,
            Just(5),
            Just(4),
            Just(3),
            Just(2),
            Just(1)
        ),
        Just(9)
    );
});

test('Maybe.andThen', t => {
    t.deepEqual(
        Maybe.andThen(() => Nothing, Nothing),
        Nothing
    );

    t.deepEqual(
        Maybe.andThen(() => Nothing, Just(1)),
        Nothing
    );

    t.deepEqual(
        Maybe.andThen(() => Just(2), Nothing),
        Nothing
    );

    t.deepEqual(
        Maybe.andThen(() => Just(2), Just(1)),
        Just(2)
    );

    t.deepEqual(
        Maybe.andThen(a => Just(2 * a), Just(3)),
        Just(6)
    );
});

test('Maybe.withDefault', t => {
    t.is(
        Maybe.withDefault(1, Nothing),
        1
    );

    t.is(
        Maybe.withDefault(1, Just(2)),
        2
    );
});

test('Maybe.cata', t => {
    t.is(
        Maybe.cata({
            Nothing: () => 1,
            Just: a => a * 2
        }, Nothing),
        1
    );

    t.is(
        Maybe.cata({
            Nothing: () => 1,
            Just: a => a * 2
        }, Just(3)),
        6
    );
})
