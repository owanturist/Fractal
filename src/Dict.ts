import {
    IsNever,
    WhenNever,
    Comparable,
    Order,
    isComparable
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

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

    get(key: K): Maybe<T>;

    insert(key: K, value: T): Node<K, T>;

    rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    // T E S T I N G
    serialize(): Serialization<K, T>;

    height(): Maybe<number>;
}

const Null_: Node<never, never> = new class Null<K, T> implements Node<K, T> {
    public size(): number {
        return 0;
    }

    public isEmpty(): boolean {
        return true;
    }

    public toBlack(): Node<K, T> {
        return this;
    }

    public isRed(): boolean {
        return false;
    }

    public get(): Maybe<T> {
        return Nothing;
    }

    public insert(key: K, value: T): Node<K, T> {
        return new Red(Null_, Null_, key, value);
    }

    public rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Red(left, this, key, value);
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(left, this, key, value);
    }

    public rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(this, right, key, value);
    }

    public serialize(): Serialization<K, T> {
        return null;
    }

    public height(): Maybe<number> {
        return Just(0);
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

    public get(key: K): Maybe<T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return this.left.get(key);
        }

        if (order.isGT()) {
            return this.right.get(key);
        }

        return Just(this.value);
    }

    public abstract insert(key: K, value: T): Node<K, T>;

    public abstract rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract rotateBlackRight(right: Node<K, T>, key: K, value: T): Node<K, T>;

    public abstract serialize(): Serialization<K, T>;

    public abstract height(): Maybe<number>;
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

    public rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        // rotate left
        return new Red(
            new Red(left, this.left, key, value),
            this.right,
            this.key,
            this.value
        );
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        // flip colors
        if (left.isRed()) {
            return new Red(left.toBlack(), this.toBlack(), key, value);
        }

        // rotate left
        return new Black(
            new Red(left, this.left, key, value),
            this.right,
            this.key,
            this.value
        );
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

    public height(): Maybe<number> {
        return Maybe.shape({
            left: this.left.height(),
            right: this.right.height()
        }).chain(({ left, right}) => left === right ? Just(left) : Nothing);
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

    public rotateRedLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Red(left, this, key, value);
    }

    public rotateBlackLeft(left: Node<K, T>, key: K, value: T): Node<K, T> {
        return new Black(left, this, key, value);
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

    public height(): Maybe<number> {
        return Maybe.shape({
            left: this.left.height(),
            right: this.right.height()
        }).chain(({ left, right}) => left === right ? Just(left + 1) : Nothing);
    }
}

// D I C T

export interface Collector<T> {
    (): Array<T>;
    iterator(): Iterable<T>;
}

export class Dict<K, T> {
    public static empty: Dict<never, never> = new Dict(Null_);

    public static singleton<K extends Key<K>, T>(key: K, value: T): Dict<Cast<K>, T> {
        return new Dict(
            (Null_ as Node<Cast<K>, T>).insert(key as unknown as Cast<K>, value).toBlack()
        );
    }

    public static fromList<K extends Key<K>, T>(
        pairs: Array<[ K, T ]>
    ): Dict<unknown extends K ? never : Cast<K>, unknown extends T ? never : T>;
    public static fromList<K extends Key<K>, T>(
        toKey: (value: T) => K,
        values: Array<T>
    ): Dict<unknown extends K ? never : Cast<K>, unknown extends T ? never : T>;
    public static fromList<K extends Key<K>, T>(
        ...args: [ Array<[ K, T ]> ] | [ (value: T) => K, Array<T> ]
    ): Dict<unknown extends K ? never : Cast<K>, unknown extends T ? never : T> {
        let root: Node<K, T> = Null_;

        if (args.length === 1) {
            for (const [ key, value ] of args[ 0 ]) {
                root = root.insert(key, value).toBlack();
            }
        } else {
            for (const value of args[ 1 ]) {
                root = root.insert(args[ 0 ](value), value).toBlack();
            }
        }

        return new Dict(root as unknown as Node<unknown extends K ? never : Cast<K>, unknown extends T ? never : T>);
    }

    // T E S T I N G
    protected static serialize<K, T>(dict: Dict<K, T>): Serialization<K, T> {
        return dict.root.serialize();
    }

    protected static height<K, T>(dict: Dict<K, T>): Maybe<number> {
        return dict.root.height();
    }

    protected constructor(private readonly root: Node<K, T>) {}

    public get<K_ extends Key<K_>>(key: WhenNever<K, K_>): Maybe<T> {
        return this.root.get(key as K);
    }

    public member<K_ extends Key<K_>>(key: WhenNever<K, K_>): boolean {
        return this.get(key).isJust();
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

    public upgrade<K_ extends Key<K_>, T_>(
        _key: WhenNever<K, K_>,
        _fn: IsNever<T, (value: T_) => T_, (value: T) => T>
    ): Dict<WhenNever<K, Cast<K_>>, WhenNever<T, T_>> {
        throw new Error('upgrade');
    }

    public remove<K_ extends Key<K_>>(
        _key: WhenNever<K, K_>
    ): Dict<WhenNever<K, K_>, T> {
        throw new Error('remove');
    }

    public size(): number {
        return this.root.size();
    }

    public isEmpty(): boolean {
        return this.root.isEmpty();
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
}

export default Dict;
