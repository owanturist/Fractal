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
    return validateNode(Maybe.Nothing, Maybe.Nothing, serializeNode((dict as any).root)).fold(
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

const serializeNode = (node: any): Serialization<any, any> => {
    return 'key' in node ? {
        height: node.height,
        key: node.key,
        value: node.value,
        left: serializeNode(node.left),
        right: serializeNode(node.right)
    } : null;
};

export const serialize = <K extends Dict.Key, T>(dict: Dict<K, T>): Serialization<K, T> => {
    return serializeNode((dict as any).root);
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
    const [ lo, hi ] = start < end ? [ start, end ] : [ end, start ];
    const sequence: Array<number> = new Array(hi - lo + 1);

    for (let i = 0; i < sequence.length; i++) {
        sequence[ i ] = lo + i;
    }

    return sequence;
};

const alphabet = Dict.fromList(
    char => char.charCodeAt(0) - 'A'.charCodeAt(0),
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
    t.deepEqual(toList(_0), Either.Right<Array<[ string, number ]>>([[ 'A', 0 ]]));

    const _1 = Dict.singleton('A', 0).insert('A', 1);
    t.deepEqual(toList(_1), Either.Right<Array<[ string, number ]>>([[ 'A', 1 ]]));

    const _2 = Dict.singleton('A', 0).insert('B', 1);
    t.deepEqual(toList(_2), Either.Right<Array<[ string, number ]>>([[ 'A', 0 ], [ 'B', 1 ]]));

    const _3 = Dict.singleton('A', 0).insert('B', 1).insert('A', 2);
    t.deepEqual(toList(_3), Either.Right<Array<[ string, number ]>>([[ 'A', 2 ], [ 'B', 1 ]]));

    const _4 = Dict.singleton('A', 0).insert('B', 1).insert('B', 2);
    t.deepEqual(toList(_4), Either.Right<Array<[ string, number ]>>([[ 'A', 0 ], [ 'B', 2 ]]));
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

test('Dict.insert() increasing order insertion', t => {
    const _0: Array<[ number, string ]> = range(0, 999).map((i): [ number, string ] => [ i, `_${i}_`]);

    t.deepEqual(
        validateBatch(_0).chain(toList),
        Either.Right(_0)
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
