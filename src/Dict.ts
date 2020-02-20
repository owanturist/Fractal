import {
    WhenUnknown,
    isComparable,
    Comparable
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

const compare = <K, R>(left: K, right: K, onLT: () => R, onEQ: () => R, onGT: () => R): R => {
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

    insert(key: K, value: T): [ boolean, Node<K, T> ];

    remove(key: K): Maybe<Node<K, T>>;

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

    public insert<K, T>(key: K, value: T): [ boolean, Node<K, T> ] {
        return [
            true,
            Leaf.singleton(key, value)
        ];
    }

    public remove(): Maybe<Node<K, T>> {
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
            new Leaf(pk, pv, pl, Null as unknown as Node<K, T>),
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
            new Leaf(pk, pv, Null as unknown as Node<K, T>, pr)
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
            () => Just(this.value),
            () => this.right.get(key)
        );
    }

    public insert(key: K, value: T): [ boolean, Node<K, T> ] {
        return compare(
            key,
            this.key,
            () => {
                const [ added, nextLeft ] = this.left.insert(key, value);

                return [ added, balance(this.key, this.value, nextLeft, this.right) ];
            },
            () => {
                const [ added, nextRight ] = this.right.insert(key, value);

                return [ added, balance(this.key, this.value, this.left, nextRight) ];
            },
            () => [
                false,
                new Leaf(key, value, this.left, this.right)
            ]
        );
    }

    public remove(_key: K): Maybe<Node<K, T>> {
        return Nothing;
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
        return this.left.foldl(
            fn,
            fn(
                this.key,
                this.value,
                this.right.foldl(fn, acc)
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
    export type Key<K>
        = string
        | number
        | Date
        | Comparable<K>
        ;
}

export type Key<K> = Dict.Key<K>;

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

    public static singleton<K extends Key<K>, T>(key: K, value: T): Dict<Cast<K>, T>;
    public static singleton<K, T>(key: K, value: T): Dict<K, T> {
        return new Dict(1, Leaf.singleton(key, value));
    }

    public static fromList<K extends Key<K>, T>(
        pairs: Array<[ K, T ]>
    ): unknown extends T ? Dict<unknown, unknown> : Dict<Cast<K>, T>;
    public static fromList<K extends Key<K>, T>(
        toKey: (value: T) => K,
        values: Array<T>
    ): unknown extends T ? Dict<unknown, unknown> : Dict<Cast<K>, T>;
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

    public get<K_ extends Key<K_>>(key: WhenUnknown<K, K_>): Maybe<T>;
    public get(key: K): Maybe<T> {
        return this.root.get(key);
    }

    public member<K_ extends Key<K_>>(key: WhenUnknown<K, K_>): boolean {
        return this.get(key).isJust();
    }

    public insert<K_ extends Key<K_>, T_>(
        key: WhenUnknown<K, K_>,
        value: WhenUnknown<T, T_>
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>;
    public insert(key: K, value: T): Dict<WhenUnknown<K, K>, WhenUnknown<T, T>> {
        const [ added, nextRoot ] = this.root.insert(key, value);

        return new Dict(
            added ? this.count + 1 : this.count,
            nextRoot
        ) as unknown as Dict<WhenUnknown<K, K>, WhenUnknown<T, T>>;
    }

    public remove<K_ extends Key<K_>>(key: WhenUnknown<K, K_>): Dict<WhenUnknown<K, Cast<K_>>, T>;
    public remove(key: K): Dict<WhenUnknown<K, K>, T> {
        return this.root.remove(key)
            .map((nextRoot: Node<K, T>) => new Dict(this.count - 1, nextRoot))
            .getOrElse(this) as unknown as Dict<WhenUnknown<K, K>, T>;
    }

    public update<K_ extends Key<K_>, T_>(
        key: WhenUnknown<K, K_>,
        fn: (value: Maybe<WhenUnknown<T, T_>>) => Maybe<WhenUnknown<T, T_>>
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>> {
        const probe = this.get(key) as Maybe<WhenUnknown<T, T_>>;

        return fn(probe).fold(
            () => probe.isNothing() ? this : this.remove(key),
            value => this.insert(key, value) as unknown as Dict<WhenUnknown<K, Cast<K_>>, T>
        ) as unknown as Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>;
    }

    public size(): number {
        return this.count;
    }

    public isEmpty(): boolean {
        return this.count === 0;
    }

    public map<K_ extends Key<K_>, T_, R>(
        fn: (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>) => R
    ): Dict<WhenUnknown<K, Cast<K_>>, R> {
        return new Dict(
            this.count,
            this.root.map(fn as (key: K, value: T) => R)
        ) as unknown as Dict<WhenUnknown<K, Cast<K_>>, R>;
    }

    public filter<K_ extends Key<K_>, T_>(
        fn: (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>) => boolean
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>> {
        const builder = this.foldl(
            (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>, acc) => {
                return fn(key, value) ? build(key, value, acc) : acc;
            },

            initialBuilder as Builder<WhenUnknown<K, K_>, WhenUnknown<T, T_>>
        );

        return new Dict(builder.count, builder.root as Node<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>);
    }

    public partition<K_ extends Key<K_>, T_>(
        fn: (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>) => boolean
    ): [
        Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>,
        Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>
    ] {
        const pair = this.foldl(
            (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>, [ left, right ]) => {
                return fn(key, value)
                    ? [ build(key, value, left), right ]
                    : [ left, build(key, value, right) ];
            },

            [
                initialBuilder as Builder<WhenUnknown<K, K_>, WhenUnknown<T, T_>>,
                initialBuilder as Builder<WhenUnknown<K, K_>, WhenUnknown<T, T_>>
            ]
        );

        return [
            new Dict(pair[ 0 ].count, pair[ 0 ].root as Node<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>),
            new Dict(pair[ 1 ].count, pair[ 1 ].root as Node<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>)
        ];
    }

    public foldl<K_ extends Key<K_>, T_, R>(
        fn: (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>, acc: R) => R,
        acc: R
    ): R {
        return (this.root as Node<WhenUnknown<K, K_>, WhenUnknown<T, T_>>).foldl(fn, acc);
    }

    public foldr<K_ extends Key<K_>, T_, R>(
        fn: (key: WhenUnknown<K, K_>, value: WhenUnknown<T, T_>, acc: R) => R,
        acc: R
    ): R {
        return (this.root as Node<WhenUnknown<K, K_>, WhenUnknown<T, T_>>).foldr(fn, acc);
    }

    public union<K_ extends Key<K_>, T_>(
        another: Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>> {
        return this.foldl(
            (key, value, acc) => acc.insert(
                key as unknown as WhenUnknown<WhenUnknown<K, Cast<K_>>, K_>,
                value as unknown as WhenUnknown<WhenUnknown<T, T_>, T_>
            ) as unknown as Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>,
            another
        );
    }

    public intersect<K_ extends Key<K_>, T_>(
        another: Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>> {
        return this.filter(
            key => another.member(key as unknown as WhenUnknown<WhenUnknown<K, Cast<K_>>, K_>)
        );
    }

    public diff<K_ extends Key<K>, T_>(
        another: Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>
    ): Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>> {
        return another.foldl(
            (key, _value, acc) => acc.remove(
                key
            ) as unknown as Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>,
            this as unknown as Dict<WhenUnknown<K, Cast<K_>>, WhenUnknown<T, T_>>
        );
    }

    public merge<K_ extends Key<K>, T_, D, R>(
        onLeft: (key: WhenUnknown<K, K_>, left: WhenUnknown<T, T_>, acc: R) => R,
        onBoth: (key: WhenUnknown<K, K_>, left: WhenUnknown<T, T_>, right: D, acc: R) => R,
        onRight: (key: WhenUnknown<K, K_>, right: D, acc: R) => R,
        right: Dict<WhenUnknown<K, Cast<K_>>, D>,
        acc: R
    ): R {
        let result = acc;
        let i = 0;
        let j = 0;
        const leftEntiries = this.entries();
        const rightEntiries = right.entries();

        while (i < this.count && j < right.count) {
            const [ leftKey, leftValue ] = leftEntiries[ i ] as [ WhenUnknown<K, K_>, WhenUnknown<T, T_> ];
            const [ rightKey, rightValue ] = rightEntiries[ j ] as [ WhenUnknown<K, K_>, D ];

            result = compare(
                leftKey,
                rightKey,
                () => {
                    i++;
                    return onLeft(leftKey, leftValue, result);
                },
                () => {
                    i++;
                    j++;
                    return onBoth(leftKey, leftValue, rightValue, result);
                },
                () => {
                    j++;
                    return onRight(rightKey, rightValue, result);
                }
            );
        }

        while (i++ < this.count) {
            const [ key, value ] = leftEntiries[ i ] as [ WhenUnknown<K, K_>, WhenUnknown<T, T_> ];

            result = onLeft(key, value, result);
        }

        while (j++ < right.count) {
            const [ key, value ] = rightEntiries[ j ] as [ WhenUnknown<K, K_>, D ];

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
