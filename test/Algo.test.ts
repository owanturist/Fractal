import test from 'ava';

interface Sorting {
    <T extends number | string>(arr: Array<T>): Array<T>;
    <T>(arr: Array<T>, comparator: Comparator<T>): Array<T>;
    <T extends number | string>(lo: number, hi: number, arr: Array<T>): Array<T>;
    <T>(lo: number, hi: number, arr: Array<T>, comparator: Comparator<T>): Array<T>;
}

type Comparator<T> = (left: T, right: T) => number;

const defaultComparator = <T extends string | number>(left: T, right: T): number => {
    if (left < right) {
        return -1;
    }

    if (left > right) {
        return 1;
    }

    return 0;
};

const swap = <T>(x: number, y: number, arr: Array<T>): void => {
    if (x === y) {
        return;
    }

    const tmp = arr[ x ];

    arr[ x ] = arr[ y ];
    arr[ y ] = tmp;
};

const bounds = <T>(...params: [ Array<T> ] | [ number, number, Array<T> ]): [ number, number, Array<T> ] => {
    const [ lo, hi, arr ] = params.length === 1
        ? [ 0, params[ 0 ].length, params[ 0 ] ]
        : params;

    return [ Math.max(0, lo), Math.min(arr.length, hi), arr ];
};

const attributes = <T>(params
    : [ Array<T> ]
    | [ Array<T>, Comparator<T> ]
    | [ number, number, Array<T> ]
    | [ number, number, Array<T>, Comparator<T> ]
): [ number, number, Array<T>, Comparator<T> ] => {
    if (params.length === 2) {
        const [ lo, hi, arr ] = bounds(params[ 0 ]);

        return [ lo, hi, arr, params[ 1 ]];
    }

    if (params.length === 4) {
        const [ lo, hi, arr ] = bounds(params[ 0 ], params[ 1 ], params[ 2 ]);

        return [ lo, hi, arr, params[ 3 ]];
    }

    const [ lo, hi, arr ] = bounds(...params);

    return [ lo, hi, arr, defaultComparator as Comparator<T> ];
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
    const [ lo, hi, source ] = bounds(...params);

    const copy = source.slice();

    for (let i = lo; i < hi; i++) {
        swap(
            i + Math.floor(Math.random() * (hi - i)),
            i,
            copy
        );
    }

    return copy;
}

test('Algo.shuffle', t => {
    const arr = range(0, 99);
    const shuffled = shuffle(arr);

    t.notDeepEqual(arr, shuffled);
    t.deepEqual(arr, shuffled.slice().sort((a, b) => a - b));
});

const quicksort: Sorting = <T>(...params
    : [ Array<T> ]
    | [ Array<T>, Comparator<T> ]
    | [ number, number, Array<T> ]
    | [ number, number, Array<T>, Comparator<T> ]
): Array<T> => {
    const [ lo, hi, arr, cmp ] = attributes(params);

    const copy = shuffle(lo, hi, arr);

    quicksortRoutine(lo, hi, copy, cmp);

    return copy;
};

const quicksortRoutine = <T>(lo: number, hi: number, arr: Array<T>, cmp: Comparator<T>): void => {
    if (lo >= hi) {
        return;
    }

    const el = arr[ lo ];
    let left = lo + 1;
    let right = hi - 1;

    while (true) {
        while (left <= right && cmp(arr[ left ], el) <= 0) {
            left++;
        }

        while (left <= right && cmp(arr[ right ], el) >= 0) {
            right--;
        }

        if (left >= right) {
            break;
        }

        swap(left++, right--, arr);
    }

    const target = right;

    swap(target, lo, arr);

    quicksortRoutine(lo, target, arr, cmp);
    quicksortRoutine(target + 1, hi, arr, cmp);
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

    t.deepEqual(
        quicksort(shuffle(range(0, 9))),
        range(0, 9)
    );

    t.deepEqual(
        quicksort(shuffle(range(0, 999))),
        range(0, 999)
    );

    t.deepEqual(
        quicksort(shuffle(range(999, 0)), (a, b) => b - a),
        range(999, 0)
    );

    const _1 = [ 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 5, 5, 6, 7, 8, 8, 8, 8, 9 ];
    t.deepEqual(
        quicksort(shuffle(_1)),
        _1
    );

    t.deepEqual(
        quicksort(3, 7, [ 7, 1, 0, 2, 8, 3, 6, 4, 9, 5 ]),
        [ 7, 1, 0, 2, 3, 6, 8, 4, 9, 5 ]
    );

    const _2 = 'ABCDEFGH'.split('');
    t.deepEqual(
        quicksort(shuffle(_2)),
        _2
    );
});

const mergesort: Sorting = <T>(...params
    : [ Array<T> ]
    | [ Array<T>, Comparator<T> ]
    | [ number, number, Array<T> ]
    | [ number, number, Array<T>, Comparator<T> ]
): Array<T> => {
    const [ lo, hi, arr, cmp ] = attributes(params);

    const copy = arr.slice();

    mergesortRoutine(lo, hi, arr.slice(), copy, cmp);

    return copy;
};

const mergesortRoutine = <T>(lo: number, hi: number, tmp: Array<T>, res: Array<T>, cmp: Comparator<T>): void => {
    // prevent sorting a single or empty element
    if (hi - lo < 2) {
        return;
    }

    const middle = lo + Math.floor((hi - lo) / 2);

    mergesortRoutine(lo, middle, res, tmp, cmp);
    mergesortRoutine(middle, hi, res, tmp, cmp);

    for (let i = lo, left = lo, right = middle; left < middle || right < hi; i++) {
        if (left >= middle) {
            res[ i ] = tmp[ right++ ];
        } else if (right >= hi || cmp(tmp[ left ], tmp[ right ]) <= 0) {
            res[ i ] = tmp[ left++ ];
        } else {
            res[ i ] = tmp[ right++ ];
        }
    }
};

test('Algo.mergesort', t => {
    t.deepEqual(
        mergesort([]),
        []
    );

    t.deepEqual(
        mergesort([ 0 ]),
        [ 0 ]
    );

    t.deepEqual(
        mergesort(shuffle(range(0, 9))),
        range(0, 9)
    );

    t.deepEqual(
        mergesort(shuffle(range(0, 999))),
        range(0, 999)
    );

    t.deepEqual(
        mergesort(shuffle(range(999, 0)), (a, b) => b - a),
        range(999, 0)
    );

    const _1 = [ 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 5, 5, 6, 7, 8, 8, 8, 8, 9 ];
    t.deepEqual(
        mergesort(shuffle(_1)),
        _1
    );

    t.deepEqual(
        mergesort(3, 7, [ 7, 1, 0, 2, 8, 3, 6, 4, 9, 5 ]),
        [ 7, 1, 0, 2, 3, 6, 8, 4, 9, 5 ]
    );

    const _2 = 'ABCDEFGH'.split('');
    t.deepEqual(
        mergesort(shuffle(_2)),
        _2
    );

    const _4 = [
        { x: 'A', y: 0 },
        { x: 'A', y: 1 },
        { x: 'A', y: 2 },
        { x: 'A', y: 4 },
        { x: 'A', y: 9 },
        { x: 'B', y: 0 },
        { x: 'B', y: 1 },
        { x: 'B', y: 2 },
        { x: 'B', y: 2 },
        { x: 'C', y: 6 },
        { x: 'C', y: 7 },
        { x: 'D', y: 0 }
    ];

    t.deepEqual(
        mergesort(
            mergesort(shuffle(_4), (a, b) => a.y - b.y),
            (a, b) => a.x.charCodeAt(0) - b.x.charCodeAt(0)
        ),
        _4
    );
});

class PriorityQueue<T> {
    public static empty<T extends string | number>(): PriorityQueue<T>;
    public static empty<T>(comparator: Comparator<T>): PriorityQueue<T>;
    public static empty<T>(comparator = defaultComparator): PriorityQueue<T> {
        return new PriorityQueue(comparator as Comparator<T>);
    }

    private readonly heap: Array<T> = new Array(1);

    private constructor(private readonly cmp: Comparator<T>) {}

    public size(): number {
        return this.heap.length - 1;
    }

    public isEmpty(): boolean {
        return this.size() === 0;
    }

    public peek(): null | T {
        if (this.isEmpty()) {
            return null;
        }

        return this.heap[ 1 ];
    }

    public add(value: T): void {
        this.heap.push(value);
        this.swim(this.heap.length - 1);
        this.validate(1);
    }

    public poll(): null | T {
        if (this.isEmpty()) {
            return null;
        }

        const value = this.heap[ 1 ];
        const last = this.heap.pop();

        this.heap[ 1 ] = last as T;
        this.sink(1);

        return value;
    }

    private compare(left: number, right: number): number {
        return this.cmp(this.heap[ left ], this.heap[ right ]);
    }

    private swim(index: number): void {
        let child = index;

        while (child > 1 && this.compare(Math.floor(child / 2), child) > 0) {
            const parent = Math.floor(child / 2);

            swap(child, parent, this.heap);
            child = parent;
        }
    }

    private sink(index: number): void {
        const size = this.size();
        let parent = index;

        while (parent * 2 <= size) {
            let child = parent * 2;

            if (child < size && this.compare(child, child + 1) > 0) {
                child++;
            }

            if (this.compare(child, parent) >= 0) {
                break;
            }

            swap(child, parent, this.heap);

            parent = child;
        }
    }

    private validate(parent: number): void {
        const child = parent * 2;

        if (child > this.size()) {
            return;
        }

        if (this.compare(parent, child) > 0) {
            throw new Error(`${this.heap[ parent ]}(${parent}) > ${this.heap[ child ]}(${child})`);
        }

        if (child !== this.size() && this.compare(parent, child + 1) > 0) {
            throw new Error(`${this.heap[ parent ]}(${parent}) > ${this.heap[ child + 1 ]}(${child + 1})`);
        }

        this.validate(child);
        this.validate(child + 1);
    }
}

const heapsort: Sorting = <T>(...params
    : [ Array<T> ]
    | [ Array<T>, Comparator<T> ]
    | [ number, number, Array<T> ]
    | [ number, number, Array<T>, Comparator<T> ]
): Array<T> => {
    const [ lo, hi, arr, cmp ] = attributes(params);
    const pq = PriorityQueue.empty(cmp);

    for (let i = lo; i < hi; i++) {
        pq.add(arr[ i ]);
    }

    const res = new Array(arr.length);

    for (let i = 0; i < arr.length; i++) {
        if (i < lo || i >= hi) {
            res[ i ] = arr[ i ];
        } else {
            res[ i ] = pq.poll();
        }
    }

    return res;
};

test('Algo.heapsort', t => {
    t.deepEqual(
        heapsort([]),
        []
    );

    t.deepEqual(
        heapsort([ 0 ]),
        [ 0 ]
    );

    t.deepEqual(
        heapsort(shuffle(range(0, 9))),
        range(0, 9)
    );

    t.deepEqual(
        heapsort(shuffle(range(0, 999))),
        range(0, 999)
    );

    t.deepEqual(
        heapsort(shuffle(range(999, 0)), (a, b) => b - a),
        range(999, 0)
    );

    const _1 = [ 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 5, 5, 6, 7, 8, 8, 8, 8, 9 ];
    t.deepEqual(
        heapsort(shuffle(_1)),
        _1
    );

    t.deepEqual(
        heapsort(3, 7, [ 7, 1, 0, 2, 8, 3, 6, 4, 9, 5 ]),
        [ 7, 1, 0, 2, 3, 6, 8, 4, 9, 5 ]
    );

    const _2 = 'ABCDEFGH'.split('');
    t.deepEqual(
        heapsort(shuffle(_2)),
        _2
    );
});

//     v
//   | a b a b a c
//   | 0 1 2 3 4 5
// a | 1 1 3 1 5 1
// b | 0 2 0 4 0 4
// c | 0 0 0 0 0 6

//                       v
// 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4
// a a b a c a a b a b a c a a

//     v
//         v
//   | a a b
//   | 0 1 2
// a | 1 2 2
// b | 0 0 3

class DFA {
    private readonly steps: Array<{
        [ char: string ]: number;
    }>;

    public constructor(pattern: string) {
        const M = pattern.length;

        this.steps = new Array(M);

        if (M > 0) {
            this.steps[ 0 ] = {
                [ pattern[ 0 ] ]: 1
            };
        }

        for (let i = 1, x = 0; i < M; i++) {
            const backup = this.steps[ x ];
            const char = pattern.charAt(i);

            x = backup[ char ] || 0;

            this.steps[ i ] = {
                ...backup,
                [ char ]: i + 1
            };
        }
    }

    public lookup(input: string): number {
        const N = input.length;
        const M = this.steps.length;

        for (let i = 0, j = 0; i < N; i++) {
            j = this.next(j, input.charAt(i));

            if (j === M) {
                return i - M + 1;
            }
        }

        return -1;
    }

    private next(index: number, char: string): number {
        return this.steps[ index ][ char ] || 0;
    }
}

const find = (pattern: string, input: string): number => {
    return new DFA(pattern).lookup(input);
};

test('Algo.find', t => {
    t.is(
        find('aab', 'aaab'),
        1
    );

    t.is(
        find('ababac', 'aabacaababacaa'),
        6
    );

    t.is(
        find('ababaa', 'aabacaababacaa'),
        -1
    );
});
