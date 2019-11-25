import test from 'ava';

import Dict, { Serialization } from '../src/Dict';

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

test.todo('Dict.get()');

test.todo('Dict.member()');

test('Dict.insert()', t => {
    const _0_0: Dict<string, number> = Dict.empty.insert('S', 0);

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
