import test from 'ava';

const swap = <T>(x: number, y: number, arr: Array<T>): void => {
    if (x === y) {
        return;
    }

    const tmp = arr[ x ];

    arr[ x ] = arr[ y ];
    arr[ y ] = tmp;
};

const bounds = <T>(...params: [ Array<T> ] | [ number, number, Array<T>]): [ number, number, Array<T> ] => {
    const [ lo, hi, arr ] = params.length === 1
        ? [ 0, params[ 0 ].length, params[ 0 ] ]
        : params;

    return [ Math.max(0, lo), Math.min(arr.length, hi), arr ];
};

const range = (start: number, end: number): Array<number> => {
    const [ step, n ] = start < end ? [ 1, end - start + 1 ] : [ -1, start - end + 1 ];
    const arr = new Array(n);

    for (let i = 0; i < arr.length; i++) {
        arr[i] = start + i * step;
    }

    return arr;
};

test('Algo.range', t => {
    t.deepEqual(
        range(0, 0),
        [ 0 ]
    );

    t.deepEqual(
        range(0, 1),
        [ 0, 1 ]
    );

    t.deepEqual(
        range(5, 9),
        [ 5, 6, 7, 8, 9 ]
    );

    t.deepEqual(
        range(1, 0),
        [ 1, 0 ]
    );

    t.deepEqual(
        range(9, 5),
        [ 9, 8, 7, 6, 5 ]
    );

    t.deepEqual(
        range(-5, 5),
        [ -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5 ]
    );

    t.deepEqual(
        range(5, -5),
        [ 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5 ]
    );
});

function shuffle<T>(arr: Array<T>): Array<T>;
function shuffle<T>(lo: number, hi: number, arr: Array<T>): Array<T>;
function shuffle<T>(...params: [ Array<T> ] | [ number, number, Array<T>]): Array<T> {
    const [ lo, hi, arr ] = bounds(...params);

    const acc = arr.slice();

    for (let i = lo; i < hi; i++) {
        swap(
            i + Math.floor(Math.random() * (hi - i)),
            i,
            acc
        );
    }

    return acc;
}

test('Algo.shuffle', t => {
    const arr = range(0, 99);
    const shuffled = shuffle(arr);

    t.notDeepEqual(arr, shuffled);
    t.deepEqual(arr, shuffled.slice().sort((a, b) => a - b));
});

function quicksort(arr: Array<number>): Array<number>;
function quicksort(lo: number, hi: number, arr: Array<number>): Array<number>;
function quicksort(...params: [ Array<number> ] | [ number, number, Array<number>]): Array<number> {
    const [ lo, hi, arr ] = bounds(...params);

    const copy = shuffle(lo, hi, arr);

    quicksortRoutine(lo, hi, copy);

    return copy;
}

//                     v
// 0 1 2 3 4 5 6 7 8 9
//                   ^

// 7 1 0 2 8 3 6 4 9 5
const quicksortRoutine = (lo: number, hi: number, arr: Array<number>): void => {
    if (lo >= hi) {
        return;
    }

    const el = arr[ lo ];
    let left = lo + 1;
    let right = hi - 1;

    while (true) {
        while (left <= right && arr[ left ] <= el) {
            left++;
        }

        while (left <= right && arr[ right ] >= el) {
            right--;
        }

        if (left >= right) {
            break;
        }

        swap(left++, right--, arr);
    }

    const target = right;

    swap(target, lo, arr);

    quicksortRoutine(lo, target, arr);
    quicksortRoutine(target + 1, hi, arr);
};

test('Algo.quicksort', t => {
    t.deepEqual(
        quicksort([]),
        []
    );

    t.deepEqual(
        quicksort([ 0 ]),
        [ 0 ]
    );

    const _0 = range(0, 9);
    t.deepEqual(
        quicksort(shuffle(_0)),
        _0
    );

    const _1 = range(0, 999);
    t.deepEqual(
        quicksort(shuffle(_1)),
        _1
    );

    const _2 = [ 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 5, 5, 6, 7, 8, 8, 8, 8, 9 ];
    t.deepEqual(
        quicksort(shuffle(_2)),
        _2
    );

    const _3 = [ 7, 1, 0, 2, 8, 3, 6, 4, 9, 5 ];
    t.deepEqual(
        quicksort(3, 7, _3),
        [ 7, 1, 0, 2, 3, 6, 8, 4, 9, 5 ]
    );
});
