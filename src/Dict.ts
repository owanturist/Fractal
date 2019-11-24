import {
    IsNever,
    WhenNever,
    Comparable,
    Order
} from './Basics';
import Maybe from './Maybe';

export type Key<K> = string | number | Date | Comparable<K>;

export interface Collector<T> {
    (): Array<T>;
    iterator(): Iterable<T>;
}

export interface Dict<K, T> {
    keys: Collector<K>;

    values: Collector<T>;

    entries: Collector<[ K, T ]>;

    get<K_>(key: WhenNever<K, K_>): Maybe<T>;

    member<K_>(key: WhenNever<K, K_>): boolean;

    insert<K_, T_>(
        key: WhenNever<K, K_>,
        value: WhenNever<T, T_>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;

    update<K_, T_ = never>(
        key: WhenNever<K, K_>,
        fn: IsNever<T, (value: Maybe<T_>) => Maybe<T_>, (value: Maybe<T>) => Maybe<T>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;

    remove<K_>(key: WhenNever<K, K_>): Dict<WhenNever<K, K_>, T>;

    size(): number;

    isEmpty(): boolean;

    map<K_, T_, R>(
        fn: (key: WhenNever<K, K_>, value: WhenNever<T, T>) => R
    ): Dict<WhenNever<K, K_>, R>;

    filter<K_, T_>(
        fn: (key: WhenNever<K, K_>, value: WhenNever<T, T>) => boolean
    ): Dict<WhenNever<K, K_>, WhenNever<T, T>>;

    partition<K_, T_>(
        fn: (key: WhenNever<K, K_>, value: WhenNever<T, T>) => boolean
    ): [
        Dict<WhenNever<K, K_>, WhenNever<T, T>>,
        Dict<WhenNever<K, K_>, WhenNever<T, T>>
    ];

    foldl<K_, T_, R>(
        fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        acc: R
    ): R;

    foldr<K_, T_, R>(
        fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        acc: R
    ): R;

    union<K_, T_>(
        another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;

    intersect<K_, T_>(
        another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;

    diff<K_, T_>(
        another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;

    merge<K_, T_, P, R>(
        onLeft: (key: WhenNever<K, K_>, left: WhenNever<T, T_>, acc: R) => R,
        onBoth: (key: WhenNever<K, K_>, left: WhenNever<T, T_>, right: P, acc: R) => R,
        onRight: (key: WhenNever<K, K_>, right: P, acc: R) => R,
        right: Dict<WhenNever<K, K_>, P>,
        acc: R
    ): R;

    tap<R>(fn: (that: Dict<K, T>) => R): R;
}

export const empty: Dict<never, never> = null as never;

export const singleton = <K extends Key<K>, T>(key: K, value: T): Dict<K, T> => {
    throw new Error('');
};

export function fromList<K extends Key<K>, T>(
    pairs: Array<[ K, T ]>
): Dict<unknown extends K ? never : K, unknown extends T ? never : T>;
export function fromList<K extends Key<K>, T>(
    toKey: (value: T) => K,
    values: Array<T>
): Dict<unknown extends K ? never : K, unknown extends T ? never : T>;
export function fromList<K extends Key<K>, T>(
    arg0: ((value: T) => K) | Array<[ K, T ]>,
    arg1?: Array<T>
): Dict<unknown extends K ? never : K, unknown extends T ? never : T> {
    throw new Error('');
}
