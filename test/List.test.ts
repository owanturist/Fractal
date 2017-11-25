import test from 'ava';

import {
    Nothing,
    Just
} from '../src/Maybe';
import {
    List
} from '../src/List';

test('List.isEmpty', t => {
    t.true(
        List.isEmpty([])
    );

    t.false(
        List.isEmpty([ 1, 2, 3 ])
    );
});

test('List.size', t => {
    t.is(
        List.size([]),
        0
    );

    t.is(
        List.size([ 1, 2, 3 ]),
        3
    );
});

test('List.reverse', t => {
    const list1: List<number> = [];

    t.is(
        List.reverse(list1),
        list1
    );

    t.deepEqual(
        List.reverse(list1),
        []
    );

    const list2 = [ 1 ];

    t.is(
        List.reverse(list2),
        list2
    );

    t.deepEqual(
        List.reverse(list2),
        [ 1 ]
    );

    const list3 = [ 1, 2, 3 ];

    t.not(
        List.reverse(list3),
        list3
    );

    t.deepEqual(
        List.reverse(list3),
        [ 3, 2, 1 ]
    );

    t.deepEqual(
        list3,
        [ 1, 2, 3 ]
    );
});

test('List.member', t => {
    t.false(
        List.member(0, []),
    );

    t.false(
        List.member(0, [ 1, 2, 3 ]),
    );

    t.true(
        List.member(0, [ 0, 1, 2, 3 ]),
    );
});

test('List.head', t => {
    t.deepEqual(
        List.head([]),
        Nothing
    );

    t.deepEqual(
        List.head([ 1, 2, 3 ]),
        Just(1)
    );
});

test('List.tail', t => {
   t.deepEqual(
       List.tail([]),
       Nothing
   );

   const list = [ 1 ];

   t.deepEqual(
       List.tail(list),
       Just([])
   );

   t.deepEqual(
       list,
       [ 1 ]
   );

   t.deepEqual(
       List.tail([ 1, 2, 3 ]),
       Just([ 2, 3 ])
   );
});

test('List.filter', t => {
    const fn = (value: number) => value < 4;
    const list1: List<number> = [];

    t.is(
        List.filter(fn, list1),
        list1
    )

    t.deepEqual(
        List.filter(fn, list1),
        []
    );

    const list2 = [ 1, 2, 3, 4 ];

    t.not(
        List.filter(fn, list2),
        list2
    );

    t.deepEqual(
        List.filter(fn, list2),
        [ 1, 2, 3 ]
    );

    t.deepEqual(
        list2,
        [ 1, 2, 3, 4 ]
    );

    const list3 = [ 1, 2, 3 ];

    t.is(
        List.filter(fn, list3),
        list3
    );

    t.deepEqual(
        List.filter(fn, list3),
        [ 1, 2, 3 ]
    );
});

test('List.take', t => {
    const list = [ 1, 2, 3, 4 ];

    t.not(
        List.take(0, list),
        list
    );

    t.deepEqual(
        List.take(0, list),
        []
    );

    t.is(
        List.take(100, list),
        list
    );

    t.deepEqual(
        List.take(100, list),
        [ 1, 2, 3, 4 ]
    );

    t.deepEqual(
        List.take(2, list),
        [ 1, 2 ]
    );

    t.deepEqual(
        list,
        [ 1, 2, 3, 4 ]
    );
});

test('List.drop', t => {
    const list = [ 1, 2, 3, 4 ];

    t.is(
        List.drop(0, list),
        list
    );

    t.deepEqual(
        List.drop(0, list),
        [ 1, 2, 3, 4 ]
    );

    t.deepEqual(
        List.drop(100, list),
        []
    );

    t.not(
        List.drop(2, list),
        list
    );

    t.deepEqual(
        List.drop(2, list),
        [ 3, 4 ]
    );

    t.deepEqual(
        list,
        [ 1, 2, 3, 4 ]
    );
});

test('List.singleton', t => {
    t.deepEqual(
        List.singleton(1),
        [ 1 ]
    );
});

test('List.repeat', t => {
    t.deepEqual(
        List.repeat(0, 1),
        []
    );

    t.deepEqual(
        List.repeat(1, 1),
        [ 1 ]
    );

    t.deepEqual(
        List.repeat(3, 1),
        [ 1, 1, 1 ]
    );
});

test('List.range', t => {
    t.deepEqual(
        List.range(3, 3),
        [ 3 ]
    );

    t.deepEqual(
        List.range(6, 3),
        []
    );

    t.deepEqual(
        List.range(3, 6),
        [ 3, 4, 5, 6 ]
    );
});

test('List.cons', t => {
    t.deepEqual(
        List.cons(1, []),
        [ 1 ]
    );

    const list = [ 2, 3 ];

    t.not(
        List.cons(1, list),
        list
    );

    t.deepEqual(
        List.cons(1, list),
        [ 1, 2, 3 ]
    );

    t.deepEqual(
        list,
        [ 2, 3 ]
    );
});

test('List.append', t => {
    const left = [ 1, 2 ];
    const right = [ 3, 4 ];

    t.is(
        List.append([], left),
        left
    );

    t.deepEqual(
        List.append([], left),
        [ 1, 2 ]
    );

    t.is(
        List.append([], right),
        right
    );

    t.deepEqual(
        List.append([], right),
        [ 3, 4 ]
    );

    t.deepEqual(
        List.append(left, right),
        [ 1, 2, 3, 4 ]
    );

    t.deepEqual(left, [ 1, 2 ]);

    t.deepEqual(right, [ 3, 4 ]);
});

test('List.concat', t => {
    t.deepEqual(
        List.concat([]),
        []
    );

    t.deepEqual(
        List.concat([[ 1, 2 ], [3, 4]]),
        [ 1, 2, 3, 4]
    );
});

test('List.intersperse', t => {
    const list1: List<number> = [];

    t.is(
        List.intersperse(0, list1),
        list1
    );

    t.deepEqual(
        List.intersperse(0, list1),
        []
    );

    const list2: List<number> = [ 1, 2, 3 ];

    t.not(
        List.intersperse(0, list2),
        list2
    );

    t.deepEqual(
        List.intersperse(0, list2),
        [ 1, 0, 2, 0, 3 ]
    );

    t.deepEqual(
        list2,
        [ 1, 2, 3 ]
    );
});

test('List.partition', t  => {
    const list = [ 1, 2, 3, 4 ];

    t.deepEqual(
        List.partition(value => value > 4, list),
        [[], [ 1, 2, 3, 4 ]]
    );

    t.deepEqual(
        List.partition(value => value < 5, list),
        [[ 1, 2, 3, 4 ], []]
    );

    t.deepEqual(
        List.partition(value => value < 3, list),
        [[ 1, 2 ], [ 3, 4 ]]
    );

    t.deepEqual(
        list,
        [ 1, 2, 3, 4 ]
    );
});

test.todo('List.unzip');

test.todo('List.map');

test.todo('List.map2');

test.todo('List.map3');

test.todo('List.map4');

test.todo('List.map5');

test.todo('List.map6');

test.todo('List.map7');

test.todo('List.map8');

test.todo('List.filterMap');

test.todo('List.concatMap');

test.todo('List.indexedMap');

test.todo('List.foldr');

test.todo('List.foldl');

test.todo('List.sum');

test.todo('List.product');

test.todo('List.maximum');

test.todo('List.minimum');

test.todo('List.all');

test.todo('List.any');

test.todo('List.scanl');

test.todo('List.sort');

test.todo('List.sortBy');

test.todo('List.sortWith');
