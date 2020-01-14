import {
    IsNever,
    WhenNever,
    isComparable
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

interface Node<K, T> {
    height: number;

    insert(key: K, value: T): [ boolean, Node<K, T> ];

    get(key: K): Maybe<T>;

    remove(key: K): Maybe<Node<K, T>>;
}

const Null: Node<never, never> = new class Null implements Node<never, never> {
    public height: number = 0;

    public insert<K, T>(key: K, value: T): [ boolean, Node<K, T> ] {
        return [
            true,
            Leaf.singleton(key, value)
        ];
    }

    public remove(): Maybe<Node<never, never>> {
        return Nothing;
    }

    public get(): Maybe<never> {
        return Nothing;
    }
}();

class Leaf<K, T> implements Node<K, T> {
    public static singleton<K, T>(key: K, value: T): Leaf<K, T> {
        return new Leaf(key, value, Null, Null);
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

    public insert(key: K, value: T): [ boolean, Node<K, T> ] {
        return [ false, this ];
    }

    public remove(key: K): Maybe<Node<K, T>> {
        return Nothing;
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
}

// D I C T

type Cast<K>
    = K extends string ? string
    : K extends number ? number
    : K extends Date ? Date
    : K
    ;

export namespace Dict {
    export type Key = string | number | Date;

    export interface Collector<T> {
        (): Array<T>;
        iterator(): Iterable<T>;
    }
}

export type Key = Dict.Key;

export interface Collector<T> extends Dict.Collector<T> {}

export class Dict<K extends Key, T> {
    public static empty: Dict<never, never> = new Dict(0, Null);

    public static singleton<K extends Key, T>(key: K, value: T): Dict<Cast<K>, T> {
        return new Dict(1, Leaf.singleton(key as Cast<K>, value));
    }

    public static fromList<K extends Key, T>(
        pairs: Array<[ K, T ]>
    ): unknown extends T ? Dict<never, never> : Dict<Cast<K>, T>;
    public static fromList<K extends Key, T>(
        toKey: (value: T) => K,
        values: Array<T>
    ): unknown extends T ? Dict<never, never> : Dict<Cast<K>, T>;
    public static fromList<K extends Key, T>(
        ...args: [ Array<[ K, T ]> ] | [ (value: T) => K, Array<T> ]
    ): Dict<K, T> {
        let count = 0;
        let root: Node<K, T> = Null;

        if (args.length === 1) {
            for (const [ key, value ] of args[ 0 ]) {
                const [ added, nextRoot ] = root.insert(key, value);

                count += added ? 1 : 0;
                root = nextRoot;
            }
        } else {
            for (const value of args[ 1 ]) {
                const [ added, nextRoot ] = root.insert(args[ 0 ](value), value);

                count += added ? 1 : 0;
                root = nextRoot;
            }
        }

        return new Dict(count, root);
    }

    private constructor(
        private readonly count: number,
        private readonly root: Node<K, T>
    ) {}

    public get<K_ extends Key>(key: WhenNever<K, K_>): Maybe<T>;
    public get(key: K): Maybe<T> {
        return this.root.get(key);
    }

    public member<K_ extends Key>(key: WhenNever<K, K_>): boolean {
        return this.get(key).isJust();
    }

    public insert<K_ extends Key, T_>(
        key: WhenNever<K, K_>,
        value: WhenNever<T, T_>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;
    public insert(key: K, value: T): Dict<K, T> {
        const [ added, nextRoot ] = this.root.insert(key, value);

        return new Dict(
            added ? this.count + 1 : this.count,
            nextRoot
        );
    }

    public update<K_ extends Key, T_ = never>(
        key: WhenNever<K, K_>,
        fn: IsNever<T, (value: Maybe<T_>) => Maybe<T_>, (value: Maybe<T>) => Maybe<T>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>>;
    public update(key: K, fn: (value: Maybe<T>) => Maybe<T>): Dict<K, T> {
        const probe = this.get(key);

        return fn(probe).fold(
            () => probe.isNothing() ? this : this.remove(key),
            (value: T) => this.insert(key, value)
        );
    }

    public remove<K_ extends Key>(key: WhenNever<K, K_>): Dict<WhenNever<K, K_>, T>;
    public remove(key: K): Dict<K, T> {
        return this.root.remove(key)
            .map((nextRoot: Node<K, T>) => new Dict(this.count - 1, nextRoot))
            .getOrElse(this);
    }

    public size(): number {
        return this.count;
    }

    public isEmpty(): boolean {
        return this.count === 0;
    }

    public map<K_ extends Key, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => R
    ): Dict<WhenNever<K, K_>, R> {
        throw new Error('map');
    }

    public filter<K_ extends Key, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): Dict<WhenNever<K, K_>, WhenNever<T, T>> {
        throw new Error('filter');
    }

    public partition<K_ extends Key, T_>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>) => boolean
    ): [
        Dict<WhenNever<K, K_>, WhenNever<T, T>>,
        Dict<WhenNever<K, K_>, WhenNever<T, T>>
    ] {
        throw new Error('partition');
    }

    public foldl<K_ extends Key, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        _acc: R
    ): R {
        throw new Error('foldl');
    }

    public foldr<K_ extends Key, T_, R>(
        _fn: (key: WhenNever<K, K_>, value: WhenNever<T, T_>, acc: R) => R,
        _acc: R
    ): R {
        throw new Error('foldr');
    }

    public union<K_ extends Key, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('union');
    }

    public intersect<K_ extends Key, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('intersect');
    }

    public diff<K_ extends Key, T_>(
        _another: Dict<WhenNever<K, K_>, WhenNever<T, T_>>
    ): Dict<WhenNever<K, K_>, WhenNever<T, T_>> {
        throw new Error('diff');
    }

    public merge<K_ extends Key, T_, P, R>(
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
