/* tslint:disable: no-magic-numbers */

import test from 'ava';

import {
    List
} from '../src/List';

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

    t.deepEqual(List.toArray(list), array);
    t.not(List.toArray(list), array);

    t.deepEqual(List.toArray(array), array);
    t.is(List.toArray(array), array);
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

