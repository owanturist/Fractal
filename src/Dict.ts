import {
    IsNever,
    WhenNever,
    Comparable,
    Order,
    isComparable
} from './Basics';
import Maybe from './Maybe';

export type Key<K> = string | number | Comparable<K>;

const compare = <K extends Key<K>>(left: K, right: K): Order => {
    if (isComparable(left)) {
        return left.compareTo(right);
    }

    if (left < right) {
        return Order.LT;
    }

    if (left > right) {
        return Order.GT;
    }

    return Order.EQ;
};

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

// N O D E

interface Node<K extends Key<K>, T> {
    size(): number;

    isEmpty(): boolean;

    toBlack(): Node<K, T>;

    isRed(): boolean;

    insert(key: K, value: T): Node<K, T>;

    rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;
}

const Null_: Node<never, never> = new class Null implements Node<never, never> {
    public size(): number {
        return 0;
    }

    public isEmpty(): boolean {
        return true;
    }

    public toBlack(): Node<never, never> {
        return this;
    }

    public isRed(): boolean {
        return false;
    }

    public insert<K extends Key<K>, T>(key: K, value: T): Node<K, T> {
        return new Red(Null_, Null_, key, value);
    }

    /**
     * @todo
     */
    public rotateRedLeft<K extends Key<K>, T>(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }
    /**
     * @todo
     */
    public rotateBlackLeft<K extends Key<K>, T>(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    /**
     * @todo
     */
    public rotateRedRight<K extends Key<K>, T>(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    /**
     * @todo
     */
    public rotateBlackRight<K extends Key<K>, T>(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }
}();

abstract class Leaf<K extends Key<K>, T> implements Node<K, T> {
    public constructor(
        protected readonly left: Node<K, T>,
        protected readonly right: Node<K, T>,
        protected readonly key: K,
        protected readonly value: T
    ) {}

    public size(): number {
        return this.left.size() + 1 + this.right.size();
    }

    public isEmpty(): boolean {
        return false;
    }

    public abstract toBlack(): Node<never, never>;

    public abstract isRed(): boolean;

    public abstract insert(key: K, value: T): Node<K, T>;

    public abstract rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;
}

class Red<K extends Key<K>, T> extends Leaf<K, T> {
    public toBlack(): Node<K, T> {
        return new Black(this.left, this.right, this.key, this.value);
    }

    public isRed(): boolean {
        return true;
    }

    public insert(key: K, value: T): Node<K, T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return this.left.insert(key, value).rotateRedRight(this.right, this.key, this.value);
        }

        if (order.isGT()) {
            return this.right.insert(key, value).rotateRedLeft(this.left, this.key, this.value);
        }

        return new Red(this.left, this.right, this.key, value);
    }

    public rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }
}

class Black<K extends Key<K>, T> extends Leaf<K, T> {
    public toBlack(): Node<K, T> {
        return this;
    }

    public isRed(): boolean {
        return false;
    }

    public insert(key: K, value: T): Node<K, T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return this.left.insert(key, value).rotateBlackRight(this.right, this.key, this.value);
        }

        if (order.isGT()) {
            return this.right.insert(key, value).rotateBlackLeft(this.left, this.key, this.value);
        }

        return new Black(this.left, this.right, this.key, value);
    }

    public rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }

    public rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return this;
    }
}
