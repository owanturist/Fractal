import Maybe from '../Maybe';
import { Cast, Dict } from '../Dict/Dict';

import {
    Set as ISet,
    Key
} from './index';

export class Set<K> implements ISet<K> {
    public static empty: Set<unknown> = new Set(Dict.empty as Dict<unknown, null>);

    public static singleton<K extends Key>(key: K): Set<Cast<K>> {
        return new Set(Dict.singleton(key, null));
    }

    public static fromList<K extends Key>(keys: Array<K>): Set<Cast<K>> {
        return new Set(Dict.fromList(key => key, () => null, keys));
    }

    public constructor(private readonly dict: Dict<K, null>) {}

    public min(): Maybe<K> {
        return this.dict.min().map(([ key ]) => key);
    }

    public max(): Maybe<K> {
        return this.dict.max().map(([ key ]) => key);
    }

    public member(key: K): boolean {
        return this.dict.member(key);
    }

    public insert(key: K): Set<K> {
        return new Set(this.dict.insert(key, null));
    }

    public remove(key: K): Set<K> {
        return new Set(this.dict.remove(key));
    }

    public toggle(key: K): Set<K> {
        if (this.member(key)) {
            return this.remove(key);
        }

        return this.insert(key);
    }

    public size(): number {
        return this.dict.size();
    }

    public isEmpty(): boolean {
        return this.dict.isEmpty();
    }

    public map<R extends Key>(fn: (key: K) => R): Set<R> {
        return new Set(this.dict.foldl(
            (key: K, _value, acc: Dict<R, null>) => acc.insert(fn(key), null),
            Dict.empty as Dict<R, null>
        ));
    }

    public filter(fn: (key: K) => boolean): Set<K> {
        return new Set(this.dict.filter(fn));
    }

    public partition(fn: (key: K) => boolean): [ Set<K>, Set<K> ] {
        const [ left, right ] = this.dict.partition(fn);

        return [ new Set(left), new Set(right) ];
    }

    public foldl<R>(fn: (key: K, acc: R) => R, acc: R): R {
        return this.dict.foldl((key: K, _value, acc: R) => fn(key, acc), acc);
    }

    public foldr<R>(fn: (key: K, acc: R) => R, acc: R): R {
        return this.dict.foldr((key: K, _value, acc: R) => fn(key, acc), acc);
    }

    public union(another: Set<K>): Set<K> {
        return new Set(this.dict.union(another.dict));
    }

    public intersect(another: Set<K>): Set<K> {
        return new Set(this.dict.intersect(another.dict));
    }

    public diff(another: Set<K>): Set<K> {
        return new Set(this.dict.diff(another.dict));
    }

    public keys(): Array<K> {
        return this.dict.keys();
    }

    public tap<R>(fn: (that: Set<K>) => R): R {
        return fn(this);
    }
}
