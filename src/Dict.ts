import {
    IsNever,
    WhenNever,
    Comparable,
    Order,
    isComparable
} from './Basics';
import Maybe from './Maybe';

export type Key<K> = string | number | Date | Comparable<K>;

type Cast<K>
    = K extends string ? string
    : K extends number ? number
    : K extends Date ? Date
    : K extends Comparable<K> ? Comparable<K>
    : never
    ;

const compare = <K>(left: K, right: K): Order => {
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

// N O D E

export type Serialization<K, T> = null | {
    color: 'red' | 'black';
    left: Serialization<K, T>;
    right: Serialization<K, T>;
    key: K;
    value: T;
};

interface Node<K, T> {
    size(): number;

    isEmpty(): boolean;

    toBlack(): Node<K, T>;

    isRed(): boolean;

    insert(key: K, value: T): Node<K, T>;

    rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    // T E S T I N G
    serialize(): Serialization<K, T>;
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

    public insert<K, T>(key: K, value: T): Node<K, T> {
        return new Red(Null_, Null_, key, value);
    }

    /**
     * @todo
     */
    public rotateRedLeft<K, T>(_left: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }
    /**
     * @todo
     */
    public rotateBlackLeft<K, T>(_left: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    /**
     * @todo
     */
    public rotateRedRight<K, T>(_right: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    /**
     * @todo
     */
    public rotateBlackRight<K, T>(_right: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    public serialize(): Serialization<never, never> {
        return null;
    }
}();

abstract class Leaf<K, T> implements Node<K, T> {
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

    public abstract toBlack(): Node<K, T>;

    public abstract isRed(): boolean;

    public abstract insert(key: K, value: T): Node<K, T>;

    public abstract rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateRedRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract serialize(): Serialization<K, T>;
}

class Red<K, T> extends Leaf<K, T> {
    public toBlack(): Node<K, T> {
        return new Black(this.left, this.right, this.key, this.value);
    }

    public isRed(): boolean {
        return true;
    }

    public insert(key: K, value: T): Node<K, T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return new Red(this.left.insert(key, value), this.right, this.key, this.value);
        }

        if (order.isGT()) {
            return this.right.insert(key, value).rotateRedLeft(this.left, this.key, this.value);
        }

        return new Red(this.left, this.right, this.key, value);
    }

    public rotateRedLeft(_left: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(
            new Red(left, this.left, key, value),
            this.right,
            this.key,
            this.value
        );
    }

    public rotateRedRight(_right: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    public rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        if (!this.left.isRed()) {
            return new Black(this, right, key, value);
        }

        // rotate right and flip
        return new Red(
            this.left.toBlack(),
            new Black(this.right, right, key, value),
            this.key,
            this.value
        );
    }

    public serialize(): Serialization<K, T> {
        return {
            color: 'red',
            left: this.left.serialize(),
            right: this.right.serialize(),
            key: this.key,
            value: this.value
        };
    }
}

class Black<K, T> extends Leaf<K, T> {
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

    public rotateRedLeft(_left: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(left, this, key, value);
    }

    public rotateRedRight(_right: Node<K, T>, _key: K, _value: T): Node<K, T> {
        return this;
    }

    public rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(this, right, key, value);
    }

    public serialize(): Serialization<K, T> {
        return {
            color: 'black',
            left: this.left.serialize(),
            right: this.right.serialize(),
            key: this.key,
            value: this.value
        };
    }
}

// D I C T

export interface Collector<T> {
    (): Array<T>;
    iterator(): Iterable<T>;
}

export class Dict<K, T> {
    public static empty: Dict<never, never> = new Dict(Null_);

    public static singleton<K extends Key<K>, T>(_key: K, _value: T): Dict<K, T> {
        throw new Error('');
    }

    public static fromList<K extends Key<K>, T>(
        pairs: Array<[ K, T ]>
    ): Dict<unknown extends K ? never : K, unknown extends T ? never : T>;
    public static fromList<K extends Key<K>, T>(
        toKey: (value: T) => K,
        values: Array<T>
    ): Dict<unknown extends K ? never : K, unknown extends T ? never : T>;
    public static fromList<K extends Key<K>, T>(
        _arg0: ((value: T) => K) | Array<[ K, T ]>,
        _arg1?: Array<T>
    ): Dict<unknown extends K ? never : K, unknown extends T ? never : T> {
        throw new Error('');
    }

    private constructor(private readonly root: Node<K, T>) {}

    public get<K_ extends Key<K_>>(_key: WhenNever<K, K_>): Maybe<T> {
        throw new Error('get');
    }

    public member<K_ extends Key<K_>>(_key: WhenNever<K, K_>): boolean {
        throw new Error('member');
    }

    public insert<K_ extends Key<K_>, T_>(
        key: WhenNever<K, K_>,
        value: WhenNever<T, T_>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        return new Dict(
            this.root.insert(key as K, value as T).toBlack()
        ) as unknown as Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>>;
    }

    public update<K_ extends Key<K_>, T_ = never>(
        _key: WhenNever<K, K_>,
        _fn: IsNever<T, (value: Maybe<T_>) => Maybe<T_>, (value: Maybe<T>) => Maybe<T>>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        throw new Error('update');
    }

    public remove<K_ extends Key<K_>>(
        _key: WhenNever<K, K_>
    ): Dict<WhenNever<K, K_>, T> {
        throw new Error('remove');
    }

    public size(): number {
        throw new Error('size');
    }

    public isEmpty(): boolean {
        throw new Error('isEmpty');
    }

    public map<K_ extends Key<K_>, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => R
    ): Dict<WhenNever<K, Cast<K_>>, R> {
        throw new Error('map');
    }

    public filter<K_ extends Key<K_>, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T>> {
        throw new Error('filter');
    }

    public partition<K_ extends Key<K_>, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): [
        Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T>>,
        Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T>>
    ] {
        throw new Error('partition');
    }

    public foldl<K_ extends Key<K_>, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        _acc: R
    ): R {
        throw new Error('foldl');
    }

    public foldr<K_ extends Key<K_>, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        _acc: R
    ): R {
        throw new Error('foldr');
    }

    public union<K_ extends Key<K_>, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        throw new Error('union');
    }

    public intersect<K_ extends Key<K_>, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        throw new Error('intersect');
    }

    public diff<K_ extends Key<K_>, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        throw new Error('diff');
    }

    public merge<K_ extends Key<K_>, T_, P, R>(
        _onLeft: (key: WhenNever<K, K_>, left: WhenNever<T, T_>, acc: R) => R,
        _onBoth: (key: WhenNever<K, K_>, left: WhenNever<T, T_>, right: P, acc: R) => R,
        _onRight: (key: WhenNever<K, K_>, right: P, acc: R) => R,
        _right: Dict<WhenNever<K, K_>, P>,
        _acc: R
    ): R {
        throw new Error('merge');
    }


    public get keys(): Collector<K> {
        throw new Error('');
    }

    public get values(): Collector<T> {
        throw new Error('');
    }

    public get entries(): Collector<[ K, T ]> {
        throw new Error('');
    }

    public tap<R>(fn: (that: Dict<K, T>) => R): R {
        return fn(this);
    }

    public serialize(): Serialization<K, T> {
        return this.root.serialize();
    }
}

export default Dict;
