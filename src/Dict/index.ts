import {
    Comparable
} from '../Basics';
import Maybe from '../Maybe';

import { Cast, Dict as _ } from './Dict';

export interface Dict<K, T> {
    get(key: K): Maybe<T>;

    min(): Maybe<[ K, T ]>;

    max(): Maybe<[ K, T ]>;

    member(key: K): boolean;

    insert(key: K, value: T): Dict<K, T>;

    remove(key: K): Dict<K, T>;

    update(key: K, fn: (value: Maybe<T>) => Maybe<T>): Dict<K, T>;

    size(): number;

    isEmpty(): boolean;

    map<R>(fn: (key: K, value: T) => R): Dict<K, R>;

    filter(fn: (key: K, value: T) => boolean): Dict<K, T>;

    partition(fn: (key: K, value: T) => boolean): [ Dict<K, T>, Dict<K, T> ];

    foldl<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R;

    foldr<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R;

    union(another: Dict<K, T>): Dict<K, T>;

    intersect(another: Dict<K, T>): Dict<K, T>;

    diff(another: Dict<K, T>): Dict<K, T>;

    merge<D, R>(
        onLeft: (key: K, left: T, acc: R) => R,
        onBoth: (key: K, left: T, right: D, acc: R) => R,
        onRight: (key: K, right: D, acc: R) => R,
        right: Dict<K, D>,
        acc: R
    ): R;

    keys(): Array<K>;

    values(): Array<T>;

    entries(): Array<[ K, T ]>;

    tap<R>(fn: (that: Dict<K, T>) => R): R;
}

export namespace Dict {
    export type Key
        = string
        | number
        | Date
        | Comparable<unknown>
        ;

    export const empty: Dict<unknown, unknown> = _.empty;

    export const singleton: <K extends Key, T>(key: K, value: T) => Dict<Cast<K>, T> = _.singleton;

    export function fromList<K extends Key, T>(pairs: Array<[ K, T ]>): Dict<Cast<K>, T>;
    export function fromList<K extends Key, T, P>(
        toKey: (item: P) => K,
        toValue: (item: P) => T,
        items: Array<P>
    ): Dict<Cast<K>, T>;
    export function fromList<K extends Key, T, P>(
        ...args: [ Array<[ K, T ]> ] | [ (item: P) => K, (item: P) => T, Array<P> ]
    ): Dict<Cast<K>, T> {
        if (args.length === 1) {
            return _.fromList(([ key ]) => key, ([ , value ]) => value, args[ 0 ]);
        }

        return _.fromList(args[ 0 ], args[ 1 ], args[ 2 ]);
    }
}

export type Key = Dict.Key;

export const empty = Dict.empty;

export const singleton = Dict.singleton;

export const fromList = Dict.fromList;

export default Dict;
