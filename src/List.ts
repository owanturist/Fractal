import {
    Comparable,
    Order
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export abstract class List<T> {
    public static isList(something: any): something is List<any> {
        return something instanceof List;
    }

    public static fromArray<T>(array: Array<T>): List<T> {
        return new ListImpl(array.slice());
    }

    public static toArray<T>(listOrArray: List<T> | Array<T>): Array<T> {
        return List.isList(listOrArray) ? listOrArray.toArray() : listOrArray;
    }

    public static of<T>(...elements: Array<T>): List<T> {
        return new ListImpl(elements);
    }

    public static empty<T>(): List<T> {
        return new ListImpl<T>([]);
    }

    public static singleton<T>(element: T): List<T> {
        return new ListImpl([ element ]);
    }

    public static repeat<T>(count: number, element: T): List<T> {
        if (count <= 0) {
            return new ListImpl<T>([]);
        }

        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(element);
        }

        return new ListImpl(result);
    }

    public static initialize<T>(count: number, creator: (index: number) => T): List<T> {
        if (count <= 0) {
            return new ListImpl<T>([]);
        }

        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(creator(index));
        }

        return new ListImpl(result);
    }

    public static range(start: number, end: number): List<number> {
        if (start > end) {
            return new ListImpl<number>([]);
        }

        const result: Array<number> = [];

        for (let index = start; index <= end; index++) {
            result.push(index);
        }

        return new ListImpl(result);
    }

    public static zip<T, R>(left: List<T> | Array<T>, right: List<R> | Array<R>): List<[ T, R ]> {
        const left_: Array<T> = List.toArray(left);
        const right_: Array<R> = List.toArray(right);
        const result: Array<[ T, R ]> = [];

        for (let index = 0; index < left_.length && index < right_.length; index++) {
            result.push([ left_[ index ], right_[ index ]]);
        }

        return new ListImpl(result);
    }

    public static unzip<T, R>(listOrArray: List<[ T, R ]> | Array<[ T, R ]>): [ List<T>, List<R> ] {
        const array: Array<[ T, R ]> = List.toArray(listOrArray);
        const left: Array<T> = [];
        const right: Array<R> = [];

        for (const [ leftElement, rightElement ] of array) {
            left.push(leftElement);
            right.push(rightElement);
        }

        return [ new ListImpl(left), new ListImpl(right) ];
    }

    public static sum(listOrArray: List<number> | Array<number>): number {
        const array: Array<number> = List.toArray(listOrArray);
        let result = 0;

        for (const element of array) {
            result += element;
        }

        return result;
    }

    public static product(listOrArray: List<number> | Array<number>): number {
        const array: Array<number> = List.toArray(listOrArray);
        let result = 1;

        for (const element of array) {
            result *= element;
        }

        return result;
    }

    public static minimum(listOrArra: List<Comparable> | Array<Comparable>): Maybe<Comparable> {
        const array: Array<Comparable> = List.toArray(listOrArra);
        let result = Nothing<Comparable>();

        for (const element of array) {
            result = result.fold(
                (): Maybe<Comparable> => Just(element),
                (prev: Comparable): Maybe<Comparable> => {
                    return element < prev ? Just(element) : result;
                }
            );
        }

        return result;
    }

    public static maximum(listOrArray: List<Comparable> | Array<Comparable>): Maybe<Comparable> {
        const array: Array<Comparable> = List.toArray(listOrArray);
        let result = Nothing<Comparable>();

        for (const element of array) {
            result = result.fold(
                (): Maybe<Comparable> => Just(element),
                (prev: Comparable): Maybe<Comparable> => {
                    return element > prev ? Just(element) : result;
                }
            );
        }

        return result;
    }

    public static props<T extends object>(config: {[ K in keyof T ]: List<T[ K ]> | Array<T[ K ]>}): List<T> {
        const config_ = {} as {[ K in keyof T ]: Array<T[ K ]>};
        const result: Array<T> = [];
        let maxLength = 0;

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const listOrArray: List<T[ keyof T ]> | Array<T[ keyof T ]> = config[ key ];

                config_[ key ] = List.toArray(listOrArray);

                maxLength = config_[ key ].length > maxLength ? config_[ key ].length : maxLength;
            }
        }

        for (let index = 0; index < maxLength; index++) {
            const element = {} as T;

            for (const key in config_) {
                if (config_.hasOwnProperty(key)) {
                    element[ key ] = config_[ key ][ index ];
                }
            }

            result.push(element);
        }

        return new ListImpl(result);
    }

    public static all<T>(listOfLists: List<List<T> | Array<T>> | Array<List<T> | Array<T>>): List<T> {
        const listOfLists_: Array<List<T> | Array<T>> = List.toArray(listOfLists);
        let result: Array<T> = [];

        for (const listOrArray of listOfLists_) {
            result = result.concat(
                List.toArray(listOrArray)
            );
        }

        return new ListImpl(result);
    }

    public abstract isEmpty(): boolean;
    public abstract size(): number;
    public abstract count(fn: (element: T) => boolean): number;
    public abstract reverse(): List<T>;
    public abstract member(something: T): boolean;

    public abstract head(): Maybe<T>;
    public abstract tail(): Maybe<List<T>>;
    public abstract last(): Maybe<T>;
    public abstract init(): Maybe<List<T>>;
    public abstract filter(fn: (element: T) => boolean): List<T>;
    public abstract reject(fn: (element: T) => boolean): List<T>;
    public abstract remove(fn: (element: T) => boolean): List<T>;
    public abstract take(count: number): List<T>;
    public abstract takeWhile(fn: (element: T) => boolean): List<T>;
    public abstract drop(count: number): List<T>;
    public abstract dropWhile(fn: (element: T) => boolean): List<T>;
    public abstract unique(): List<T>;
    public abstract uniqueBy(fn: (element: T) => Comparable): List<T>;
    public abstract replaceIf(fn: (element: T) => boolean, next: T): List<T>;

    public abstract updateIf(fn: (element: T) => Maybe<T>): List<T>;
    public abstract cons(element: T): List<T>;
    public abstract append(listOrArray: List<T> | Array<T>): List<T>;
    public abstract concat(listOrArray: List<T> | Array<T>): List<T>;
    public abstract intersperse(gap: T): List<T>;
    public abstract partition(fn: (element: T) => boolean): [ List<T>, List<T> ];
    public abstract map<R>(fn: (element: T) => R): List<R>;
    public abstract chain<R>(fn: ((element: T) => List<R>) | ((element: T) => Array<R>)): List<R>;
    public abstract filterMap<R>(fn: (element: T) => Maybe<R>): List<R>;
    public abstract indexedMap<R>(fn: (index: number, element: T) => R): List<R>;
    public abstract foldl<R>(fn: (element: T, acc: R) => R, acc: R): R;
    public abstract foldr<R>(fn: (element: T, acc: R) => R, acc: R): R;
    public abstract find(fn: (element: T) => boolean): Maybe<T>;
    public abstract every(fn: (element: T) => boolean): boolean;
    public abstract any(fn: (element: T) => boolean): boolean;
    public abstract sortBy(fn: (element: T) => Comparable): List<T>;
    public abstract sortWith(fn: (prev: T, next: T) => Order): List<T>;
    public abstract toArray(): Array<T>;
}

class ListImpl<T> extends List<T> {
    constructor(private readonly array: Array<T>) {
        super();
    }

    public isEmpty(): boolean {
        return this.array.length === 0;
    }

    public size(): number {
        return this.array.length;
    }

    public count(fn: (element: T) => boolean): number {
        let counter = 0;

        for (const element of this.array) {
            if (fn(element)) {
                counter += 1;
            }
        }

        return counter;
    }

    public reverse(): List<T> {
        const result: Array<T> = [];

        for (let index = this.array.length - 1; index >= 0; index--) {
            result.push(this.array[ index ]);
        }

        return new ListImpl(result);
    }

    public member(something: T): boolean {
        for (const element of this.array) {
            if (element === something) {
                return true;
            }
        }

        return false;
    }


    public head(): Maybe<T> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(this.array[ 0 ]);
    }

    public tail(): Maybe<List<T>> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(
            new ListImpl(this.array.slice(1))
        );
    }

    public last(): Maybe<T> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(this.array[ this.array.length ]);
    }

    public init(): Maybe<List<T>> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(
            new ListImpl(this.array.slice(0, -1))
        );
    }

    public filter(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public reject(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (!fn(element)) {
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public remove(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];
        let removed = false;

        for (const element of this.array) {
            if (removed) {
                result.push(element);
            } else if (fn(element)) {
                removed = true;
            } else {
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public take(count: number): List<T> {
        return new ListImpl(this.array.slice(0, count));
    }

    public takeWhile(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            } else {
                return new ListImpl(result);
            }
        }

        return new ListImpl(result);
    }

    public drop(count: number): List<T> {
        return new ListImpl(this.array.slice(count));
    }

    public dropWhile(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];
        let dropped = false;

        for (const element of this.array) {
            if (dropped) {
                result.push(element);
            } else if (!fn(element)) {
                dropped = true;
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public unique(): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (result.indexOf(element) === -1) {
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public uniqueBy(fn: (element: T) => Comparable): List<T> {
        const result: Array<T> = [];
        const acc: {[ key: string ]: boolean} = {};

        for (const element of this.array) {
            const key = fn(element);

            if (!acc[ key ]) {
                acc[ key ] = true;
                result.push(element);
            }
        }

        return new ListImpl(result);
    }

    public replaceIf(fn: (element: T) => boolean, next: T): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(fn(element) ? next : element);
        }

        return new ListImpl(result);
    }


    public updateIf(fn: (element: T) => Maybe<T>): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(
                fn(element).getOrElse(element)
            );
        }

        return new ListImpl(result);
    }

    public cons(element: T): List<T> {
        return new ListImpl(
            [ element ].concat(this.array)
        );
    }

    public append(listOrArray: List<T> | Array<T>): List<T> {
        const array = List.toArray(listOrArray);

        return new ListImpl(
            array.concat(this.array)
        );
    }

    public concat(listOrArray: List<T> | Array<T>): List<T> {
        const array = List.toArray(listOrArray);

        return new ListImpl(
            this.array.concat(array)
        );
    }

    public intersperse(gap: T): List<T> {
        const result = this.array.slice(0, 1);

        for (let index = 1; index < length; index++) {
            result.push(gap, this.array[ index ]);
        }

        return new ListImpl(result);
    }

    public partition(fn: (element: T) => boolean): [ List<T>, List<T> ] {
        const success: Array<T> = [];
        const failure: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                success.push(element);
            } else {
                failure.push(element);
            }
        }

        return [ new ListImpl(success), new ListImpl(failure) ];
    }

    public map<R>(fn: (element: T) => R): List<R> {
        const result: Array<R> = [];

        for (const element of this.array) {
            result.push(fn(element));
        }

        return new ListImpl(result);
    }

    public chain<R>(fn: ((element: T) => List<R>) | ((element: T) => Array<R>)): List<R> {
        let result: Array<R> = [];

        for (const element of this.array) {
            const listOrArray = fn(element);

            result = result.concat(
                List.toArray(listOrArray)
            );
        }

        return new ListImpl(result);
    }

    public filterMap<R>(fn: (element: T) => Maybe<R>): List<R> {
        const result: Array<R> = [];

        for (const element of this.array) {
            fn(element).fold(
                (): void => {
                    // do nothing
                },
                (next: R): void => {
                    result.push(next);
                }
            );
        }

        return new ListImpl(result);
    }

    public indexedMap<R>(fn: (index: number, element: T) => R): List<R> {
        const result: Array<R> = [];

        for (let index = 0; index < length; index++) {
            result.push(fn(index, this.array[ index ]));
        }

        return new ListImpl(result);
    }

    public foldl<R>(fn: (element: T, acc: R) => R, acc: R): R {
        let acc_ = acc;

        for (const element of this.array) {
            acc_ = fn(element, acc_);
        }

        return acc_;
    }

    public foldr<R>(fn: (element: T, acc: R) => R, acc: R): R {
        let acc_ = acc;

        for (let index = this.array.length - 1; index >= 0; index--) {
            acc_ = fn(this.array[ index ], acc_);
        }

        return acc_;
    }

    public find(fn: (element: T) => boolean): Maybe<T> {
        for (const element of this.array) {
            if (fn(element)) {
                return Just(element);
            }
        }

        return Nothing();
    }

    public every(fn: (element: T) => boolean): boolean {
        for (const element of this.array) {
            if (!fn(element)) {
                return false;
            }
        }

        return true;
    }

    public any(fn: (element: T) => boolean): boolean {
        for (const element of this.array) {
            if (fn(element)) {
                return true;
            }
        }

        return false;
    }

    public sortBy(fn: (element: T) => Comparable): List<T> {
        return new ListImpl(
            this.array.slice().sort(
                (prev: T, next: T): number => {
                    const a = fn(prev).valueOf();
                    const b = fn(next).valueOf();

                    if (a === b) {
                        return 0;
                    }

                    return a < b ? -1 : 1;
                }
            )
        );
    }

    public sortWith(fn: (prev: T, next: T) => Order): List<T> {
        return new ListImpl(
            this.array.slice().sort(
                (prev: T, next: T): number => fn(prev, next).cata({
                    LT: () => -1,
                    EQ: () => 0,
                    GT: () => 1
                })
            )
        );
    }

    public toArray(): Array<T> {
        return this.array;
    }
}
