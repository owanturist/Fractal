import {
    IsNever,
    WhenNever,
    Order,
    Comparable,
    isComparable
} from './Basics';
import Maybe, { Nothing, Just } from './Maybe';

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
    isRed(): this is Red<K, T>;

    toBlack(): Node<K, T>;

    size(): number;

    isNull(): this is typeof Null;

    get(key: K): Maybe<T>;

    insert(key: K, value: T): Leaf<K, T>;

    removeMax(): Maybe<[ Node<K, T>, K, T ]>;

    traceRight(key: K, value: T): [ Node<K, T>, K, T ];

    moveRight(max: [ Node<K, T>, K, T ], parentKey: K, parentValue: T): [ Node<K, T>, K, T ];

    // T E S T I N G

    serialize(): Serialization<K, T>;
}

const Null: Node<never, never> = new class Null<K, T> implements Node<K, T> {
    public isRed(): boolean {
        return false;
    }

    public toBlack(): Node<K, T> {
        return this;
    }

    public size(): number {
        return 0;
    }

    public isNull(): boolean {
        return true;
    }

    public get(): Maybe<T> {
        return Nothing;
    }

    public insert(key: K, value: T): Leaf<K, T> {
        return new Red(this, this, key, value);
    }

    public removeMax(): Maybe<[ Node<K, T>, K, T ]> {
        return Nothing;
    }

    public traceRight(key: K, value: T): [ Node<K, T>, K, T ] {
        return [ this, key, value ];
    }

    public moveRight(max: [ Node<K, T>, K, T ]): [ Node<K, T>, K, T ] {
        return max;
    }

    public serialize(): Serialization<K, T> {
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

    public abstract isRed(): boolean;

    public abstract toBlack(): Node<K, T>;

    public size(): number {
        return this.left.size() + 1 + this.right.size();
    }

    public isNull(): boolean {
        return false;
    }

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

    public abstract insert(key: K, value: T): Leaf<K, T>;

    public removeMax(): Maybe<[ Node<K, T>, K, T ]> {
        return Just(this.left.moveRight(
            this.right.traceRight(this.key, this.value),
            this.key,
            this.value
        ));
    }

    // H E L P E R S

    public traceRight(): [ Node<K, T>, K, T ] {
        return this.left.moveRight(
            this.right.traceRight(this.key, this.value),
            this.key,
            this.value
        );
    }

    public abstract moveRight(max: [ Node<K, T>, K, T ], parentKey: K, parentValue: T): [ Node<K, T>, K, T ];

    public abstract rotateLeftRed(left: Node<K, T>, key: K, value: T): Leaf<K, T>;

    public abstract rotateLeftBlack(left: Node<K, T>, key: K, value: T): Leaf<K, T>;

    public abstract rotateRight(right: Node<K, T>, key: K, value: T): Leaf<K, T>;

    public serialize(): Serialization<K, T> {
        return {
            color: this.isRed() ? 'red' : 'black',
            left: this.left.serialize(),
            right: this.right.serialize(),
            key: this.key,
            value: this.value
        };
    }
}

class Red<K, T> extends Leaf<K, T> {
    public isRed(): boolean {
        return true;
    }

    public toBlack(): Node<K, T> {
        return new Black(this.left, this.right, this.key, this.value);
    }

    public insert(key: K, value: T): Leaf<K, T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return new Red(this.left.insert(key, value), this.right, this.key, this.value);
        }

        if (order.isGT()) {
            return this.right.insert(key, value).rotateLeftRed(this.left, this.key, this.value);
        }

        return new Red(this.left, this.right, this.key, value);
    }

    public moveRight(
        [ right, maxKey, maxValue ]: [ Node<K, T>, K, T ],
        parentKey: K,
        parentValue: T
    ): [ Node<K, T>, K, T ] {
        if (this.left.isNull()) {
            return [
                new Black(Null, Null, this.key, this.value),
                parentKey,
                parentValue
            ];
        }

        if (!right.isNull()) {
            return [
                new Black(this, right, parentKey, parentValue),
                maxKey,
                maxValue
            ];
        }

        const [ newLeft, newParentKey, newParentValue ] = this.traceRight();

        return [
            new Black(
                newLeft,
                new Black(Null, Null, parentKey, parentValue),
                newParentKey,
                newParentValue
            ),
            maxKey,
            maxValue
        ];
    }

    public rotateLeftRed(left: Node<K, T>, key: K, value: T): Leaf<K, T> {
        // rotate left
        return new Red(
            new Red(left, this.left, key, value),
            this.right,
            this.key,
            this.value
        );
    }

    public rotateLeftBlack(left: Node<K, T>, key: K, value: T): Leaf<K, T> {
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

    public rotateRight(right: Node<K, T>, key: K, value: T): Leaf<K, T> {
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
}

class Black<K, T> extends Leaf<K, T> {
    public isRed(): boolean {
        return false;
    }

    public toBlack(): Node<K, T> {
        return this;
    }

    public insert(key: K, value: T): Leaf<K, T> {
        const order = compare(key, this.key);

        if (order.isLT()) {
            return this.left.insert(key, value).rotateRight(this.right, this.key, this.value);
        }

        if (order.isGT()) {
            return this.right.insert(key, value).rotateLeftBlack(this.left, this.key, this.value);
        }

        return new Black(this.left, this.right, this.key, value);
    }

    public moveRight(
        [ right, maxKey, maxValue ]: [ Node<K, T>, K, T ],
        parentKey: K,
        parentValue: T
    ): [ Node<K, T>, K, T ] {
        return [
            new Black(
                new Red(this.left, this.right, this.key, this.value),
                right,
                parentKey,
                parentValue
            ),
            maxKey,
            maxValue
        ];
    }

    public rotateLeftRed(left: Node<K, T>, key: K, value: T): Leaf<K, T> {
        return new Red(left, this, key, value);
    }

    public rotateLeftBlack(left: Node<K, T>, key: K, value: T): Leaf<K, T> {
        return new Black(left, this, key, value);
    }

    public rotateRight(right: Node<K, T>, key: K, value: T): Leaf<K, T> {
        return new Black(this, right, key, value);
    }
}

// D I C T

export namespace Dict {
    export type Key<K> = string | number | Date | Comparable<K>;

    export interface Collector<T> {
        (): Array<T>;
        iterator(): Iterable<T>;
    }
}

export type Key<K> = Dict.Key<K>;

export interface Collector<T> extends Dict.Collector<T> {}

type Cast<K>
    = K extends string ? string
    : K extends number ? number
    : K extends Date ? Date
    : Comparable<K>
    ;

export class Dict<K, T> {
    public static empty: Dict<never, never> = new Dict(Null);

    public static singleton<K extends Key<K>, T>(key: K, value: T): Dict<Cast<K>, T> {
        return new Dict(
            (Null as Node<Cast<K>, T>).insert(key as unknown as Cast<K>, value).toBlack()
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
    ): Dict<unknown extends K ? never : K, unknown extends T ? never : T> {
        let root: Node<K, T> = Null;

        if (args.length === 1) {
            for (const [ key, value ] of args[ 0 ]) {
                root = root.insert(key, value).toBlack();
            }
        } else {
            for (const value of args[ 1 ]) {
                root = root.insert(args[ 0 ](value), value).toBlack();
            }
        }

        return new Dict(root as unknown as Node<unknown extends K ? never : K, unknown extends T ? never : T>);
    }

    // T E S T I N G
    protected static serialize<K, T>(dict: Dict<K, T>): Serialization<K, T> {
        return dict.root.serialize();
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
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        return new Dict(
            this.root.insert(key as K, value as T).toBlack()
        ) as unknown as Dict<WhenNever<K, K_>, WhenNever<T, T_>>;
    }

    public update<K_ extends Key<K_>, T_ = never>(
        _key: WhenNever<K, K_>,
        _fn: IsNever<T, (value: Maybe<T_>) => Maybe<T_>, (value: Maybe<T>) => Maybe<T>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('update');
    }

    public upgrade<K_ extends Key<K_>, T_>(
        _key: WhenNever<K, K_>,
        _fn: IsNever<T, (value: T_) => T_, (value: T) => T>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('upgrade');
    }

    public remove<K_ extends Key<K_>>(
        _key: WhenNever<K, K_>
    ): Dict<WhenNever<K, K_>, T> {
        throw new Error('remove');
    }

    public removeMax(): Dict<K, T> {
        return this.root.removeMax()
            .map(([ nextRoot ]: [ Node<K, T>, K, T ]): Dict<K, T> => new Dict(nextRoot))
            .getOrElse(this);
    }

    public size(): number {
        return this.root.size();
    }

    public isEmpty(): boolean {
        return this.root.isNull();
    }

    public map<K_ extends Key<K_>, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => R
    ): Dict<WhenNever<K, K_>, R> {
        throw new Error('map');
    }

    public filter<K_ extends Key<K_>, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): Dict<WhenNever<K, K_>, WhenNever<T, T>> {
        throw new Error('filter');
    }

    public partition<K_ extends Key<K_>, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): [
        Dict<WhenNever<K, K_>, WhenNever<T, T>>,
        Dict<WhenNever<K, K_>, WhenNever<T, T>>
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
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('union');
    }

    public intersect<K_ extends Key<K_>, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('intersect');
    }

    public diff<K_ extends Key<K_>, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
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
