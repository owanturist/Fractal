import test from 'ava';

import {
    Nothing,
    Just
} from '../src/Maybe';
import {
    List
} from '../src/List';

interface Movie {
    readonly id: number;
    readonly title: string;
}

const movie = (id: number, title: string): Movie => ({ id, title });

test('List.isList()', t => {
    t.false(List.isList(null));
    t.false(List.isList(undefined));
    t.false(List.isList(''));
    t.false(List.isList(0));
    t.false(List.isList(false));
    t.false(List.isList(false));
    t.false(List.isList([]));
    t.false(List.isList({}));
    t.true(List.isList(List.fromArray([])));
});

test('List.fromArray() & List.prototype.toArray()', t => {
    t.deepEqual(List.fromArray([]).toArray(), []);
    t.deepEqual(List.fromArray([ 0 ]).toArray(), [ 0 ]);
    t.deepEqual(List.fromArray([ 'str' ]).toArray(), [ 'str' ]);
    t.deepEqual(List.fromArray([ true ]).toArray(), [ true ]);
    t.deepEqual(List.fromArray([[]]).toArray(), [[]]);
    t.deepEqual(List.fromArray([{}]).toArray(), [{}]);

    const array = [ 0, 1, 2 ];
    const list = List.fromArray(array);

    t.deepEqual(list.toArray(), array);
    t.not(list.toArray(), array);
    t.deepEqual(
        array,
        [ 0, 1, 2 ],
        'Array hasn\'t been mutated'
    );
});

test('List.toArray()', t => {
    t.deepEqual(
        List.toArray(List.fromArray([])),
        []
    );
    t.deepEqual(
        List.toArray([]),
        []
    );

    t.deepEqual(
        List.toArray(List.fromArray([ 0 ])),
        [ 0 ]
    );
    t.deepEqual(
        List.toArray([ 0 ]),
        [ 0 ]
    );

    t.deepEqual(
        List.toArray(List.fromArray([ 'str' ])),
        [ 'str' ]
    );
    t.deepEqual(
        List.toArray([ 'str' ]),
        [ 'str' ]
    );

    t.deepEqual(
        List.toArray(List.fromArray([ true ])),
        [ true ]
    );
    t.deepEqual(
        List.toArray([ true ]),
        [ true ]
    );

    t.deepEqual(
        List.toArray(List.fromArray([[]])),
        [[]]
    );
    t.deepEqual(
        List.toArray([[]]),
        [[]]
    );

    t.deepEqual(
        List.toArray(List.fromArray([{}])),
        [{}]
    );
    t.deepEqual(
        List.toArray([{}]),
        [{}]
    );

    const array = [ 0, 1, 2 ];
    const list = List.fromArray(array);

    t.deepEqual(List.toArray(array), array);
    t.is(List.toArray(array), array);
    t.deepEqual(
        array,
        [ 0, 1, 2 ],
        'Array hasn\'t been mutated'
    );

    t.deepEqual(List.toArray(list), array);
    t.not(List.toArray(list), array);
    t.deepEqual(
        list,
        List.fromArray(array),
        'List hasn\'t been mutated'
    );
});

test('List.of()', t => {
    t.deepEqual(
        List.of(),
        List.fromArray([])
    );

    t.deepEqual(
        List.of(0),
        List.fromArray([ 0 ])
    );

    t.deepEqual(
        List.of('a', 'b', 'c'),
        List.fromArray([ 'a', 'b', 'c' ])
    );

    t.deepEqual(
        List.of(
            List.of(),
            List.of(1),
            List.of(1, 2)
        ),
        List.fromArray([
            List.fromArray([]),
            List.fromArray([ 1 ]),
            List.fromArray([ 1, 2 ])
        ])
    );
});

test('List.empty()', t => {
    t.deepEqual(
        List.empty(),
        List.fromArray([])
    );
});

test('List.singleton()', t => {
    t.deepEqual(
        List.singleton(0),
        List.fromArray([ 0 ])
    );

    t.deepEqual(
        List.singleton('str'),
        List.fromArray([ 'str' ])
    );

    t.deepEqual(
        List.singleton(false),
        List.fromArray([ false ])
    );

    t.deepEqual(
        List.singleton([]),
        List.fromArray([[]])
    );

    t.deepEqual(
        List.singleton({}),
        List.fromArray([{}])
    );
});

test('List.repeat()', t => {
    t.deepEqual(
        List.repeat(-1, 'str'),
        List.fromArray([])
    );

    t.deepEqual(
        List.repeat(0, 'str'),
        List.fromArray([])
    );

    t.deepEqual(
        List.repeat(1, 'str'),
        List.fromArray([ 'str' ])
    );

    t.deepEqual(
        List.repeat(5, 'str'),
        List.fromArray([ 'str', 'str', 'str', 'str', 'str' ])
    );
});

test('List.initialize()', t => {
    const initializator = (element: number): number => element * element;

    t.deepEqual(
        List.initialize(-1, initializator),
        List.fromArray([])
    );

    t.deepEqual(
        List.initialize(0, initializator),
        List.fromArray([])
    );

    t.deepEqual(
        List.initialize(1, initializator),
        List.fromArray([ 0 ])
    );

    t.deepEqual(
        List.initialize(5, initializator),
        List.fromArray([ 0, 1, 4, 9, 16 ])
    );
});

test('List.range()', t => {
    t.deepEqual(
        List.range(0, 0),
        List.fromArray([ 0 ])
    );

    t.deepEqual(
        List.range(0, 1),
        List.fromArray([ 0, 1 ])
    );

    t.deepEqual(
        List.range(1, 0),
        List.fromArray([])
    );

    t.deepEqual(
        List.range(1, 1),
        List.fromArray([ 1 ])
    );

    t.deepEqual(
        List.range(-2, 2),
        List.fromArray([ -2, -1, 0, 1, 2 ])
    );
});

test('List.zip()', t => {
    t.deepEqual(
        List.zip([], []),
        List.fromArray([])
    );

    t.deepEqual(
        List.zip(
            [ 0 ],
            []
        ),
        List.fromArray([])
    );

    t.deepEqual(
        List.zip(
            [],
            [ '0' ]
        ),
        List.fromArray([])
    );

    t.deepEqual(
        List.zip(
            [ 0, 1, 2, 3, 4 ],
            [ '0', '1', '2', '3', '4' ]
        ),
        List.fromArray([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ],
            [ 3, '3' ],
            [ 4, '4' ]
        ])
    );

    t.deepEqual(
        List.zip(
            [ 0, 1, 2, 3, 4 ],
            List.fromArray([ '0', '1', '2', '3', '4' ])
        ),
        List.fromArray([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ],
            [ 3, '3' ],
            [ 4, '4' ]
        ])
    );

    t.deepEqual(
        List.zip(
            List.fromArray([ 0, 1, 2, 3, 4 ]),
            [ '0', '1', '2', '3', '4' ]
        ),
        List.fromArray([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ],
            [ 3, '3' ],
            [ 4, '4' ]
        ])
    );

    t.deepEqual(
        List.zip(
            List.fromArray([ 0, 1, 2, 3, 4 ]),
            List.fromArray([ '0', '1', '2', '3', '4' ])
        ),
        List.fromArray([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ],
            [ 3, '3' ],
            [ 4, '4' ]
        ])
    );

    const first = [ 0, 1, 2 ];
    const second = List.fromArray([ '0', '1', '2' ]);

    t.deepEqual(
        List.zip(first, second),
        List.fromArray([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ]
        ])
    );
    t.deepEqual(
        first,
        [ 0, 1, 2 ],
        'Array hasn\'t been mutated'
    );
    t.deepEqual(
        second,
        List.fromArray([ '0', '1', '2' ]),
        'List hasn\'t been mutated'
    );

    t.deepEqual(
        List.zip(
            [ 4, 3, 2, 1 ],
            [ 5, 4, 3, 2, 1 ],
            [ 6, 5, 4, 3, 2, 1 ]
        ),
        List.fromArray([
            [ 4, 5, 6 ],
            [ 3, 4, 5 ],
            [ 2, 3, 4 ],
            [ 1, 2, 3 ]
        ])
    );

    t.deepEqual(
        List.zip(
            List.fromArray([ 4, 3, 2, 1 ]),
            [ 5, 4, 3, 2, 1 ],
            List.fromArray([ 6, 5, 4, 3, 2, 1 ]),
            [ 7, 6, 5, 4, 3, 2, 1 ]
        ),
        List.fromArray([
            [ 4, 5, 6, 7 ],
            [ 3, 4, 5, 6 ],
            [ 2, 3, 4, 5 ],
            [ 1, 2, 3, 4 ]
        ])
    );
});

test('List.unzip()', t => {
    t.deepEqual(
        List.unzip<number, string>([]),
        [
            List.fromArray<number>([]),
            List.fromArray<string>([]),
            List.fromArray([]),
            List.fromArray([])
        ]
    );

    const array: Array<[ number, string ]> = [
        [ 0, '0' ]
    ];

    t.deepEqual(
        List.unzip(array),
        [
            List.fromArray([ 0 ]),
            List.fromArray([ '0' ])
        ]
    );
    t.deepEqual(
        array,
        [
            [ 0, '0' ]
        ],
        'Array hasn\'t been mutated'
    );

    const list = List.fromArray<[ number, string ]>([
        [ 0, '0' ],
        [ 1, '1' ],
        [ 2, '2' ]
    ]);

    t.deepEqual(
        List.unzip(list),
        [
            List.fromArray([ 0, 1, 2 ]),
            List.fromArray([ '0', '1', '2' ])
        ]
    );
    t.deepEqual(
        list,
        List.fromArray<[ number, string ]>([
            [ 0, '0' ],
            [ 1, '1' ],
            [ 2, '2' ]
        ]),
        'List hasn\'t been mutated'
    );

    t.deepEqual(
        List.unzip([
            [ 4, 5, 6 ],
            [ 3, 4, 5 ],
            [ 2, 3, 4 ],
            [ 1, 2, 3 ]
        ]),
        [
            List.fromArray([ 4, 3, 2, 1 ]),
            List.fromArray([ 5, 4, 3, 2 ]),
            List.fromArray([ 6, 5, 4, 3 ])
        ]
    );

    t.deepEqual(
        List.unzip(List.fromArray<[ number, number, number, number ]>([
            [ 4, 5, 6, 7 ],
            [ 3, 4, 5, 6 ],
            [ 2, 3, 4, 5 ],
            [ 1, 2, 3, 4 ]
        ])),
        [
            List.fromArray([ 4, 3, 2, 1 ]),
            List.fromArray([ 5, 4, 3, 2 ]),
            List.fromArray([ 6, 5, 4, 3 ]),
            List.fromArray([ 7, 6, 5, 4 ])
        ]
    );
});

test('List.sum()', t => {
    t.is(
        List.sum([]),
        0
    );

    t.is(
        List.sum([ 0, 1 ]),
        1
    );

    const array = [ 0, 1, 2, 3, 4 ];

    t.is(List.sum(array), 10);
    t.deepEqual(
        array,
        [ 0, 1, 2, 3, 4 ],
        'Array hasn\'t been mutated'
    );

    const list = List.fromArray([ 0, 1, 2, 3, 4 ]);

    t.is(List.sum(list), 10);
    t.deepEqual(
        list,
        List.fromArray([ 0, 1, 2, 3, 4 ]),
        'List hasn\'t been mutated'
    );
});

test('List.product()', t => {
    t.is(
        List.product([]),
        1
    );

    t.is(
        List.product([ 0, 1 ]),
        0
    );

    const array = [ 1, 2, 3, 4 ];

    t.is(List.product(array), 24);
    t.deepEqual(
        array,
        [ 1, 2, 3, 4 ],
        'Array hasn\'t been mutated'
    );

    const list = List.fromArray([ 1, 2, 3, 4 ]);

    t.is(List.product(list), 24);
    t.deepEqual(
        list,
        List.fromArray([ 1, 2, 3, 4 ]),
        'List hasn\'t been mutated'
    );
});

test('List.minimum()', t => {
    t.deepEqual(
        List.minimum([]),
        Nothing()
    );

    t.deepEqual(
        List.minimum([ 0 ]),
        Just(0)
    );

    t.deepEqual(
        List.minimum([ 'a' ]),
        Just('a')
    );

    t.deepEqual(
        List.minimum([ 0, 1, -2, 2, -1 ]),
        Just(-2)
    );

    const array = [ 'b', 'c', 'a', 'e', 'd' ];

    t.deepEqual(List.minimum(array), Just('a'));
    t.deepEqual(
        array,
        [ 'b', 'c', 'a', 'e', 'd' ],
        'Array hasn\'t been mutated'
    );

    t.deepEqual(
        List.minimum(List.fromArray([ 0, 1, -2, 2, -1 ])),
        Just(-2)
    );

    const list = List.fromArray([ 'b', 'c', 'a', 'e', 'd' ]);

    t.deepEqual(List.minimum(list), Just('a'));
    t.deepEqual(
        list,
        List.fromArray([ 'b', 'c', 'a', 'e', 'd' ]),
        'List hasn\'t been mutated'
    );
});

test('List.maximum()', t => {
    t.deepEqual(
        List.maximum([]),
        Nothing()
    );

    t.deepEqual(
        List.maximum([ 0 ]),
        Just(0)
    );

    t.deepEqual(
        List.maximum([ 'a' ]),
        Just('a')
    );

    t.deepEqual(
        List.maximum([ 0, 1, -2, 2, -1 ]),
        Just(2)
    );

    const array = [ 'b', 'c', 'a', 'e', 'd' ];

    t.deepEqual(List.maximum(array), Just('e'));
    t.deepEqual(
        array,
        [ 'b', 'c', 'a', 'e', 'd' ],
        'Array hasn\'t been mutated'
    );

    t.deepEqual(
        List.maximum(List.fromArray([ 0, 1, -2, 2, -1 ])),
        Just(2)
    );

    const list = List.fromArray([ 'b', 'c', 'a', 'e', 'd' ]);

    t.deepEqual(List.maximum(list), Just('e'));
    t.deepEqual(
        list,
        List.fromArray([ 'b', 'c', 'a', 'e', 'd' ]),
        'List hasn\'t been mutated'
    );
});

test('List.props()', t => {
    t.deepEqual(
        List.props({}),
        List.fromArray([])
    );

    t.deepEqual(
        List.props({
            foo: [ 0 ]
        }),
        List.fromArray([
            {
                foo: 0
            }
        ])
    );

    t.deepEqual(
        List.props({
            foo: [],
            bar: []
        }),
        List.fromArray([])
    );

    t.deepEqual(
        List.props({
            foo: [],
            bar: [ '0' ]
        }),
        List.fromArray([])
    );

    t.deepEqual(
        List.props({
            foo: [ 0 ],
            bar: []
        }),
        List.fromArray([])
    );

    t.deepEqual(
        List.props({
            foo: [ 0 ],
            bar: [ '0' ]
        }),
        List.fromArray([
            {
                foo: 0,
                bar: '0'
            }
        ])
    );

    t.deepEqual(
        List.props({
            foo: [ 0, 1 ],
            bar: [ '0' ]
        }),
        List.fromArray([
            {
                foo: 0,
                bar: '0'
            }
        ])
    );

    t.deepEqual(
        List.props({
            foo: [ 0 ],
            bar: [ '0', '1' ]
        }),
        List.fromArray([
            {
                foo: 0,
                bar: '0'
            }
        ])
    );

    const object = {
        foo: [ 0, 1 ],
        bar: List.fromArray([ '0', '1' ])
    };

    t.deepEqual(
        List.props(object),
        List.fromArray([
            {
                foo: 0,
                bar: '0'
            },
            {
                foo: 1,
                bar: '1'
            }
        ])
    );

    t.deepEqual(
        object,
        {
            foo: [ 0, 1 ],
            bar: List.fromArray([ '0', '1' ])
        },
        'Object hasn\'t been mutated'
    );

    t.deepEqual(
        List.props({
            foo: [ 0, 1, 2, 3, 4, 5 ],
            bar: [ '5', '4', '3', '2', '1', '0' ],
            baz: List.fromArray<[ boolean, boolean ]>([
                [ false, false ],
                [ false, true ],
                [ true, false ],
                [ true, true ]
            ])
        }),
        List.fromArray([
            {
                foo: 0,
                bar: '5',
                baz: [ false, false ]
            },
            {
                foo: 1,
                bar: '4',
                baz: [ false, true ]
            },
            {
                foo: 2,
                bar: '3',
                baz: [ true, false ]
            },
            {
                foo: 3,
                bar: '2',
                baz: [ true, true ]
            }
        ])
    );
});

test('List.all()', t => {
    t.deepEqual(
        List.all([]),
        List.fromArray([])
    );

    t.deepEqual(
        List.all([
            [],
            List.fromArray([]),
            []
        ]),
        List.fromArray([])
    );

    const array = [
        [ 0, 1, 2 ],
        List.fromArray([]),
        [],
        List.fromArray([ 3, 4 ])
    ];

    t.deepEqual(
        List.all(array),
        List.fromArray([ 0, 1, 2, 3, 4 ])
    );
    t.deepEqual(
        array,
        [
            [ 0, 1, 2 ],
            List.fromArray([]),
            [],
            List.fromArray([ 3, 4 ])
        ],
        'Array hasn\'t been mutated'
    );

    const list = List.fromArray([
        [ 'a', 'b', 'c' ],
        List.fromArray([]),
        [],
        List.fromArray([ 'd', 'e' ])
    ]);

    t.deepEqual(
        List.all(list),
        List.fromArray([ 'a', 'b', 'c', 'd', 'e' ])
    );
    t.deepEqual(
        list,
        List.fromArray([
            [ 'a', 'b', 'c' ],
            List.fromArray([]),
            [],
            List.fromArray([ 'd', 'e' ])
        ]),
        'Object hasn\'t been mutated'
    );
});

test('List.prototype.isEmpty()', t => {
    t.false(List.fromArray([ 1 ]).isEmpty());
    t.false(List.fromArray([ 'str' ]).isEmpty());
    t.false(List.fromArray([ false ]).isEmpty());
    t.false(List.fromArray([[]]).isEmpty());
    t.false(List.fromArray([{}]).isEmpty());
    t.true(List.fromArray([]).isEmpty());
});

test('List.prototype.size()', t => {
    t.is(List.fromArray([]).size(), 0);
    t.is(List.fromArray([ 0 ]).size(), 1);
    t.is(List.fromArray([ 0, 1, 2 ]).size(), 3);
});

test('List.prototype.count()', t => {
    t.is(
        List.fromArray([ 0, 1, 2, 3, 4 ]).count(a => a < 0),
        0
    );

    t.is(
        List.fromArray([ 0, 1, 2, 3, 4 ]).count(a => a > 0),
        4
    );

    t.is(
        List.fromArray([ 0, 1, 2, 3, 4 ]).count(a => a === 0),
        1
    );
});

test('List.prototype.reverse()', t => {
    const list1 = List.fromArray([]);
    const result1 = list1.reverse();

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result2 = list2.reverse();

    t.deepEqual(result2, List.fromArray([ 4, 3, 2, 1, 0 ]));
    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.not(result2, list2, 'List hasn\'t been mutated');
});

test('List.prototype.member()', t => {
    t.false(List.fromArray<number>([]).member(0));
    t.false(List.fromArray([ 1 ]).member(0));
    t.false(List.fromArray([ 1, 2, 3 ]).member(0));
    t.true(List.fromArray([ 0 ]).member(0));
    t.true(List.fromArray([ 1, 0, 2, 3 ]).member(0));

    const object = {};

    t.false(List.fromArray([{}]).member({}));
    t.false(List.fromArray([{}]).member(object));
    t.true(List.fromArray([{}, object]).member(object));
});

test('List.prototype.head()', t => {
    t.deepEqual(
        List.fromArray([]).head(),
        Nothing()
    );

    t.deepEqual(
        List.fromArray([ 0 ]).head(),
        Just(0)
    );

    t.deepEqual(
        List.fromArray([ 1, 2, 3 ]).head(),
        Just(1)
    );
});

test('List.prototype.tail()', t => {
    t.deepEqual(
        List.fromArray([]).tail(),
        Nothing()
    );

    t.deepEqual(
        List.fromArray([ 0 ]).tail(),
        Just(List.fromArray([]))
    );

    t.deepEqual(
        List.fromArray([ 1, 2, 3 ]).tail(),
        Just(List.fromArray([ 2, 3 ]))
    );
});

test('List.prototype.last()', t => {
    t.deepEqual(
        List.fromArray([]).last(),
        Nothing()
    );

    t.deepEqual(
        List.fromArray([ 0 ]).last(),
        Just(0)
    );

    t.deepEqual(
        List.fromArray([ 1, 2, 3 ]).last(),
        Just(3)
    );
});

test('List.prototype.init()', t => {
    t.deepEqual(
        List.fromArray([]).init(),
        Nothing()
    );

    t.deepEqual(
        List.fromArray([ 0 ]).init(),
        Just(List.fromArray([]))
    );

    t.deepEqual(
        List.fromArray([ 1, 2, 3 ]).init(),
        Just(List.fromArray([ 1, 2 ]))
    );
});

test('List.prototype.filter()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.filter(a => a > 0);

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.filter(a => a > 0);
    const result22 = list2.filter(a => a < 0);
    const result23 = list2.filter(a => a === 0);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 1, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([]));
    t.deepEqual(result23, List.fromArray([ 0 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
});

test('List.prototype.reject()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.reject(a => a > 0);

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.reject(a => a > 0);
    const result22 = list2.reject(a => a < 0);
    const result23 = list2.reject(a => a === 0);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0 ]));
    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([ 1, 2, 3, 4 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
});

test('List.prototype.remove()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.remove(a => a > 0);

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.remove(a => a > 0);
    const result22 = list2.remove(a => a < 0);
    const result23 = list2.remove(a => a === 0);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([ 1, 2, 3, 4 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
});

test('List.prototype.take()', t => {
    const list1 = List.fromArray<number>([]);
    const result11 = list1.take(0);
    const result12 = list1.take(1);
    const result13 = list1.take(-1);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result11, List.fromArray([]));
    t.deepEqual(result12, List.fromArray([]));
    t.deepEqual(result13, List.fromArray([]));
    t.is(result11, list1, 'List hasn\'t been changed');
    t.is(result12, list1, 'List hasn\'t been changed');
    t.is(result13, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.take(0);
    const result22 = list2.take(2);
    const result23 = list2.take(5);
    const result24 = list2.take(6);
    const result25 = list2.take(-2);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([]));
    t.deepEqual(result22, List.fromArray([ 0, 1 ]));
    t.deepEqual(result23, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result24, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result25, List.fromArray([ 0, 1, 2 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.is(result23, list2, 'List hasn\'t been changed');
    t.is(result24, list2, 'List hasn\'t been changed');
    t.not(result25, list2, 'List hasn\'t been mutated');
});

test('List.prototype.takeWhile()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.takeWhile(a => a > 0);

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.takeWhile(a => a >= 0);
    const result22 = list2.takeWhile(a => a < 0);
    const result23 = list2.takeWhile(a => a === 0);
    const result24 = list2.takeWhile(a => a > 2);
    const result25 = list2.takeWhile(a => a < 2);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([]));
    t.deepEqual(result23, List.fromArray([ 0 ]));
    t.deepEqual(result24, List.fromArray([]));
    t.deepEqual(result25, List.fromArray([ 0, 1 ]));
    t.is(result21, list2, 'List hasn\'t been changed');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
    t.not(result24, list2, 'List hasn\'t been mutated');
    t.not(result25, list2, 'List hasn\'t been mutated');
});

test('List.prototype.drop()', t => {
    const list1 = List.fromArray<number>([]);
    const result11 = list1.drop(0);
    const result12 = list1.drop(1);
    const result13 = list1.drop(-1);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result11, List.fromArray([]));
    t.deepEqual(result12, List.fromArray([]));
    t.deepEqual(result13, List.fromArray([]));
    t.is(result11, list1, 'List hasn\'t been changed');
    t.is(result12, list1, 'List hasn\'t been changed');
    t.is(result13, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.drop(0);
    const result22 = list2.drop(2);
    const result23 = list2.drop(5);
    const result24 = list2.drop(6);
    const result25 = list2.drop(-2);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([ 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([]));
    t.deepEqual(result24, List.fromArray([]));
    t.deepEqual(result25, List.fromArray([ 3, 4 ]));
    t.is(result21, list2, 'List hasn\'t been changed');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
    t.not(result24, list2, 'List hasn\'t been changed');
    t.not(result25, list2, 'List hasn\'t been mutated');
});

test('List.prototype.dropWhile()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.dropWhile(a => a > 0);

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.dropWhile(a => a >= 0);
    const result22 = list2.dropWhile(a => a < 0);
    const result23 = list2.dropWhile(a => a === 0);
    const result24 = list2.dropWhile(a => a > 2);
    const result25 = list2.dropWhile(a => a < 2);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([]));
    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([ 1, 2, 3, 4 ]));
    t.deepEqual(result24, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result25, List.fromArray([ 2, 3, 4 ]));
    t.not(result21, list2, 'List hasn\'t been changed');
    t.is(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
    t.is(result24, list2, 'List hasn\'t been mutated');
    t.not(result25, list2, 'List hasn\'t been mutated');
});

test('List.prototype.unique()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.unique();

    t.deepEqual(result1, List.fromArray([]));
    t.deepEqual(list1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result2 = list2.unique();

    t.deepEqual(result2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.is(result2, list2, 'List hasn\'t been changed');

    const list3 = List.fromArray([{}, {}, {}, {}]);
    const result3 = list3.unique();

    t.deepEqual(result3, List.fromArray([{}, {}, {}, {}]));
    t.deepEqual(list3, List.fromArray([{}, {}, {}, {}]));
    t.is(result3, list3, 'List hasn\'t been changed');

    const list4 = List.fromArray([ 0, 1, 2, 3, 4, 2, 3 ]);
    const result4 = list4.unique();

    t.deepEqual(result4, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(list4, List.fromArray([ 0, 1, 2, 3, 4, 2, 3 ]));
    t.not(result4, list4, 'List hasn\'t been mutated');

    const object = {};
    const list5 = List.fromArray([{}, {}, object, {}, object, {}]);
    const result5 = list5.unique();

    t.deepEqual(result5, List.fromArray([{}, {}, object, {}, {}]));
    t.deepEqual(list5, List.fromArray([{}, {}, object, {}, object, {}]));
    t.not(result5, list5, 'List hasn\'t been mutated');

    const list6 = List.fromArray([ 0 ]);
    const result6 = list6.unique();

    t.deepEqual(result6, List.fromArray([ 0 ]));
    t.deepEqual(list6, List.fromArray([ 0 ]));
    t.is(result6, list6, 'List hasn\'t been changed');
});

test('List.prototype.uniqueBy()', t => {
    const list1 = List.fromArray<Movie>([]);
    const result11 = list1.uniqueBy(movie => movie.id);
    const result12 = list1.uniqueBy(movie => movie.title);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result11, List.fromArray([]));
    t.deepEqual(result12, List.fromArray([]));
    t.is(result11, list1, 'List hasn\'t been changed');
    t.is(result12, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray<Movie>([ movie(0, 'title_0') ]);
    const result21 = list2.uniqueBy(movie => movie.id);
    const result22 = list2.uniqueBy(movie => movie.title);

    t.deepEqual(list2, List.fromArray([ movie(0, 'title_0') ]));
    t.deepEqual(result21, List.fromArray([ movie(0, 'title_0') ]));
    t.deepEqual(result22, List.fromArray([ movie(0, 'title_0') ]));
    t.is(result21, list2, 'List hasn\'t been changed');
    t.is(result22, list2, 'List hasn\'t been changed');

    const list3 = List.fromArray<Movie>([ movie(0, 'title_0'), movie(1, 'title_1') ]);
    const result31 = list3.uniqueBy(movie => movie.id);
    const result32 = list3.uniqueBy(movie => movie.title);

    t.deepEqual(list3, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1') ]));
    t.deepEqual(result31, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1') ]));
    t.deepEqual(result32, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1') ]));
    t.is(result31, list3, 'List hasn\'t been changed');
    t.is(result32, list3, 'List hasn\'t been changed');

    const list4 = List.fromArray<Movie>([ movie(0, 'title_0'), movie(1, 'title_1'), movie(2, 'title_0') ]);
    const result41 = list4.uniqueBy(movie => movie.id);
    const result42 = list4.uniqueBy(movie => movie.title);

    t.deepEqual(list4, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1'), movie(2, 'title_0') ]));
    t.deepEqual(result41, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1'), movie(2, 'title_0') ]));
    t.deepEqual(result42, List.fromArray([ movie(0, 'title_0'), movie(1, 'title_1') ]));
    t.is(result41, list4, 'List hasn\'t been changed');
    t.not(result42, list4, 'List hasn\'t been mutated');
});

test('List.prototype.replaceIf()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.replaceIf(a => a > 0, 5);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.replaceIf(a => a > 0, 5);
    const result22 = list2.replaceIf(a => a < 0, 5);
    const result23 = list2.replaceIf(a => a === 0, 5);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 5, 5, 5, 5 ]));
    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([ 5, 1, 2, 3, 4 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
    t.not(result23, list2, 'List hasn\'t been mutated');
});

test('List.prototype.updateIf()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.updateIf(a => a > 0 ? Just(a * a) : Nothing());

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, List.fromArray([]));
    t.is(result1, list1, 'List hasn\'t been changed');

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.updateIf(a => a > 0 ? Just(a * a) : Nothing());
    const result22 = list2.updateIf(a => a < 0 ? Just(a * a) : Nothing());

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 1, 4, 9, 16 ]));
    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.not(result21, list2, 'List hasn\'t been mutated');
    t.not(result22, list2, 'List hasn\'t been mutated');
});

test('List.prototype.cons()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.cons(1);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, List.fromArray([ 1 ]));
    t.not(result1, list1, 'List hasn\'t been mutated');

    const list2 = List.fromArray([ 0 ]);
    const result2 = list2.cons(1).cons(2).cons(3);

    t.deepEqual(list2, List.fromArray([ 0 ]));
    t.deepEqual(result2, List.fromArray([ 3, 2, 1, 0 ]));
    t.not(result2, list2, 'List hasn\'t been mutated');

    const list3 = List.fromArray<Array<number>>([[]]);
    const result3 = list3.cons([ 1 ]).cons([ 2, 3 ]).cons([ 4, 5 ]);

    t.deepEqual(list3, List.fromArray([[]]));
    t.deepEqual(result3, List.fromArray([[ 4, 5 ], [ 2, 3 ], [ 1 ], []]));
    t.not(result3, list3, 'List hasn\'t been mutated');
});

test('List.prototype.uncons()', t => {
    t.deepEqual(
        List.fromArray([]).uncons(),
        Nothing()
    );

    const list1 = List.fromArray([ 0 ]);

    t.deepEqual(list1, List.fromArray([ 0 ]));
    t.deepEqual(
        list1.uncons(),
        Just<[ number, List<number> ]>([
            0,
            List.fromArray([])
        ])
    );

    const list2 = List.fromArray([ 0, 1, 2, 3 ]);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3 ]));
    t.deepEqual(
        list2.uncons(),
        Just<[ number, List<number> ]>([
            0,
            List.fromArray([ 1, 2, 3 ])
        ])
    );
});

test('List.prototype.push()', t => {
    const list1 = List.fromArray<number>([]);
    const result1 = list1.push(1);

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, List.fromArray([ 1 ]));
    t.not(result1, list1, 'List hasn\'t been mutated');

    const list2 = List.fromArray([ 0 ]);
    const result2 = list2.push(1).push(2).push(3);

    t.deepEqual(list2, List.fromArray([ 0 ]));
    t.deepEqual(result2, List.fromArray([ 0, 1, 2, 3 ]));
    t.not(result2, list2, 'List hasn\'t been mutated');

    const list3 = List.fromArray<Array<number>>([[]]);
    const result3 = list3.push([ 1 ]).push([ 2, 3 ]).push([ 4, 5 ]);

    t.deepEqual(list3, List.fromArray([[]]));
    t.deepEqual(result3, List.fromArray([[], [ 1 ], [ 2, 3 ], [ 4, 5 ]]));
    t.not(result3, list3, 'List hasn\'t been mutated');
});

test('List.prototype.pop()', t => {
    t.deepEqual(
        List.fromArray([]).pop(),
        Nothing()
    );

    const list1 = List.fromArray([ 0 ]);

    t.deepEqual(list1, List.fromArray([ 0 ]));
    t.deepEqual(
        list1.pop(),
        Just<[ number, List<number> ]>([
            0,
            List.fromArray([])
        ])
    );

    const list2 = List.fromArray([ 0, 1, 2, 3 ]);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3 ]));
    t.deepEqual(
        list2.pop(),
        Just<[ number, List<number> ]>([
            3,
            List.fromArray([ 0, 1, 2 ])
        ])
    );
});

test('List.prototype.append()', t => {
    const source1: List<number> = List.fromArray([]);

    const array11: Array<number> = [];
    const result11 = source1.append(array11);

    t.deepEqual(result11, List.fromArray([]), 'Result List is correct');
    t.deepEqual(array11, [], 'Appended Array hasn\'t been changed');
    t.not(source1, result11, 'Source List hasn\'t been returned as result List');

    const array12 = [ 0, 1, 2 ];
    const result12 = source1.append(array12);

    t.deepEqual(result12, List.fromArray([ 0, 1, 2 ]), 'Result List is correct');
    t.deepEqual(array12, [ 0, 1, 2 ], 'Appended Array hasn\'t been changed');
    t.not(source1, result12, 'Source List hasn\'t been returned as result List');

    const list11: List<number> = List.fromArray([]);
    const result13 = source1.append(list11);

    t.deepEqual(result13, List.fromArray([]), 'Result List is correct');
    t.deepEqual(list11, List.fromArray([]), 'Appended Array hasn\'t been changed');
    t.is(result13, list11, 'Appended List has been returned as result List');
    t.not(source1, result13, 'Source List hasn\'t been returned as result List');

    const list12 = List.fromArray([ 0, 1, 2 ]);
    const result14 = source1.append(list12);

    t.deepEqual(result14, List.fromArray([ 0, 1, 2 ]), 'Result List is correct');
    t.deepEqual(list12, List.fromArray([ 0, 1, 2 ]), 'Appended Array hasn\'t been changed');
    t.is(result14, list12, 'Appended List has been returned as result List');
    t.not(source1, result14, 'Source List hasn\'t been returned as result List');

    t.deepEqual(source1, List.fromArray([]), 'Source List hasn\'t been changed');

    const source2: List<number> = List.fromArray([ 3, 4, 5 ]);

    const array21: Array<number> = [];
    const result21 = source2.append(array21);

    t.deepEqual(result21, List.fromArray([ 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(array21, [], 'Appended Array hasn\'t been changed');
    t.is(source2, result21, 'Source List has been returned as result');

    const array22: Array<number> = [ 0, 1, 2 ];
    const result22 = source2.append(array22);

    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(array22, [ 0, 1, 2 ], 'Appended Array hasn\'t been changed');
    t.not(source2, result22, 'Source List hasn\'t been returned as result List');

    const list21: List<number> = List.fromArray([]);
    const result23 = source2.append(list21);

    t.deepEqual(result23, List.fromArray([ 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(list21, List.fromArray([]), 'Appended Array hasn\'t been changed');
    t.not(result23, list21, 'Appended List hasn\'t been returned as result List');
    t.is(source2, result23, 'Source List has been returned as result');

    const list22: List<number> = List.fromArray([ 0, 1, 2 ]);
    const result24 = source2.append(list22);

    t.deepEqual(result24, List.fromArray([ 0, 1, 2, 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(list22, List.fromArray([ 0, 1, 2 ]), 'Appended Array hasn\'t been changed');
    t.not(result24, list22, 'Appended List hasn\'t been returned as result List');
    t.not(source2, result24, 'Source List hasn\'t been returned as result List');

    t.deepEqual(source2, List.fromArray([ 3, 4, 5 ]), 'Source List hasn\'t been changed');
});

test('List.prototype.concat()', t => {
    const source1: List<number> = List.fromArray([]);

    const array11: Array<number> = [];
    const result11 = source1.concat(array11);

    t.deepEqual(result11, List.fromArray([]), 'Result List is correct');
    t.deepEqual(array11, [], 'Appended Array hasn\'t been changed');
    t.not(source1, result11, 'Source List hasn\'t been returned as result List');

    const array12 = [ 3, 4, 5 ];
    const result12 = source1.concat(array12);

    t.deepEqual(result12, List.fromArray([ 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(array12, [ 3, 4, 5 ], 'Appended Array hasn\'t been changed');
    t.not(source1, result12, 'Source List hasn\'t been returned as result List');

    const list11: List<number> = List.fromArray([]);
    const result13 = source1.concat(list11);

    t.deepEqual(result13, List.fromArray([]), 'Result List is correct');
    t.deepEqual(list11, List.fromArray([]), 'Appended Array hasn\'t been changed');
    t.is(result13, list11, 'Appended List has been returned as result List');
    t.not(source1, result13, 'Source List hasn\'t been returned as result List');

    const list12 = List.fromArray([ 3, 4, 5 ]);
    const result14 = source1.concat(list12);

    t.deepEqual(result14, List.fromArray([ 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(list12, List.fromArray([ 3, 4, 5 ]), 'Appended Array hasn\'t been changed');
    t.is(result14, list12, 'Appended List has been returned as result List');
    t.not(source1, result14, 'Source List hasn\'t been returned as result List');

    t.deepEqual(source1, List.fromArray([]), 'Source List hasn\'t been changed');

    const source2: List<number> = List.fromArray([ 0, 1, 2 ]);

    const array21: Array<number> = [];
    const result21 = source2.concat(array21);

    t.deepEqual(result21, List.fromArray([ 0, 1, 2 ]), 'Result List is correct');
    t.deepEqual(array21, [], 'Appended Array hasn\'t been changed');
    t.is(source2, result21, 'Source List has been returned as result');

    const array22: Array<number> = [ 3, 4, 5 ];
    const result22 = source2.concat(array22);

    t.deepEqual(result22, List.fromArray([ 0, 1, 2, 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(array22, [ 3, 4, 5 ], 'Appended Array hasn\'t been changed');
    t.not(source2, result22, 'Source List hasn\'t been returned as result List');

    const list21: List<number> = List.fromArray([]);
    const result23 = source2.concat(list21);

    t.deepEqual(result23, List.fromArray([ 0, 1, 2 ]), 'Result List is correct');
    t.deepEqual(list21, List.fromArray([]), 'Appended Array hasn\'t been changed');
    t.not(result23, list21, 'Appended List hasn\'t been returned as result List');
    t.is(source2, result23, 'Source List has been returned as result');

    const list22: List<number> = List.fromArray([ 3, 4, 5 ]);
    const result24 = source2.concat(list22);

    t.deepEqual(result24, List.fromArray([ 0, 1, 2, 3, 4, 5 ]), 'Result List is correct');
    t.deepEqual(list22, List.fromArray([ 3, 4, 5 ]), 'Appended Array hasn\'t been changed');
    t.not(result24, list22, 'Appended List hasn\'t been returned as result List');
    t.not(source2, result24, 'Source List hasn\'t been returned as result List');

    t.deepEqual(source2, List.fromArray([ 0, 1, 2 ]), 'Source List hasn\'t been changed');
});

test('List.prototype.intersperse()', t => {
    const source1: List<number> = List.fromArray([]);
    const result1 = source1.intersperse(5);

    t.deepEqual(result1, List.fromArray([]), 'Result List is correct');
    t.deepEqual(source1, List.fromArray([]), 'Source List hasn\'t been changed');
    t.is(result1, source1, 'Source List has been returned as result List');

    const source2 = List.fromArray([ 0 ]);
    const result2 = source2.intersperse(5);

    t.deepEqual(result2, List.fromArray([ 0 ]), 'Result List is correct');
    t.deepEqual(source2, List.fromArray([ 0 ]), 'Source List hasn\'t been changed');
    t.is(result2, source2, 'Source List has been returned as result List');

    const source3 = List.fromArray([ 0, 1 ]);
    const result3 = source3.intersperse(5);

    t.deepEqual(result3, List.fromArray([ 0, 5, 1 ]), 'Result List is correct');
    t.deepEqual(source3, List.fromArray([ 0, 1 ]), 'Source List hasn\'t been changed');
    t.not(result3, source3, 'Source List hasn\'t been returned as result List');

    t.deepEqual(
        List.fromArray([ 0, 1, 2, 3, 4 ]).intersperse(5),
        List.fromArray([ 0, 5, 1, 5, 2, 5, 3, 5, 4 ])
    );
});

test('List.prototype.partition()', t => {
    const list1: List<number> = List.fromArray([]);

    t.deepEqual(
        list1.partition(a => a > 0),
        [
            List.fromArray([]),
            List.fromArray([])
        ]
    );
    t.deepEqual(list1, List.fromArray([]));

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);

    t.deepEqual(
        list2.partition(a => a > 0),
        [
            List.fromArray([ 1, 2, 3, 4 ]),
            List.fromArray([ 0 ])
        ]
    );

    t.deepEqual(
        list2.partition(a => a < 0),
        [
            List.fromArray([]),
            List.fromArray([ 0, 1, 2, 3, 4  ])
        ]
    );

    t.deepEqual(
        list2.partition(a => a === 0),
        [
            List.fromArray([ 0 ]),
            List.fromArray([ 1, 2, 3, 4 ])
        ]
    );

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
});

test('List.prototype.map()', t => {
    const list1: List<number> = List.fromArray([]);
    const result1 = list1.map(a => a * a);

    t.deepEqual(result1, List.fromArray([]));
    t.is(result1, list1);

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result2 = list2.map(a => a * a);

    t.deepEqual(result2, List.fromArray([ 0, 1, 4, 9, 16 ]));
    t.not(result2, list2);
    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
});

test('List.prototype.chain()', t => {
    const list1: List<number> = List.fromArray([]);
    const result11 = list1.chain(a => [ a, a ]);

    t.deepEqual(result11, List.fromArray([]));
    t.is(result11, list1);

    const result12 = list1.chain(a => List.fromArray([ a, a ]));

    t.deepEqual(result12, List.fromArray([]));
    t.is(result12, list1);

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.chain(a => [ a, a ]);

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 0, 0, 1, 1, 2, 2, 3, 3, 4, 4 ]));
    t.not(result21, list2);

    const result22 = list2.chain(a => List.fromArray([ a, a ]));

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([ 0, 0, 1, 1, 2, 2, 3, 3, 4, 4 ]));
    t.not(result22, list2);
});

test('List.prototype.filterMap()', t => {
    const list1: List<number> = List.fromArray([]);
    const result11 = list1.filterMap(a => a > 2 ? Just(a * a) : Nothing());

    t.deepEqual(result11, List.fromArray([]));
    t.is(result11, list1);

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result21 = list2.filterMap(a => a > 2 ? Just(a * a) : Nothing());

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result21, List.fromArray([ 9, 16 ]));

    const result22 = list2.filterMap(a => a < 2 ? Just(a * a) : Nothing());

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result22, List.fromArray([ 0, 1 ]));

    const result23 = list2.filterMap(a => a === 2 ? Just(a * a) : Nothing());

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result23, List.fromArray([ 4 ]));
});

test('List.prototype.indexedMap()', t => {
    const list1: List<[ number, number ]> = List.fromArray([]);
    const result1 = list1.indexedMap((i, a) => [ i, a ]);

    t.deepEqual(result1, List.fromArray([]));
    t.is(result1, list1);

    const list2 = List.fromArray([ 4, 3, 2, 1, 0 ]);
    const result2 = list2.indexedMap((i, a) => [ i, a ]);

    t.deepEqual(list2, List.fromArray([ 4, 3, 2, 1, 0 ]));
    t.deepEqual(result2, List.fromArray([[ 0, 4 ], [ 1, 3 ], [ 2, 2 ], [ 3, 1 ], [ 4, 0 ]]));
});

test('List.prototype.foldl()', t => {
    const list1: List<number> = List.fromArray([]);
    const result1 = list1.foldl(
        (a, acc) => acc.concat(a + 1),
        [] as Array<number>
    );

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, []);

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result2 = list2.foldl(
        (a, acc) => acc.concat(a + 1),
        [] as Array<number>
    );

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result2, [ 1, 2, 3, 4, 5 ]);
});

test('List.prototype.foldr()', t => {
    const list1: List<number> = List.fromArray([]);
    const result1 = list1.foldr(
        (a, acc) => acc.concat(a + 1),
        [] as Array<number>
    );

    t.deepEqual(list1, List.fromArray([]));
    t.deepEqual(result1, []);

    const list2 = List.fromArray([ 0, 1, 2, 3, 4 ]);
    const result2 = list2.foldr(
        (a, acc) => acc.concat(a + 1),
        [] as Array<number>
    );

    t.deepEqual(list2, List.fromArray([ 0, 1, 2, 3, 4 ]));
    t.deepEqual(result2, [ 5, 4, 3, 2, 1 ]);
});

test('List.prototype.find()', t => {
    const list1 = List.fromArray<Movie>([]);
    const result1 = list1.find(movie => movie.id === 1);

    t.deepEqual(result1, Nothing());
    t.deepEqual(list1, List.fromArray([]));

    const list2 = List.fromArray([
        movie(0, 'title_0'),
        movie(1, 'title_1'),
        movie(2, 'title_2'),
        movie(3, 'title_2')
    ]);

    const result21 = list2.find(movie => movie.id === 1);

    t.deepEqual(
        list2,
        List.fromArray([
            movie(0, 'title_0'),
            movie(1, 'title_1'),
            movie(2, 'title_2'),
            movie(3, 'title_2')
        ])
    );
    t.deepEqual(result21, Just(movie(1, 'title_1')));

    const result22 = list2.find(movie => movie.id === 4);

    t.deepEqual(
        list2,
        List.fromArray([
            movie(0, 'title_0'),
            movie(1, 'title_1'),
            movie(2, 'title_2'),
            movie(3, 'title_2')
        ])
    );
    t.deepEqual(result22, Nothing());

    const result23 = list2.find(movie => movie.title === 'title_2');

    t.deepEqual(
        list2,
        List.fromArray([
            movie(0, 'title_0'),
            movie(1, 'title_1'),
            movie(2, 'title_2'),
            movie(3, 'title_2')
        ])
    );
    t.deepEqual(result23, Just(movie(2, 'title_2')));
});
