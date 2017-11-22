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
        Maybe.map2(
            (a: number, b: number) => a * 2 + b,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map2(
            (a: number, b) => a * 2 + b,
            Just(1),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map2(
            (a, b) => a * 2 + b,
            Just(1),
            Just(2)
        ),
        Just(4)
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
            (a, b: number, c: number) => a * 2 + b - c,
            Just(1),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a, b, c: number) => a * 2 + b - c,
            Just(1),
            Just(2),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map3(
            (a, b, c) => a * 2 + b - c,
            Just(1),
            Just(2),
            Just(3)
        ),
        Just(1)
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
            (a, b: number, c: number, d: number) => a * 2 + b - c * d,
            Just(1),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a, b, c: number, d: number) => a * 2 + b - c * d,
            Just(1),
            Just(2),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a, b, c, d: number) => a * 2 + b - c * d,
            Just(1),
            Just(2),
            Just(3),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map4(
            (a, b, c, d) => a * 2 + b - c * d,
            Just(1),
            Just(2),
            Just(3),
            Just(4)
        ),
        Just(-8)
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
            (a, b: number, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Just(1),
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b, c: number, d: number, e: number) => a * 2 + b - c * d + e,
            Just(1),
            Just(2),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b, c, d: number, e: number) => a * 2 + b - c * d + e,
            Just(1),
            Just(2),
            Just(3),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b, c, d, e: number) => a * 2 + b - c * d + e,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map5(
            (a, b, c, d, e) => a * 2 + b - c * d + e,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5)
        ),
        Just(-3)
    );
});

test('Maybe.map6', t => {
    t.deepEqual(
        Maybe.map6(
            (a: number, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b: number, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Just(1),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b, c: number, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Just(1),
            Just(2),
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b, c, d: number, e: number, f: number) => a * 2 + b - c * d + e * f,
            Just(1),
            Just(2),
            Just(3),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b, c, d, e: number, f: number) => a * 2 + b - c * d + e * f,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b, c, d, e, f: number) => a * 2 + b - c * d + e * f,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map6(
            (a, b, c, d, e, f) => a * 2 + b - c * d + e * f,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6)
        ),
        Just(22)
    );
});

test('Maybe.map7', t => {
    t.deepEqual(
        Maybe.map7(
            (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b: number, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c: number, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c, d: number, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Just(3),
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c, d, e: number, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c, d, e, f: number, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c, d, e, f, g: number) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map7(
            (a, b, c, d, e, f, g) => a * 2 + b - c * d + e * f - g,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6),
            Just(7)
        ),
        Just(15)
    );
});

test('Maybe.map8', t => {
    t.deepEqual(
        Maybe.map8(
            (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c: number, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d: number, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Nothing,
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d, e: number, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Nothing,
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d, e, f: number, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Nothing,
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d, e, f, g: number, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6),
            Nothing,
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d, e, f, g, h: number) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6),
            Just(7),
            Nothing
        ),
        Nothing
    );

    t.deepEqual(
        Maybe.map8(
            (a, b, c, d, e, f, g, h) => a * 2 + b - c * d + e * f - g * h,
            Just(1),
            Just(2),
            Just(3),
            Just(4),
            Just(5),
            Just(6),
            Just(7),
            Just(8)
        ),
        Just(-34)
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
        Maybe.andThen(a => Just(a * 3), Nothing),
        Nothing
    );

    t.deepEqual(
        Maybe.andThen(a => Just(a * 3), Just(1)),
        Just(3)
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
