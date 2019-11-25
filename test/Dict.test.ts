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
    const _0: Dict<string, number> = Dict.empty.insert('S', 0);

    t.deepEqual(
        _0.serialize(),
        node('black', 'S', 0, null, null),
        'S-0'
    );

    const _1 = _0.insert('E', 1);

    t.deepEqual(
        _1.serialize(),
        node('black', 'S', 0,
            node('red', 'E', 1, null, null),
            null
        ),
        'S-0 E-1'
    );

    const _2 = _1.insert('A', 2);

    t.deepEqual(
        _2.serialize(),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0, null, null)
        ),
        'S-0 E-1 A-2'
    );

    const _3 = _2.insert('R', 3);

    t.deepEqual(
        _3.serialize(),
        node('black', 'E', 1,
            node('black', 'A', 2, null, null),
            node('black', 'S', 0,
                node('red', 'R', 3, null, null),
                null
            )
        ),
        'S-0 E-1 A-2 R-3'
    );

    const _4 = _3.insert('C', 4);

    t.deepEqual(
        _4.serialize(),
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

    const _5 = _4.insert('H', 5);

    t.deepEqual(
        _5.serialize(),
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

    const _6 = _5.insert('X', 6);

    t.deepEqual(
        _6.serialize(),
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

    const _7 = _6.insert('M', 7);

    t.deepEqual(
        _7.serialize(),
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

    const _8 = _7.insert('P', 8);

    t.deepEqual(
        _8.serialize(),
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

    const _9 = _8.insert('L', 9);

    t.deepEqual(
        _9.serialize(),
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
