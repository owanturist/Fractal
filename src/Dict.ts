import {
    isComparable,
    Comparable
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

const compare = <K, R>(left: K, right: K, onLT: () => R, onGT: () => R, onEQ: () => R): R => {
    if (isComparable(left)) {
        return left.compareTo(right).fold(onLT, onEQ, onGT);
    }

    if (left < right) {
        return onLT();
    }

    if (left > right) {
        return onGT();
    }

    return onEQ();
};

// N O D E

const balance = <K, T>(pk: K, pv: T, pl: Node<K, T>, pr: Node<K, T>): Node<K, T> => {
    if (pl.height - pr.height < -1) {
        return pr.rotateLeft(pk, pv, pl);
    }

    if (pl.height - pr.height > 1) {
        return pl.rotateRight(pk, pv, pr);
    }

    return new Leaf(pk, pv, pl, pr);
};

interface Node<K, T> {
    height: number;

    get(key: K): Maybe<T>;

    min(): Maybe<[ K, T ]>;

    max(): Maybe<[ K, T ]>;

    insert(key: K, value: T): [ boolean, Node<K, T> ];

    remove(key: K): Maybe<Node<K, T>>;

    removeMin(): Maybe<[ K, T, Node<K, T> ]>;

    removeMax(): Maybe<[ K, T, Node<K, T> ]>;

    map<R>(fn: (key: K, value: T) => R): Node<K, R>;

    foldl<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R;

    foldr<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R;

    // balance

    rotateLeft(pk: K, pv: T, pl: Node<K, T>): Node<K, T>;

    rotateLeftLeft(pk: K, pv: T, pl: Node<K, T>, rk: K, rv: T, rr: Node<K, T>): Node<K, T>;

    rotateRight(pk: K, pv: T, pr: Node<K, T>): Node<K, T>;

    rotateRightRight(pk: K, pv: T, lk: K, lv: T, ll: Node<K, T>, pr: Node<K, T>): Node<K, T>;
}

const Null: Node<unknown, unknown> = new class Null<K, T> implements Node<K, T> {
    public height: number = 0;

    public get(): Maybe<T> {
        return Nothing;
    }

    public min(): Maybe<[ K, T ]> {
        return Nothing;
    }

    public max(): Maybe<[ K, T ]> {
        return Nothing;
    }

    public insert<K, T>(key: K, value: T): [ boolean, Node<K, T> ] {
        return [
            true,
            Leaf.singleton(key, value)
        ];
    }

    public remove(): Maybe<Node<K, T>> {
        return Nothing;
    }

    public removeMin(): Maybe<[ K, T, Node<K, T> ]> {
        return Nothing;
    }

    public removeMax(): Maybe<[ K, T, Node<K, T> ]> {
        return Nothing;
    }

    public map<R>(): Node<K, R> {
        return this as unknown as Node<K, R>;
    }

    public foldl<R>(_fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return acc;
    }

    public foldr<R>(_fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return acc;
    }

    public rotateLeft(pk: K, pv: T, pl: Node<K, T>): Node<K, T> {
        return new Leaf(pk, pv, pl, this as Node<K, T>);
    }

    public rotateLeftLeft(pk: K, pv: T, pl: Node<K, T>, rk: K, rv: T, rr: Node<K, T>): Node<K, T> {
        return new Leaf(
            rk,
            rv,
            new Leaf(pk, pv, pl, this as Node<K, T>),
            rr
        );
    }

    public rotateRight(pk: K, pv: T, pr: Node<K, T>): Node<K, T> {
        return new Leaf(pk, pv, this as Node<K, T>, pr);
    }

    public rotateRightRight(pk: K, pv: T, lk: K, lv: T, ll: Node<K, T>, pr: Node<K, T>): Node<K, T> {
        return new Leaf(
            lk,
            lv,
            ll,
            new Leaf(pk, pv, this as Node<K, T>, pr)
        );
    }
}();

class Leaf<K, T> implements Node<K, T> {
    public static singleton<K, T>(key: K, value: T): Leaf<K, T> {
        return new Leaf(key, value, Null as Node<K, T>, Null as Node<K, T>);
    }

    public readonly height: number;

    public constructor(
        private readonly key: K,
        private readonly value: T,
        private readonly left: Node<K, T>,
        private readonly right: Node<K, T>
    ) {
        this.height = Math.max(left.height, right.height) + 1;
    }

    public get(key: K): Maybe<T> {
        return compare(
            key,
            this.key,
            () => this.left.get(key),
            () => this.right.get(key),
            () => Just(this.value)
        );
    }

    public min(): Maybe<[ K, T ]> {
        return this.left.min().orElse(() => Just<[ K, T ]>([ this.key, this.value ]));
    }

    public max(): Maybe<[ K, T ]> {
        return this.right.max().orElse(() => Just<[ K, T ]>([ this.key, this.value ]));
    }

    public insert(key: K, value: T): [ boolean, Node<K, T> ] {
        return compare(
            key,
            this.key,
            (): [ boolean, Node<K, T> ] => {
                const [ added, nextLeft ] = this.left.insert(key, value);

                return [ added, balance(this.key, this.value, nextLeft, this.right) ];
            },
            (): [ boolean, Node<K, T> ] => {
                const [ added, nextRight ] = this.right.insert(key, value);

                return [ added, balance(this.key, this.value, this.left, nextRight) ];
            },
            (): [ boolean, Node<K, T> ] => [
                false,
                new Leaf(key, value, this.left, this.right)
            ]
        );
    }

    public remove(key: K): Maybe<Node<K, T>> {
        return compare(
            key,
            this.key,
            () => this.left.remove(key).map(nextLeft => balance(this.key, this.value, nextLeft, this.right)),
            () => this.right.remove(key).map(nextRight => balance(this.key, this.value, this.left, nextRight)),
            () => {
                if (this.left.height < this.right.height) {
                    return this.right.removeMin().fold(
                        () => Just(this.left),
                        ([ minKey, minValue, nextRight ]) => Just(new Leaf(minKey, minValue, this.left, nextRight))
                    );
                }

                return this.left.removeMax().fold(
                    () => Just(this.right),
                    ([ minKey, minValue, nextLeft ]) => Just(new Leaf(minKey, minValue, nextLeft, this.right))
                );
            }
        );
    }

    public removeMin(): Maybe<[ K, T, Node<K, T> ]> {
        return this.left.removeMin().fold(
            () => Just([ this.key, this.value, this.right ] as [ K, T, Node<K, T> ]),
            ([ minKey, minValue, nextLeft ]: [ K, T, Node<K, T> ]) => Just([
                minKey,
                minValue,
                balance(this.key, this.value, nextLeft, this.right)
            ] as [ K, T, Node<K, T> ])
        );
    }

    public removeMax(): Maybe<[ K, T, Node<K, T> ]> {
        return this.right.removeMax().fold(
            () => Just([ this.key, this.value, this.left ] as [ K, T, Node<K, T> ]),
            ([ minKey, minValue, nextRight ]: [ K, T, Node<K, T> ]) => Just([
                minKey,
                minValue,
                balance(this.key, this.value, this.left, nextRight)
            ] as [ K, T, Node<K, T> ])
        );
    }

    public map<R>(fn: (key: K, value: T) => R): Node<K, R> {
        return new Leaf(
            this.key,
            fn(this.key, this.value),
            this.left.map(fn),
            this.right.map(fn)
        );
    }

    public foldl<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return this.right.foldl(
            fn,
            fn(
                this.key,
                this.value,
                this.left.foldl(fn, acc)
            )
        );
    }

    public foldr<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return this.left.foldr(
            fn,
            fn(
                this.key,
                this.value,
                this.right.foldr(fn, acc)
            )
        );
    }

    public rotateLeft(pk: K, pv: T, pl: Node<K, T>): Node<K, T> {
        return this.left.rotateLeftLeft(pk, pv, pl, this.key, this.value, this.right);
    }

    public rotateLeftLeft(pk: K, pv: T, pl: Node<K, T>, rk: K, rv: T, rr: Node<K, T>): Node<K, T> {
        if (this.height > rr.height) {
            return new Leaf(
                this.key,
                this.value,
                new Leaf(pk, pv, pl, this.left),
                new Leaf(rk, rv, this.right, rr)
            );
        }

        return new Leaf(
            rk,
            rv,
            new Leaf(pk, pv, pl, this),
            rr
        );
    }

    public rotateRight(pk: K, pv: T, pr: Node<K, T>): Node<K, T> {
        return this.right.rotateRightRight(pk, pv, this.key, this.value, this.left, pr);
    }

    public rotateRightRight(pk: K, pv: T, lk: K, lv: T, ll: Node<K, T>, pr: Node<K, T>): Node<K, T> {
        if (this.height > ll.height) {
            return new Leaf(
                this.key,
                this.value,
                new Leaf(lk, lv, ll, this.left),
                new Leaf(pk, pv, this.right, pr)
            );
        }

        return new Leaf(
            lk,
            lv,
            ll,
            new Leaf(pk, pv, this, pr)
        );
    }
}

// D I C T

type Cast<K>
    = K extends string ? string
    : K extends number ? number
    : K extends Date ? Date
    : K
    ;

export namespace Dict {
    export type Key
        = string
        | number
        | Date
        | Comparable<unknown>
        ;
}

export type Key = Dict.Key;

interface Builder<K, T> {
    count: number;
    root: Node<K, T>;
}

const initialBuilder: Builder<never, never> = {
    count: 0,
    root: Null as Node<never, never>
};

const build = <K, T>(key: K, value: T, { count, root }: Builder<K, T>): Builder<K, T> => {
    const [ added, nextRoot ] = root.insert(key, value);

    return {
        count: added ? count + 1 : count,
        root: nextRoot
    };
};

export class Dict<K, T> {
    public static empty: Dict<unknown, unknown> = new Dict(0, Null);

    public static singleton<K extends Key, T>(key: K, value: T): Dict<Cast<K>, T>;
    public static singleton<K, T>(key: K, value: T): Dict<K, T> {
        return new Dict(1, Leaf.singleton(key, value));
    }

    public static fromList<K extends Key, T>(pairs: Array<[ K, T ]>): Dict<Cast<K>, T>;
    public static fromList<K extends Key, T>(toKey: (value: T) => K, values: Array<T>): Dict<Cast<K>, T>;
    public static fromList<K, T>(
        ...args: [ Array<[ K, T ]> ] | [ (value: T) => K, Array<T> ]
    ): Dict<K, T> {
        let builder: Builder<K, T> = initialBuilder;

        if (args.length === 1) {
            for (const [ key, value ] of args[ 0 ]) {
                builder = build(key, value, builder);
            }
        } else {
            for (const value of args[ 1 ]) {
                builder = build(args[ 0 ](value), value, builder);
            }
        }

        return new Dict(builder.count, builder.root);
    }

    private constructor(
        private readonly count: number,
        private readonly root: Node<K, T>
    ) {}

    public get(key: K): Maybe<T> {
        return this.root.get(key);
    }

    public min(): Maybe<[ K, T ]> {
        return this.root.min();
    }

    public max(): Maybe<[ K, T ]> {
        return this.root.max();
    }

    public member(key: K): boolean {
        return this.get(key).isJust();
    }

    public insert(key: K, value: T): Dict<K, T> {
        const [ added, nextRoot ] = this.root.insert(key, value);

        return new Dict(
            added ? this.count + 1 : this.count,
            nextRoot
        );
    }

    public remove(key: K): Dict<K, T> {
        return this.root.remove(key)
            .map((nextRoot: Node<K, T>) => new Dict(this.count - 1, nextRoot))
            .getOrElse(this);
    }

    public update(key: K, fn: (value: Maybe<T>) => Maybe<T>): Dict<K, T> {
        const probe = this.get(key);

        return fn(probe).fold(
            () => probe.isNothing() ? this : this.remove(key),
            value => this.insert(key, value)
        );
    }

    public size(): number {
        return this.count;
    }

    public isEmpty(): boolean {
        return this.count === 0;
    }

    public map<R>(
        fn: (key: K, value: T) => R
    ): Dict<K, R> {
        return new Dict(
            this.count,
            this.root.map(fn as (key: K, value: T) => R)
        );
    }

    public filter(
        fn: (key: K, value: T) => boolean
    ): Dict<K, T> {
        const builder = this.foldl(
            (key: K, value: T, acc: Builder<K, T>) => {
                return fn(key, value) ? build(key, value, acc) : acc;
            },

            initialBuilder
        );

        return new Dict(builder.count, builder.root);
    }

    public partition(fn: (key: K, value: T) => boolean): [ Dict<K, T>, Dict<K, T> ] {
        const pair = this.foldl(
            (key: K, value: T, [ left, right ]: [ Builder<K, T>, Builder<K, T> ]) => {
                return fn(key, value)
                    ? [ build(key, value, left), right ]
                    : [ left, build(key, value, right) ];
            },

            [
                initialBuilder,
                initialBuilder
            ]
        );

        return [
            new Dict(pair[ 0 ].count, pair[ 0 ].root),
            new Dict(pair[ 1 ].count, pair[ 1 ].root)
        ];
    }

    public foldl<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return this.root.foldl(fn, acc);
    }

    public foldr<R>(fn: (key: K, value: T, acc: R) => R, acc: R): R {
        return this.root.foldr(fn, acc);
    }

    public union(another: Dict<K, T>): Dict<K, T> {
        if (another.isEmpty()) {
            return this;
        }

        return this.foldl(
            (key: K, value: T, acc: Dict<K, T>) => acc.insert(key, value),
            another
        );
    }

    public intersect(another: Dict<K, T>): Dict<K, T> {
        if (another.isEmpty()) {
            return Dict.empty as Dict<K, T>;
        }

        return this.filter((key: K) => another.member(key));
    }

    public diff(another: Dict<K, T>): Dict<K, T> {
        if (this.isEmpty()) {
            return Dict.empty as Dict<K, T>;
        }

        return another.foldl(
            (key: K, _value, acc: Dict<K, T>) => acc.remove(key),
            this
        );
    }

    public merge<D, R>(
        onLeft: (key: K, left: T, acc: R) => R,
        onBoth: (key: K, left: T, right: D, acc: R) => R,
        onRight: (key: K, right: D, acc: R) => R,
        right: Dict<K, D>,
        acc: R
    ): R {
        let result = acc;
        let i = 0;
        let j = 0;
        const leftEntiries = this.entries();
        const rightEntiries = right.entries();

        while (i < this.count && j < right.count) {
            const [ leftKey, leftValue ] = leftEntiries[ i ];
            const [ rightKey, rightValue ] = rightEntiries[ j ];

            result = compare(
                leftKey,
                rightKey,
                () => {
                    i++;
                    return onLeft(leftKey, leftValue, result);
                },
                () => {
                    j++;
                    return onRight(rightKey, rightValue, result);
                },
                () => {
                    i++;
                    j++;
                    return onBoth(leftKey, leftValue, rightValue, result);
                }
            );
        }

        while (i < this.count) {
            const [ key, value ] = leftEntiries[ i++ ];

            result = onLeft(key, value, result);
        }

        while (j < right.count) {
            const [ key, value ] = rightEntiries[ j++ ];

            result = onRight(key, value, result);
        }

        return result;
    }

    public keys(): Array<K> {
        return this.root.foldl((key: K, _value, acc: Array<K>) => {
            acc.push(key);

            return acc;
        }, []);
    }

    public values(): Array<T> {
        return this.root.foldl((_key, value: T, acc: Array<T>) => {
            acc.push(value);

            return acc;
        }, []);
    }

    public entries(): Array<[ K, T ]> {
        return this.root.foldl((key: K, value: T, acc: Array<[ K, T ]>) => {
            acc.push([ key, value ]);

            return acc;
        }, []);
    }

    public tap<R>(fn: (that: Dict<K, T>) => R): R {
        return fn(this);
    }
}

export default Dict;
