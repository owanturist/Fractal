// tslint:disable:max-line-length

import test from 'ava';

import * as Basics from '../src/Basics';
import Dict from '../src/Dict';
import Maybe from '../src/Maybe';
import Either from '../src/Either';

export class ID implements Basics.Comparable<ID> {
    constructor(private readonly id: string) {}

    public compareTo(another: ID): Basics.Order {
        if (this.id < another.id) {
            return Basics.Order.LT;
        }

        if (this.id > another.id) {
            return Basics.Order.GT;
        }

        return Basics.Order.EQ;
    }
}

type Serialization<K, T> = null | {
    height: number;
    key: K;
    value: T;
    left: Serialization<K, T>;
    right: Serialization<K, T>;
};

interface Validation {
    count: number;
    height: number;
}

const validateNode = <K, T>(minKey: Maybe<K>, maxKey: Maybe<K>, x: Serialization<K, T>): Either<string, Validation> => {
    if (x === null) {
        return Either.Right({ count: 0, height: 0 });
    }

    if (minKey.map(min => x.key <= min).getOrElse(false)) {
        return Either.Left(`Right key "${x.key}" less than parent key "${minKey.getOrElse(x.key)}"`);
    }

    if (maxKey.map(max => x.key >= max).getOrElse(false)) {
        return Either.Left(`Left key "${x.key}" more than parent key "${maxKey.getOrElse(x.key)}"`);
    }

    return Either.shape<string, { left: Validation; right: Validation }>({
        left: validateNode(minKey, Maybe.Just(x.key), x.left),
        right: validateNode(Maybe.Just(x.key), maxKey, x.right)
    }).chain(({ left, right }) => {
        const lh = x.left === null ? 0 : x.left.height;
        const rh = x.right === null ? 0 : x.right.height;

        if (lh !== left.height) {
            return Either.Left(`Left height of "${x.key}" is ${lh} but expects ${left.height}`);
        }

        if (rh !== right.height) {
            return Either.Left(`Right height of "${x.key}" is ${rh} but expects ${right.height}`);
        }

        const diff = lh - rh;

        if (diff < - 1 || diff > 1) {
            return Either.Left(`Unbalanced node "${x.key}": ${diff}`);
        }

        return Either.Right({
            count: left.count + right.count + 1,
            height: Math.max(left.height, right.height) + 1
        });
    });
};

export const validate = <K extends Dict.Key, T>(dict: Dict<K, T>): Maybe<string> => {
    return validateNode(Maybe.Nothing, Maybe.Nothing, serializeNode((dict as unknown as { root: Node<K, T>}).root)).fold(
        Maybe.Just,
        ({ count }) => dict.size() === count
            ? Maybe.Nothing
            : Maybe.Just(`Size is ${dict.size} but expects ${count}`)
    );
};

export const validateBatch = <K extends Dict.Key, T>(pairs: Array<[ K, T ]>): Either<string, Dict<K, T>> => {
    return pairs.reduce(
        (acc, [ key, value ]) => acc.chain(dict => {
            const next = dict.insert(key, value);

            return validate(next).fold<Either<string, Dict<K, T>>>(
                () => Either.Right(next),
                Either.Left
            );
        }),
        Either.Right(Dict.empty as Dict<K, T>)
    );
};

type Node<K, T> = {} | {
    height: number;
    key: K;
    value: T;
    left: Node<K, T>;
    right: Node<K, T>;
};

const serializeNode = <K, T>(node: Node<K, T>): Serialization<K, T> => {
    return 'key' in node ? {
        height: node.height,
        key: node.key,
        value: node.value,
        left: serializeNode(node.left),
        right: serializeNode(node.right)
    } : null;
};

export const serialize = <K extends Dict.Key, T>(dict: Dict<K, T>): Serialization<K, T> => {
    return serializeNode((dict as unknown as { root: Node<K, T>}).root);
};

export const toList = <K extends Dict.Key, T>(dict: Dict<K, T>): Either<string, Array<[ K, T ]>> => {
    return validate(dict).fold<Either<string, Array<[ K, T ]>>>(
        () => Either.Right(dict.entries()),
        Either.Left
    );
};

export const toKeyValueString = <K extends Dict.Key, T>(
    keyToString: (key: K) => string,
    valueToString: (key: T) => string,
    dict: Dict<K, T>
): Either<string, string> => {
    return toList(dict).map(
        list => list.map(([ key, value ]) => keyToString(key) + '-' + valueToString(value)).join(' ')
    );
};

const range = (start: number, end: number): Array<number> => {
    if (start < end) {
        const sequence: Array<number> = new Array(end - start + 1);

        for (let i = 0; i < sequence.length; i++) {
            sequence[ i ] = start + i;
        }

        return sequence;
    }

    const sequence: Array<number> = new Array(start - end + 1);

    for (let i = 0; i < sequence.length; i++) {
        sequence[ i ] = start - i;
    }

    return sequence;
};

const alphabet = Dict.fromList(
    char => char.charCodeAt(0) - 'A'.charCodeAt(0),
    char => char,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
);

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

    t.deepEqual(validate(alphabet), Maybe.Nothing);
    t.deepEqual(validate(_0), Maybe.Nothing);

    t.is(alphabet.size(), 26);
    t.is(_0.size(), 26);

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

test('Dict.min()', t => {
    t.deepEqual(Dict.empty.min(), Maybe.Nothing);
    t.deepEqual(Dict.singleton(0, 'A').min(), Maybe.Just([ 0, 'A' ]));
    t.deepEqual(alphabet.min(), Maybe.Just([ 0, 'A' ]));
});

test('Dict.max()', t => {
    t.deepEqual(Dict.empty.max(), Maybe.Nothing);
    t.deepEqual(Dict.singleton(0, 'A').max(), Maybe.Just([ 0, 'A' ]));
    t.deepEqual(alphabet.max(), Maybe.Just([ 25, 'Z' ]));
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
    const _0 = (Dict.empty as Dict<string, number>).insert('A', 0);
    t.deepEqual(toKeyValueString(String, String, _0), Either.Right('A-0'));

    const _1 = _0.insert('A', 1);
    t.deepEqual(toKeyValueString(String, String, _1), Either.Right('A-1'));

    const _2 = _1.insert('B', 1);
    t.deepEqual(toKeyValueString(String, String, _2), Either.Right('A-1 B-1'));

    const _3 = _2.insert('A', 2);
    t.deepEqual(toKeyValueString(String, String, _3), Either.Right('A-2 B-1'));

    const _4 = _3.insert('A', 0).insert('B', 2);
    t.deepEqual(toKeyValueString(String, String, _4), Either.Right('A-0 B-2'));
});

test('Dict.insert() random order insertion', t => {
    const _0 = Dict.singleton('S', 0);
    t.deepEqual(
        toKeyValueString(String, String, _0),
        Either.Right('S-0')
    );

    const _1 = _0.insert('E', 1);
    t.deepEqual(
        toKeyValueString(String, String, _1),
        Either.Right('E-1 S-0')
    );

    const _2 = _1.insert('A', 2);
    t.deepEqual(
        toKeyValueString(String, String, _2),
        Either.Right('A-2 E-1 S-0')
    );

    const _3 = _2.insert('R', 3);
    t.deepEqual(
        toKeyValueString(String, String, _3),
        Either.Right('A-2 E-1 R-3 S-0')
    );

    const _4 = _3.insert('C', 4);
    t.deepEqual(
        toKeyValueString(String, String, _4),
        Either.Right('A-2 C-4 E-1 R-3 S-0')
    );

    const _5 = _4.insert('H', 5);
    t.deepEqual(
        toKeyValueString(String, String, _5),
        Either.Right('A-2 C-4 E-1 H-5 R-3 S-0')
    );

    const _6 = _5.insert('X', 6);
    t.deepEqual(
        toKeyValueString(String, String, _6),
        Either.Right('A-2 C-4 E-1 H-5 R-3 S-0 X-6')
    );

    const _7 = _6.insert('M', 7);
    t.deepEqual(
        toKeyValueString(String, String, _7),
        Either.Right('A-2 C-4 E-1 H-5 M-7 R-3 S-0 X-6')
    );

    const _8 = _7.insert('P', 8);
    t.deepEqual(
        toKeyValueString(String, String, _8),
        Either.Right('A-2 C-4 E-1 H-5 M-7 P-8 R-3 S-0 X-6')
    );

    const _9 = _8.insert('L', 9);
    t.deepEqual(
        toKeyValueString(String, String, _9),
        Either.Right('A-2 C-4 E-1 H-5 L-9 M-7 P-8 R-3 S-0 X-6')
    );
});

test('Dict.insert() increasing batch', t => {
    const _0: Array<[ number, string ]> = range(0, 999).map((i): [ number, string ] => [ i, `_${i}_`]);
    t.deepEqual(
        validateBatch(_0).chain(toList),
        Either.Right(_0)
    );

    const _1: Array<[ number, string ]> = range(999, 0).map((i): [ number, string ] => [ i, `_${i}_`]);
    t.deepEqual(
        validateBatch(_1).chain(toList),
        Either.Right(_1.reverse())
    );
});

test('Dict.update()', t => {
    t.is(alphabet.size(), 26);
    t.deepEqual(alphabet.get(0), Maybe.Just('A'));

    const _0 = alphabet.update(0, () => Maybe.Nothing);
    t.is(_0.size(), 25);
    t.deepEqual(_0.get(0), Maybe.Nothing);

    const _1 = alphabet.update(0, val => val.map(char => char + char));
    t.is(_1.size(), 26);
    t.deepEqual(_1.get(0), Maybe.Just('AA'));

    const _2 = alphabet.update(100, val => val.map(char => char + char));
    t.is(_2.size(), 26);
    t.deepEqual(_2.get(100), Maybe.Nothing);

    const _3 = alphabet.update(100, val => val.map(char => char + char).orElse(() => Maybe.Just('!')));
    t.is(_3.size(), 27);
    t.deepEqual(_3.get(100), Maybe.Just('!'));
});

test('Dict.remove()', t => {
    const _0 = (Dict.empty as Dict<string, number>).remove('A');
    t.deepEqual(toKeyValueString(String, String, _0), Either.Right(''));

    const _1 = Dict.singleton('A', 1).remove('B');
    t.deepEqual(toKeyValueString(String, String, _1), Either.Right('A-1'));

    const _2 = Dict.singleton('A', 1).remove('A');
    t.deepEqual(toKeyValueString(String, String, _2), Either.Right(''));

    const _3 = alphabet.remove(0).remove(10).remove(20).remove(30);
    t.deepEqual(validate(_3), Maybe.Nothing);
    t.false(_3.member(0));
    t.false(_3.member(10));
    t.false(_3.member(20));
    t.false(_3.member(30));
});

test('Dict.size()', t => {
    t.is(Dict.empty.size(), 0);
    t.is(Dict.singleton('A', 0).size(), 1);
    t.is(alphabet.size(), 26);
    t.is(alphabet.insert(0, 'A').size(), 26);
    t.is(alphabet.insert(100, 'A').size(), 27);
    t.is(alphabet.remove(100).size(), 26);
    t.is(alphabet.remove(0).size(), 25);
});

test('Dict.isEmpty()', t => {
    t.true(Dict.empty.isEmpty());
    t.true(Dict.singleton('A', 0).remove('A').isEmpty());
    t.false(Dict.singleton('A', 0).isEmpty());
    t.false(alphabet.isEmpty());
});

test('Dict.map()', t => {
    const _0 = Dict.fromList(i => i, i => i, range(0, 9));

    t.deepEqual(
        toList(_0.map((key, value) => `${key}_${value}`)),
        Either.Right<Array<[ number, string ]>>([
            [ 0, '0_0' ],
            [ 1, '1_1' ],
            [ 2, '2_2' ],
            [ 3, '3_3' ],
            [ 4, '4_4' ],
            [ 5, '5_5' ],
            [ 6, '6_6' ],
            [ 7, '7_7' ],
            [ 8, '8_8' ],
            [ 9, '9_9' ]
        ])
    );
});

test('Dict.filter()', t => {
    t.deepEqual(
        toList(alphabet.filter((key, value) => key > 0 && key < 8 || value === 'X')),
        Either.Right<Array<[ number, string ]>>([
            [ 1, 'B' ],
            [ 2, 'C' ],
            [ 3, 'D' ],
            [ 4, 'E' ],
            [ 5, 'F' ],
            [ 6, 'G' ],
            [ 7, 'H' ],
            [ 23, 'X' ]
        ])
    );
});

test('Dict.partition()', t => {
    const [ left, right ] = alphabet.partition((key, value) => key > 0 && key < 8 || value === 'X');

    t.deepEqual(
        toList(left),
        Either.Right<Array<[ number, string ]>>([
            [ 1, 'B' ],
            [ 2, 'C' ],
            [ 3, 'D' ],
            [ 4, 'E' ],
            [ 5, 'F' ],
            [ 6, 'G' ],
            [ 7, 'H' ],
            [ 23, 'X' ]
        ])
    );

    t.deepEqual(
        toList(right),
        Either.Right<Array<[ number, string ]>>([
            [ 0, 'A' ],
            [ 8, 'I' ],
            [ 9, 'J' ],
            [ 10, 'K' ],
            [ 11, 'L' ],
            [ 12, 'M' ],
            [ 13, 'N' ],
            [ 14, 'O' ],
            [ 15, 'P' ],
            [ 16, 'Q' ],
            [ 17, 'R' ],
            [ 18, 'S' ],
            [ 19, 'T' ],
            [ 20, 'U' ],
            [ 21, 'V' ],
            [ 22, 'W' ],
            [ 24, 'Y' ],
            [ 25, 'Z' ]
        ])
    );
});

test('Dict.foldl()', t => {
    const _0 = Dict.fromList(i => i + 1, i => i, range(0, 9));

    t.deepEqual(
        _0.foldl((key, value, acc: Array<string>) => [ ...acc, `${key}_${value}` ], []),
        [ '1_0', '2_1', '3_2', '4_3', '5_4', '6_5', '7_6', '8_7', '9_8', '10_9' ]
    );
});

test('Dict.foldr()', t => {
    const _0 = Dict.fromList(i => i + 1, i => i, range(0, 9));

    t.deepEqual(
        _0.foldr((key, value, acc: Array<string>) => [ ...acc, `${key}_${value}` ], []),
        [ '10_9', '9_8', '8_7', '7_6', '6_5', '5_4', '4_3', '3_2', '2_1', '1_0' ]
    );
});

test('Dict.union()', t => {
    const _0 = Dict.fromList([[ 1, 'A' ], [ 2, 'B' ], [ 3, 'C' ], [ 4, 'D' ]]);
    const _1 = Dict.fromList([[ 3, 'D' ], [ 4, 'E' ], [ 5, 'F' ], [ 6, 'G' ]]);

    t.deepEqual(
        _0.union(Dict.empty as Dict<number, string>).entries(),
        _0.entries()
    );

    t.deepEqual(
        (Dict.empty as Dict<number, string>).union(_1).entries(),
        _1.entries()
    );

    t.deepEqual(
        _0.union(_1).entries(),
        [[ 1, 'A' ], [ 2, 'B' ], [ 3, 'C' ], [ 4, 'D' ], [ 5, 'F' ], [ 6, 'G' ]]
    );
});

test('Dict.intersect()', t => {
    const _0 = Dict.fromList([[ 1, 'A' ], [ 2, 'B' ], [ 3, 'C' ], [ 4, 'D' ]]);
    const _1 = Dict.fromList([[ 3, 'D' ], [ 4, 'E' ], [ 5, 'F' ], [ 6, 'G' ]]);

    t.deepEqual(
        _0.intersect(Dict.empty as Dict<number, string>).entries(),
        []
    );

    t.deepEqual(
        (Dict.empty as Dict<number, string>).intersect(_1).entries(),
        []
    );

    t.deepEqual(
        _0.intersect(_1).entries(),
        [[ 3, 'C' ], [ 4, 'D' ]]
    );
});

test('Dict.diff()', t => {
    const _0 = Dict.fromList([[ 1, 'A' ], [ 2, 'B' ], [ 3, 'C' ], [ 4, 'D' ]]);
    const _1 = Dict.fromList([[ 3, 'D' ], [ 4, 'E' ], [ 5, 'F' ], [ 6, 'G' ]]);

    t.deepEqual(
        _0.diff(Dict.empty as Dict<number, string>).entries(),
        _0.entries()
    );

    t.deepEqual(
        (Dict.empty as Dict<number, string>).diff(_1).entries(),
        []
    );

    t.deepEqual(
        _0.diff(_1).entries(),
        [[ 1, 'A' ], [ 2, 'B' ]]
    );
});

test('Dict.merge()', t => {
    const _0 = Dict.fromList([[ 1, 'A' ], [ 2, 'B' ], [ 3, 'C' ], [ 4, 'D' ]]);
    const _1 = Dict.fromList([[ 3, 4 ], [ 4, 2 ], [ 5, 3 ], [ 6, 1 ]]);

    const merge = (left: Dict<number, string>, right: Dict<number, number>): Array<string> => {
        return left.merge(
            (key, l, acc) => [ ...acc, `${key}_${l}` ],
            (key, l, r, acc) => [ ...acc, `${key}_${l.repeat(r)}` ],
            (key, r, acc) => [ ...acc, key.toString().repeat(r) ],
            right,
            [] as Array<string>
        );
    };

    t.deepEqual(
        merge(_0, Dict.empty as Dict<number, number>),
        [ '1_A', '2_B', '3_C', '4_D' ]
    );

    t.deepEqual(
        merge(Dict.empty as Dict<number, string>, _1),
        [ '3333', '44', '555', '6' ]
    );

    t.deepEqual(
        merge(_0, _1),
        [ '1_A', '2_B', '3_CCCC', '4_DD', '555', '6' ]
    );
});

test('Dict.keys()', t => {
    t.deepEqual(Dict.empty.keys(), []);
    t.deepEqual(Dict.singleton(0, 'A').keys(), [ 0 ]);
    t.deepEqual(alphabet.keys(), [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 ]);
});

test('Dict.values()', t => {
    t.deepEqual(Dict.empty.values(), []);
    t.deepEqual(Dict.singleton(0, 'A').values(), [ 'A' ]);
    t.deepEqual(alphabet.values(), [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ]);
});

test('Dict.entries()', t => {
    t.deepEqual(Dict.empty.entries(), []);
    t.deepEqual(Dict.singleton(0, 'A').entries(), [[ 0, 'A' ]]);

    t.deepEqual(alphabet.entries(), [
        [ 0, 'A' ],
        [ 1, 'B' ],
        [ 2, 'C' ],
        [ 3, 'D' ],
        [ 4, 'E' ],
        [ 5, 'F' ],
        [ 6, 'G' ],
        [ 7, 'H' ],
        [ 8, 'I' ],
        [ 9, 'J' ],
        [ 10, 'K' ],
        [ 11, 'L' ],
        [ 12, 'M' ],
        [ 13, 'N' ],
        [ 14, 'O' ],
        [ 15, 'P' ],
        [ 16, 'Q' ],
        [ 17, 'R' ],
        [ 18, 'S' ],
        [ 19, 'T' ],
        [ 20, 'U' ],
        [ 21, 'V' ],
        [ 22, 'W' ],
        [ 23, 'X' ],
        [ 24, 'Y' ],
        [ 25, 'Z' ]
    ]);
});
