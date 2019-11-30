import test from 'ava';

import Dict, { Serialization } from '../src/Dict';
import Maybe from '../src/Maybe';
import Either from '../src/Either';

const node = <K, T>(
    color: 'red' | 'black',
    key: K,
    value: T,
    left: Serialization<K, T>,
    right: Serialization<K, T>
): Serialization<K, T> => ({ color, key, value, left, right });

const validate = <K, T>(x: Serialization<K, T>): Either<string, number> => {
    if (x === null) {
        return Either.Right(0);
    }

    if (x.right !== null && x.right.color === 'red') {
        return Either.Left(`Right node of "${x.key}" is Red`);
    }

    return Either.shape<string, { left: number; right: number }>({
        left: validate(x.left),
        right: validate(x.right)
    }).chain(({ left, right }) => {
        return left === right
            ? Either.Right(x.color === 'black' ? left + 1 : left)
            : Either.Left(`Different subtrees heights of "${x.key}": ${left} vs ${right}`);
    });
};

class TestDict extends Dict<never, never> {
    public static serialize<K, T>(dict: Dict<K, T>): Serialization<K, T> {
        return super.serialize(dict);
    }

    public static validate<K, T>(dict: Dict<K, T>): Maybe<string> {
        const x = TestDict.serialize(dict);

        if (x !== null && x.color === 'red') {
            return Maybe.Just('Root node is Red');
        }

        return validate(x).swap().toMaybe();
    }

    public static stringify<K, T>(indent: number, dict: Dict<K, T>): string {
        return JSON.stringify(super.serialize(dict), null, indent);
    }
}

const alphabet = Dict.fromList(
    char => char.charCodeAt(0) - 'A'.charCodeAt(0),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
);

// class ID implements Comparable<ID> {
//     constructor(private readonly id: string) {}

//     public compareTo(): Order {
//         return Order.EQ;
//     }
// }

test('Dict.get()', t => {
    t.deepEqual(
        Dict.empty.get('A'),
        Maybe.Nothing
    );

    t.deepEqual(
        Dict.singleton('B', 1).get('A'),
        Maybe.Nothing
    );

    t.deepEqual(
        Dict.singleton('A', 0).get('A'),
        Maybe.Just(0)
    );

    const _0 = Dict.fromList([
        [ 'Q', 16 ],
        [ 'O', 14 ],
        [ 'W', 22 ],
        [ 'I', 8 ],
        [ 'U', 20 ],
        [ 'L', 11 ],
        [ 'Z', 25 ],
        [ 'D', 3 ],
        [ 'V', 21 ],
        [ 'E', 4 ],
        [ 'M', 12 ],
        [ 'R', 17 ],
        [ 'G', 6 ],
        [ 'S', 18 ],
        [ 'T', 19 ],
        [ 'B', 1 ],
        [ 'X', 23 ],
        [ 'N', 13 ],
        [ 'J', 9 ],
        [ 'F', 5 ],
        [ 'H', 7 ],
        [ 'A', 0 ],
        [ 'Y', 24 ],
        [ 'K', 10 ],
        [ 'P', 15 ],
        [ 'C', 2 ]
    ]);

    t.deepEqual(TestDict.validate(alphabet), Maybe.Nothing);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);

    t.deepEqual(alphabet.get(-1), Maybe.Nothing);
    t.deepEqual(_0.get('-'), Maybe.Nothing);

    t.deepEqual(alphabet.get(0), Maybe.Just('A'));
    t.deepEqual(_0.get('A'), Maybe.Just(0));

    t.deepEqual(alphabet.get(1), Maybe.Just('B'));
    t.deepEqual(_0.get('B'), Maybe.Just(1));

    t.deepEqual(alphabet.get(2), Maybe.Just('C'));
    t.deepEqual(_0.get('C'), Maybe.Just(2));

    t.deepEqual(alphabet.get(3), Maybe.Just('D'));
    t.deepEqual(_0.get('D'), Maybe.Just(3));

    t.deepEqual(alphabet.get(4), Maybe.Just('E'));
    t.deepEqual(_0.get('E'), Maybe.Just(4));

    t.deepEqual(alphabet.get(5), Maybe.Just('F'));
    t.deepEqual(_0.get('F'), Maybe.Just(5));

    t.deepEqual(alphabet.get(6), Maybe.Just('G'));
    t.deepEqual(_0.get('G'), Maybe.Just(6));

    t.deepEqual(alphabet.get(7), Maybe.Just('H'));
    t.deepEqual(_0.get('H'), Maybe.Just(7));

    t.deepEqual(alphabet.get(8), Maybe.Just('I'));
    t.deepEqual(_0.get('I'), Maybe.Just(8));

    t.deepEqual(alphabet.get(9), Maybe.Just('J'));
    t.deepEqual(_0.get('J'), Maybe.Just(9));

    t.deepEqual(alphabet.get(10), Maybe.Just('K'));
    t.deepEqual(_0.get('K'), Maybe.Just(10));

    t.deepEqual(alphabet.get(11), Maybe.Just('L'));
    t.deepEqual(_0.get('L'), Maybe.Just(11));

    t.deepEqual(alphabet.get(12), Maybe.Just('M'));
    t.deepEqual(_0.get('M'), Maybe.Just(12));

    t.deepEqual(alphabet.get(13), Maybe.Just('N'));
    t.deepEqual(_0.get('N'), Maybe.Just(13));

    t.deepEqual(alphabet.get(14), Maybe.Just('O'));
    t.deepEqual(_0.get('O'), Maybe.Just(14));

    t.deepEqual(alphabet.get(15), Maybe.Just('P'));
    t.deepEqual(_0.get('P'), Maybe.Just(15));

    t.deepEqual(alphabet.get(16), Maybe.Just('Q'));
    t.deepEqual(_0.get('Q'), Maybe.Just(16));

    t.deepEqual(alphabet.get(17), Maybe.Just('R'));
    t.deepEqual(_0.get('R'), Maybe.Just(17));

    t.deepEqual(alphabet.get(18), Maybe.Just('S'));
    t.deepEqual(_0.get('S'), Maybe.Just(18));

    t.deepEqual(alphabet.get(19), Maybe.Just('T'));
    t.deepEqual(_0.get('T'), Maybe.Just(19));

    t.deepEqual(alphabet.get(20), Maybe.Just('U'));
    t.deepEqual(_0.get('U'), Maybe.Just(20));

    t.deepEqual(alphabet.get(21), Maybe.Just('V'));
    t.deepEqual(_0.get('V'), Maybe.Just(21));

    t.deepEqual(alphabet.get(22), Maybe.Just('W'));
    t.deepEqual(_0.get('W'), Maybe.Just(22));

    t.deepEqual(alphabet.get(23), Maybe.Just('X'));
    t.deepEqual(_0.get('X'), Maybe.Just(23));

    t.deepEqual(alphabet.get(24), Maybe.Just('Y'));
    t.deepEqual(_0.get('Y'), Maybe.Just(24));

    t.deepEqual(alphabet.get(25), Maybe.Just('Z'));
    t.deepEqual(_0.get('Z'), Maybe.Just(25));
});

test('Dict.member()', t => {
    t.false(Dict.empty.member('A'));

    t.false(Dict.singleton('B', 1).member('A'));

    t.true(Dict.singleton('A', 0).member('A'));

    t.false(alphabet.member(-1));
    t.true(alphabet.member(0));
    t.true(alphabet.member(1));
    t.true(alphabet.member(2));
    t.true(alphabet.member(3));
    t.true(alphabet.member(4));
    t.true(alphabet.member(5));
    t.true(alphabet.member(6));
    t.true(alphabet.member(7));
    t.true(alphabet.member(8));
    t.true(alphabet.member(9));
    t.true(alphabet.member(10));
    t.true(alphabet.member(11));
    t.true(alphabet.member(12));
    t.true(alphabet.member(13));
    t.true(alphabet.member(14));
    t.true(alphabet.member(15));
    t.true(alphabet.member(16));
    t.true(alphabet.member(17));
    t.true(alphabet.member(18));
    t.true(alphabet.member(19));
    t.true(alphabet.member(20));
    t.true(alphabet.member(21));
    t.true(alphabet.member(22));
    t.true(alphabet.member(23));
    t.true(alphabet.member(24));
    t.true(alphabet.member(25));
});

test('Dict.insert()', t => {
    const _0 = Dict.empty.insert('A', 0);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'A', 0, null, null)
    );
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);

    const _1 = Dict.singleton('A', 0).insert('A', 1);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'A', 1, null, null)
    );
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);

    const _2 = Dict.singleton('A', 0).insert('B', 1);
    t.deepEqual(
        TestDict.serialize(_2),
        node('black', 'B', 1,
            node('red', 'A', 0, null, null),
            null
        )
    );
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);

    const _3 = Dict.singleton('A', 0).insert('B', 1).insert('A', 2);
    t.deepEqual(
        TestDict.serialize(_3),
        node('black', 'B', 1,
            node('red', 'A', 2, null, null),
            null
        )
    );
    t.deepEqual(TestDict.validate(_3), Maybe.Nothing);

    const _4 = Dict.singleton('A', 0).insert('B', 1).insert('B', 2);
    t.deepEqual(
        TestDict.serialize(_4),
        node('black', 'B', 2,
            node('red', 'A', 0, null, null),
            null
        )
    );
    t.deepEqual(TestDict.validate(_4), Maybe.Nothing);
});

test('Dict.insert() random order insertion', t => {
    const _0 = Dict.singleton('S', 0);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'S', 0, null, null),
        'S-0'
    );
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);

    const _1 = _0.insert('E', 1);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'S', 0,
            node('red', 'E', 1, null, null),
            null
        ),
        'S-0 E-1'
    );
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);

    const _2 = _1.insert('A', 2);
    t.deepEqual(
        TestDict.serialize(_2),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0, null, null)
        ),
        'S-0 E-1 A-2'
    );
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);

    const _3 = _2.insert('R', 3);
    t.deepEqual(
        TestDict.serialize(_3),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0,
                node('red', 'R', 3, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3'
    );
    t.deepEqual(TestDict.validate(_3), Maybe.Nothing);

    const _4 = _3.insert('C', 4);
    t.deepEqual(
        TestDict.serialize(_4),
        node('black', 'E', 1,
            node('black', 'C', 4,
                node('red', 'A', 2, null, null),
                null
            ),
            node('black', 'S', 0,
                node('red', 'R', 3, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3 C-4'
    );
    t.deepEqual(TestDict.validate(_4), Maybe.Nothing);

    const _5 = _4.insert('H', 5);
    t.deepEqual(
        TestDict.serialize(_5),
        node('black', 'R', 3,
            node('red', 'E', 1,
                node('black', 'C', 4,
                    node('red', 'A', 2, null, null),
                    null
                ),
                node('black', 'H', 5, null, null)
            ),
            node('black', 'S', 0, null, null)
        ),
        'S-0 E-1 A-2 R-3 C-4 H-5'
    );
    t.deepEqual(TestDict.validate(_5), Maybe.Nothing);

    const _6 = _5.insert('X', 6);
    t.deepEqual(
        TestDict.serialize(_6),
        node('black', 'R', 3,
            node('red', 'E', 1,
                node('black', 'C', 4,
                    node('red', 'A', 2, null, null),
                    null
                ),
                node('black', 'H', 5, null, null)
            ),
            node('black', 'X', 6,
                node('red', 'S', 0, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3 C-4 H-5 X-6'
    );
    t.deepEqual(TestDict.validate(_6), Maybe.Nothing);

    const _7 = _6.insert('M', 7);
    t.deepEqual(
        TestDict.serialize(_7),
        node('black', 'R', 3,
            node('red', 'E', 1,
                node('black', 'C', 4,
                    node('red', 'A', 2, null, null),
                    null
                ),
                node('black', 'M', 7,
                    node('red', 'H', 5, null, null),
                    null
                )
            ),
            node('black', 'X', 6,
                node('red', 'S', 0, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3 C-4 H-5 X-6 M-7'
    );
    t.deepEqual(TestDict.validate(_7), Maybe.Nothing);

    const _8 = _7.insert('P', 8);
    t.deepEqual(
        TestDict.serialize(_8),
        node('black', 'M', 7,
            node('black', 'E', 1,
                node('black', 'C', 4,
                    node('red', 'A', 2, null, null),
                    null
                ),
                node('black', 'H', 5, null, null)
            ),
            node('black', 'R', 3,
                node('black', 'P', 8, null, null),
                node('black', 'X', 6,
                    node('red', 'S', 0, null, null),
                    null
                )
            )
        ),
        'S-0 E-1 A-2 R-3 C-4 H-5 X-6 M-7 P-8'
    );
    t.deepEqual(TestDict.validate(_8), Maybe.Nothing);

    const _9 = _8.insert('L', 9);
    t.deepEqual(
        TestDict.serialize(_9),
        node('black', 'M', 7,
            node('black', 'E', 1,
                node('black', 'C', 4,
                    node('red', 'A', 2, null, null),
                    null
                ),
                node('black', 'L', 9,
                    node('red', 'H', 5, null, null),
                    null
                )
            ),
            node('black', 'R', 3,
                node('black', 'P', 8, null, null),
                node('black', 'X', 6,
                    node('red', 'S', 0, null, null),
                    null
                )
            )
        ),
        'S-0 E-1 A-2 R-3 C-4 H-5 X-6 M-7 P-8 L-9'
    );
    t.deepEqual(TestDict.validate(_9), Maybe.Nothing);
});

test('Dict.insert() increasing order insertion', t => {
    const _0: Dict<string, number> = Dict.empty.insert('A', 0);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'A', 0, null, null),
        'A-0'
    );
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);

    const _1 = _0.insert('C', 1);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'C', 1,
            node('red', 'A', 0, null, null),
            null
        ),
        'A-0 C-1'
    );
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);

    const _2 = _1.insert('E', 2);
    t.deepEqual(
        TestDict.serialize(_2),
        node('black', 'C', 1,
            node('black', 'A', 0, null, null),
            node('black', 'E', 2, null, null)
        ),
        'A-0 C-1 E-2'
    );
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);

    const _3 = _2.insert('H', 3);
    t.deepEqual(
        TestDict.serialize(_3),
        node('black', 'C', 1,
            node('black', 'A', 0, null, null),
            node('black', 'H', 3,
                node('red', 'E', 2, null, null),
                null
            )
        ),
        'A-0 C-1 E-2 H-3'
    );
    t.deepEqual(TestDict.validate(_3), Maybe.Nothing);

    const _4 = _3.insert('L', 4);
    t.deepEqual(
        TestDict.serialize(_4),
        node('black', 'H', 3,
            node('red', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'L', 4, null, null)
        ),
        'A-0 C-1 E-2 H-3 L-4'
    );
    t.deepEqual(TestDict.validate(_4), Maybe.Nothing);

    const _5 = _4.insert('M', 5);
    t.deepEqual(
        TestDict.serialize(_5),
        node('black', 'H', 3,
            node('red', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'M', 5,
                node('red', 'L', 4, null, null),
                null
            )
        ),
        'A-0 C-1 E-2 H-3 L-4 M-5'
    );
    t.deepEqual(TestDict.validate(_5), Maybe.Nothing);

    const _6 = _5.insert('P', 6);
    t.deepEqual(
        TestDict.serialize(_6),
        node('black', 'H', 3,
            node('black', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'M', 5,
                node('black', 'L', 4, null, null),
                node('black', 'P', 6, null, null)
            )
        ),
        'A-0 C-1 E-2 H-3 L-4 M-5 P-6'
    );
    t.deepEqual(TestDict.validate(_6), Maybe.Nothing);

    const _7 = _6.insert('R', 7);
    t.deepEqual(
        TestDict.serialize(_7),
        node('black', 'H', 3,
            node('black', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'M', 5,
                node('black', 'L', 4, null, null),
                node('black', 'R', 7,
                    node('red', 'P', 6, null, null),
                    null
                )
            )
        ),
        'A-0 C-1 E-2 H-3 L-4 M-5 P-6 R-7'
    );
    t.deepEqual(TestDict.validate(_7), Maybe.Nothing);

    const _8 = _7.insert('S', 8);
    t.deepEqual(
        TestDict.serialize(_8),
        node('black', 'H', 3,
            node('black', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'R', 7,
                node('red', 'M', 5,
                    node('black', 'L', 4, null, null),
                    node('black', 'P', 6, null, null)
                ),
                node('black', 'S', 8, null, null)
            )
        ),
        'A-0 C-1 E-2 H-3 L-4 M-5 P-6 R-7 S-8'
    );
    t.deepEqual(TestDict.validate(_8), Maybe.Nothing);

    const _9 = _8.insert('X', 9);
    t.deepEqual(
        TestDict.serialize(_9),
        node('black', 'H', 3,
            node('black', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'R', 7,
                node('red', 'M', 5,
                    node('black', 'L', 4, null, null),
                    node('black', 'P', 6, null, null)
                ),
                node('black', 'X', 9,
                    node('red', 'S', 8, null, null),
                    null
                )
            )
        ),
        'A-0 C-1 E-2 H-3 L-4 M-5 P-6 R-7 S-8 X-9'
    );
    t.deepEqual(TestDict.validate(_9), Maybe.Nothing);
});

test.todo('Dict.update()');

test.todo('Dict.remove()');

test.skip('Dict.removeMax() empty', t => {
    const _0 = Dict.empty;

    t.is(_0.size(), 0);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_0),
        null
    );

    const _1 = _0.removeMax();

    t.is(_1.size(), 0);
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_1),
        null
    );
});

test.skip('Dict.removeMax() singleton', t => {
    const _0 = Dict.singleton('A', 0);

    t.is(_0.size(), 1);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'A', 0, null, null)
    );

    const _1 = _0.removeMax();

    t.is(_1.size(), 0);
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_1),
        null
    );
});

test.skip('Dict.removeMax() 2 nodes', t => {
    const _0 = Dict.fromList([
        [ 'B', 0 ],
        [ 'A', 1 ]
    ]);

    t.is(_0.size(), 2);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'B', 0,
            node('red', 'A', 1, null, null),
            null
        )
    );

    const _1 = _0.removeMax();

    t.is(_1.size(), 1);
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'A', 1, null, null)
    );

    const _2 = _1.removeMax();

    t.is(_2.size(), 0);
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_2),
        null
    );
});

test.skip('Dict.removeMax() 3 nodes', t => {
    const _0 = Dict.fromList([
        [ 'B', 0 ],
        [ 'A', 1 ],
        [ 'C', 2 ]
    ]);

    t.is(_0.size(), 3);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'B', 0,
            node('black', 'A', 1, null, null),
            node('black', 'C', 2, null, null)
        )
    );

    const _1 = _0.removeMax();

    t.is(_1.size(), 2);
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'B', 0,
            node('red', 'A', 1, null, null),
            null
        )
    );

    const _2 = _1.removeMax();

    t.is(_2.size(), 1);
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_2),
        node('black', 'A', 1, null, null)
    );

    const _3 = _2.removeMax();

    t.is(_3.size(), 0);
    t.deepEqual(TestDict.validate(_3), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_3),
        null
    );
});

test.skip('Dict.removeMax() 15 nodes', t => {
    const _0 = Dict.fromList([
        [ 'H', 0 ],
        [ 'D', 1 ],
        [ 'L', 2 ],
        [ 'B', 3 ],
        [ 'F', 4 ],
        [ 'J', 5 ],
        [ 'N', 6 ],
        [ 'A', 7 ],
        [ 'C', 8 ],
        [ 'E', 9 ],
        [ 'G', 10 ],
        [ 'I', 11 ],
        [ 'K', 12 ],
        [ 'M', 13 ],
        [ 'O', 14 ]
    ]);

    t.is(_0.size(), 15);
    t.deepEqual(TestDict.validate(_0), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_0),
        node('black', 'H', 0,
            node('black', 'D', 1,
                node('black', 'B', 3,
                    node('black', 'A', 7, null, null),
                    node('black', 'C', 8, null, null)
                ),
                node('black', 'F', 4,
                    node('black', 'E', 9, null, null),
                    node('black', 'G', 10, null, null)
                )
            ),
            node('black', 'L', 2,
                node('black', 'J', 5,
                    node('black', 'I', 11, null, null),
                    node('black', 'K', 12, null, null)
                ),
                node('black', 'N', 6,
                    node('black', 'M', 13, null, null),
                    node('black', 'O', 14, null, null)
                )
            )
        )
    );

    const _1 = _0.removeMax();

    t.is(_1.size(), 14);
    t.deepEqual(TestDict.validate(_1), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_1),
        node('black', 'H', 0,
            node('red', 'D', 1,
                node('black', 'B', 3,
                    node('black', 'A', 7, null, null),
                    node('black', 'C', 8, null, null)
                ),
                node('black', 'F', 4,
                    node('black', 'E', 9, null, null),
                    node('black', 'G', 10, null, null)
                )
            ),
            node('black', 'L', 2,
                node('red', 'J', 5,
                    node('black', 'I', 11, null, null),
                    node('black', 'K', 12, null, null)
                ),
                node('black', 'N', 6,
                    node('red', 'M', 13, null, null),
                    null
                )
            )
        )
    );

    const _2 = _1.removeMax();

    t.is(_2.size(), 13);
    t.deepEqual(TestDict.validate(_2), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_2),
        node('black', 'H', 0,
            node('red', 'D', 1,
                node('black', 'B', 3,
                    node('black', 'A', 7, null, null),
                    node('black', 'C', 8, null, null)
                ),
                node('black', 'F', 4,
                    node('black', 'E', 9, null, null),
                    node('black', 'G', 10, null, null)
                )
            ),
            node('black', 'L', 2,
                node('red', 'J', 5,
                    node('black', 'I', 11, null, null),
                    node('black', 'K', 12, null, null)
                ),
                node('black', 'M', 13, null, null)
            )
        )
    );

    const _3 = _2.removeMax();

    t.is(_3.size(), 12);
    t.deepEqual(TestDict.validate(_3), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_3),
        node('black', 'H', 0,
            node('red', 'D', 1,
                node('black', 'B', 3,
                    node('black', 'A', 7, null, null),
                    node('black', 'C', 8, null, null)
                ),
                node('black', 'F', 4,
                    node('black', 'E', 9, null, null),
                    node('black', 'G', 10, null, null)
                )
            ),
            node('black', 'J', 5,
                node('black', 'I', 11, null, null),
                node('black', 'L', 2,
                    node('red', 'K', 12, null, null),
                    null
                )
            )
        )
    );

    const _4 = _3.removeMax();

    t.is(_4.size(), 11);
    t.deepEqual(TestDict.validate(_4), Maybe.Nothing);
    t.deepEqual(
        TestDict.serialize(_4),
        node('black', 'H', 0,
            node('red', 'D', 1,
                node('black', 'B', 3,
                    node('black', 'A', 7, null, null),
                    node('black', 'C', 8, null, null)
                ),
                node('black', 'F', 4,
                    node('black', 'E', 9, null, null),
                    node('black', 'G', 10, null, null)
                )
            ),
            node('black', 'J', 5,
                node('black', 'I', 11, null, null),
                node('black', 'K', 12, null, null)
            )
        )
    );
});

test.todo('Dict.size()');

test.todo('Dict.isEmpty()');

test.todo('Dict.map()');

test.todo('Dict.filter()');

test.todo('Dict.partition()');

test.todo('Dict.foldl()');

test.todo('Dict.foldr()');

test.todo('Dict.union()');

test.todo('Dict.intersect()');

test.todo('Dict.diff()');

test.todo('Dict.merge()');

test.todo('Dict.keys()');

test.todo('Dict.keys.iterator()');

test.todo('Dict.values()');

test.todo('Dict.values.iterator()');

test.todo('Dict.entries()');

test.todo('Dict.entries.iterator()');
