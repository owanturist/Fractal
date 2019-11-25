import test from 'ava';

import Dict, { Serialization } from '../src/Dict';
import Maybe from '../src/Maybe';

const node = <K, T>(
    color: 'red' | 'black',
    key: K,
    value: T,
    left: Serialization<K, T>,
    right: Serialization<K, T>
): Serialization<K, T> => ({ color, left, right, key, value });

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

    const _0 = Dict.fromList(
        char => char.charCodeAt(0) - 'A'.charCodeAt(0),
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    );
    const _1 = Dict.fromList([
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

    t.deepEqual(_0.get(-1), Maybe.Nothing);
    t.deepEqual(_1.get('-'), Maybe.Nothing);

    t.deepEqual(_0.get(0), Maybe.Just('A'));
    t.deepEqual(_1.get('A'), Maybe.Just(0));

    t.deepEqual(_0.get(1), Maybe.Just('B'));
    t.deepEqual(_1.get('B'), Maybe.Just(1));

    t.deepEqual(_0.get(2), Maybe.Just('C'));
    t.deepEqual(_1.get('C'), Maybe.Just(2));

    t.deepEqual(_0.get(3), Maybe.Just('D'));
    t.deepEqual(_1.get('D'), Maybe.Just(3));

    t.deepEqual(_0.get(4), Maybe.Just('E'));
    t.deepEqual(_1.get('E'), Maybe.Just(4));

    t.deepEqual(_0.get(5), Maybe.Just('F'));
    t.deepEqual(_1.get('F'), Maybe.Just(5));

    t.deepEqual(_0.get(6), Maybe.Just('G'));
    t.deepEqual(_1.get('G'), Maybe.Just(6));

    t.deepEqual(_0.get(7), Maybe.Just('H'));
    t.deepEqual(_1.get('H'), Maybe.Just(7));

    t.deepEqual(_0.get(8), Maybe.Just('I'));
    t.deepEqual(_1.get('I'), Maybe.Just(8));

    t.deepEqual(_0.get(9), Maybe.Just('J'));
    t.deepEqual(_1.get('J'), Maybe.Just(9));

    t.deepEqual(_0.get(10), Maybe.Just('K'));
    t.deepEqual(_1.get('K'), Maybe.Just(10));

    t.deepEqual(_0.get(11), Maybe.Just('L'));
    t.deepEqual(_1.get('L'), Maybe.Just(11));

    t.deepEqual(_0.get(12), Maybe.Just('M'));
    t.deepEqual(_1.get('M'), Maybe.Just(12));

    t.deepEqual(_0.get(13), Maybe.Just('N'));
    t.deepEqual(_1.get('N'), Maybe.Just(13));

    t.deepEqual(_0.get(14), Maybe.Just('O'));
    t.deepEqual(_1.get('O'), Maybe.Just(14));

    t.deepEqual(_0.get(15), Maybe.Just('P'));
    t.deepEqual(_1.get('P'), Maybe.Just(15));

    t.deepEqual(_0.get(16), Maybe.Just('Q'));
    t.deepEqual(_1.get('Q'), Maybe.Just(16));

    t.deepEqual(_0.get(17), Maybe.Just('R'));
    t.deepEqual(_1.get('R'), Maybe.Just(17));

    t.deepEqual(_0.get(18), Maybe.Just('S'));
    t.deepEqual(_1.get('S'), Maybe.Just(18));

    t.deepEqual(_0.get(19), Maybe.Just('T'));
    t.deepEqual(_1.get('T'), Maybe.Just(19));

    t.deepEqual(_0.get(20), Maybe.Just('U'));
    t.deepEqual(_1.get('U'), Maybe.Just(20));

    t.deepEqual(_0.get(21), Maybe.Just('V'));
    t.deepEqual(_1.get('V'), Maybe.Just(21));

    t.deepEqual(_0.get(22), Maybe.Just('W'));
    t.deepEqual(_1.get('W'), Maybe.Just(22));

    t.deepEqual(_0.get(23), Maybe.Just('X'));
    t.deepEqual(_1.get('X'), Maybe.Just(23));

    t.deepEqual(_0.get(24), Maybe.Just('Y'));
    t.deepEqual(_1.get('Y'), Maybe.Just(24));

    t.deepEqual(_0.get(25), Maybe.Just('Z'));
    t.deepEqual(_1.get('Z'), Maybe.Just(25));
});

test.todo('Dict.member()');

test('Dict.insert()', t => {
    const _0_0 = Dict.singleton('S', 0);

    t.deepEqual(
        _0_0.serialize(),
        node('black', 'S', 0, null, null),
        'S-0'
    );

    const _0_1 = _0_0.insert('E', 1);

    t.deepEqual(
        _0_1.serialize(),
        node('black', 'S', 0,
            node('red', 'E', 1, null, null),
            null
        ),
        'S-0 E-1'
    );

    const _0_2 = _0_1.insert('A', 2);

    t.deepEqual(
        _0_2.serialize(),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0, null, null)
        ),
        'S-0 E-1 A-2'
    );

    const _0_3 = _0_2.insert('R', 3);

    t.deepEqual(
        _0_3.serialize(),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0,
                node('red', 'R', 3, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3'
    );

    const _0_4 = _0_3.insert('C', 4);

    t.deepEqual(
        _0_4.serialize(),
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

    const _0_5 = _0_4.insert('H', 5);

    t.deepEqual(
        _0_5.serialize(),
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

    const _0_6 = _0_5.insert('X', 6);

    t.deepEqual(
        _0_6.serialize(),
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

    const _0_7 = _0_6.insert('M', 7);

    t.deepEqual(
        _0_7.serialize(),
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

    const _0_8 = _0_7.insert('P', 8);

    t.deepEqual(
        _0_8.serialize(),
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

    const _0_9 = _0_8.insert('L', 9);

    t.deepEqual(
        _0_9.serialize(),
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

    const _1_0: Dict<string, number> = Dict.empty.insert('A', 0);

    t.deepEqual(
        _1_0.serialize(),
        node('black', 'A', 0, null, null),
        'A-0'
    );

    const _1_1 = _1_0.insert('C', 1);

    t.deepEqual(
        _1_1.serialize(),
        node('black', 'C', 1,
            node('red', 'A', 0, null, null),
            null
        ),
        'A-0 C-1'
    );

    const _1_2 = _1_1.insert('E', 2);

    t.deepEqual(
        _1_2.serialize(),
        node('black', 'C', 1,
            node('black', 'A', 0, null, null),
            node('black', 'E', 2, null, null)
        ),
        'A-0 C-1 E-2'
    );

    const _1_3 = _1_2.insert('H', 3);

    t.deepEqual(
        _1_3.serialize(),
        node('black', 'C', 1,
            node('black', 'A', 0, null, null),
            node('black', 'H', 3,
                node('red', 'E', 2, null, null),
                null
            )
        ),
        'A-0 C-1 E-2 H-3'
    );

    const _1_4 = _1_3.insert('L', 4);

    t.deepEqual(
        _1_4.serialize(),
        node('black', 'H', 3,
            node('red', 'C', 1,
                node('black', 'A', 0, null, null),
                node('black', 'E', 2, null, null)
            ),
            node('black', 'L', 4, null, null)
        ),
        'A-0 C-1 E-2 H-3 L-4'
    );

    const _1_5 = _1_4.insert('M', 5);

    t.deepEqual(
        _1_5.serialize(),
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

    const _1_6 = _1_5.insert('P', 6);

    t.deepEqual(
        _1_6.serialize(),
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

    const _1_7 = _1_6.insert('R', 7);

    t.deepEqual(
        _1_7.serialize(),
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

    const _1_8 = _1_7.insert('S', 8);

    t.deepEqual(
        _1_8.serialize(),
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

    const _1_9 = _1_8.insert('X', 9);

    t.deepEqual(
        _1_9.serialize(),
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
});

test.todo('Dict.update()');

test.todo('Dict.remove()');

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
