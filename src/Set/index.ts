import Maybe from '../Maybe';
import Dict from '../Dict';

import { Set as _} from './Set';

export interface Set<K> {
    min(): Maybe<K>;

    max(): Maybe<K>;

    member(key: K): boolean;

    insert(key: K): Set<K>;

    remove(key: K): Set<K>;

    toggle(key: K): Set<K>;

    size(): number;

    isEmpty(): boolean;

    map<R extends Key>(fn: (key: K) => R): Set<R>;

    filter(fn: (key: K) => boolean): Set<K>;

    partition(fn: (key: K) => boolean): [ Set<K>, Set<K> ];

    foldl<R>(fn: (key: K, acc: R) => R, acc: R): R;

    foldr<R>(fn: (key: K, acc: R) => R, acc: R): R;

    union(another: Set<K>): Set<K>;

    intersect(another: Set<K>): Set<K>;

    diff(another: Set<K>): Set<K>;

    keys(): Array<K>;

    tap<R>(fn: (that: Set<K>) => R): R;
}

export namespace Set {
    export type Key = Dict.Key;

    export const empty = _.empty;

    export const singleton = _.singleton;

    export const fromList = _.fromList;
}

export type Key = Set.Key;

export const empty = Set.empty;

export const singleton = Set.singleton;

export const fromList = Set.fromList;

export default Set;
