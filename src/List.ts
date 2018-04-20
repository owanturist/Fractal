import {
    Comparable,
    Order
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Record
} from './Record';

export abstract class List<T> {
    public static isList(something: any): something is List<any> {
        return something instanceof List;
    }

    public static fromArray<T>(array: Array<T>): List<T> {
        return new Proxy(array.slice());
    }

    public static toArray<T>(listOrArray: List<T> | Array<T>): Array<T> {
        return List.isList(listOrArray) ? listOrArray.toArray() : listOrArray;
    }

    public static of<T>(...elements: Array<T>): List<T> {
        return new Proxy(elements);
    }

    public static empty<T>(): List<T> {
        return new Proxy<T>([]);
    }

    public static singleton<T>(element: T): List<T> {
        return new Proxy([ element ]);
    }

    public static repeat<T>(count: number, element: T): List<T> {
        if (count <= 0) {
            return new Proxy<T>([]);
        }

        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(element);
        }

        return new Proxy(result);
    }

    public static initialize<T>(count: number, creator: (index: number) => T): List<T> {
        if (count <= 0) {
            return new Proxy<T>([]);
        }

        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(creator(index));
        }

        return new Proxy(result);
    }

    public static range(start: number, end: number): List<number> {
        if (start > end) {
            return new Proxy<number>([]);
        }

        const result: Array<number> = [];

        for (let index = start; index <= end; index++) {
            result.push(index);
        }

        return new Proxy(result);
    }

    public static zip<T1, T2, T3, T4>(
        first: List<T1> | Array<T1>,
        second: List<T2> | Array<T2>,
        third: List<T3> | Array<T3>,
        fourth: List<T4> | Array<T4>
    ): List<[ T1, T2, T3, T4 ]>;
    public static zip<T1, T2, T3>(
        first: List<T1> | Array<T1>,
        second: List<T2> | Array<T2>,
        third: List<T3> | Array<T3>
    ): List<[ T1, T2, T3 ]>;
    public static zip<T1, T2, >(
        first: List<T1> | Array<T1>,
        second: List<T2> | Array<T2>
    ): List<[ T1, T2 ]>;
    public static zip<T1, T2, T3, T4>(
        first: List<T1> | Array<T1>,
        second: List<T2> | Array<T2>,
        third?: List<T3> | Array<T3>,
        fourth?: List<T4> | Array<T4>
    ): List<[ T1, T2, T3, T4 ]> | List<[ T1, T2, T3 ]> | List<[ T1, T2 ]> {
        const first_: Array<T1> = List.toArray(first);
        const second_: Array<T2> = List.toArray(second);
        const minimumLength2 = first_.length < second_.length ? first_.length : second_.length;

        if (typeof third === 'undefined') {
            const result: Array<[ T1, T2 ]> = [];

            for (let index = 0; index < minimumLength2; index++) {
                result.push([
                    first_[ index ],
                    second_[ index ]
                ]);
            }

            return new Proxy(result);
        }

        const third_: Array<T3> = List.toArray(third);
        const minimumLength3 = minimumLength2 < third_.length ? minimumLength2 : third_.length;

        if (typeof fourth === 'undefined') {
            const result: Array<[ T1, T2, T3 ]> = [];

            for (let index = 0; index < minimumLength3; index++) {
                result.push([
                    first_[ index ],
                    second_[ index ],
                    third_[ index ]
                ]);
            }

            return new Proxy(result);
        }

        const fourth_: Array<T4> = List.toArray(fourth);
        const minimumLength4 = minimumLength3 < fourth_.length ? minimumLength3 : fourth_.length;
        const result: Array<[ T1, T2, T3, T4 ]> = [];

        for (let index = 0; index < minimumLength4; index++) {
            result.push([
                first_[ index ],
                second_[ index ],
                third_[ index ],
                fourth_[ index ]
            ]);
        }

        return new Proxy(result);
    }

    public static unzip<T1, T2, T3, T4>(
        listOrArray: List<[ T1, T2, T3, T4 ]> | Array<[ T1, T2, T3, T4 ]>
    ): [ List<T1>, List<T2>, List<T3>, List<T4> ];
    public static unzip<T1, T2, T3>(
        listOrArray: List<[ T1, T2, T3 ]> | Array<[ T1, T2, T3 ]>
    ): [ List<T1>, List<T2>, List<T3> ];
    public static unzip<T1, T2>(
        listOrArray: List<[ T1, T2 ]> | Array<[ T1, T2 ]>
    ): [ List<T1>, List<T2> ];
    public static unzip<T1, T2, T3, T4, R extends [ T1, T2, T3, T4 ] | [ T1, T2, T3 ] | [ T1, T2 ]>(
        listOrArray: List<R> | Array<R>
    ): [ List<T1>, List<T2>, List<T3>, List<T4> ] | [ List<T1>, List<T2>, List<T3> ] | [ List<T1>, List<T2> ] {
        const array: Array<R> = List.toArray(listOrArray);

        if (array.length === 0) {
            return [
                new Proxy([]),
                new Proxy([]),
                new Proxy([]),
                new Proxy([])
            ];
        }

        const first: Array<T1> = [];
        const second: Array<T2> = [];

        if (typeof array[ 0 ][ 2 ] === 'undefined') {
            for (const [ firstElement, secondElement ] of array) {
                first.push(firstElement);
                second.push(secondElement);
            }

            return [
                new Proxy(first),
                new Proxy(second)
            ];
        }

        const third: Array<T3> = [];

        if (typeof array[ 0 ][ 3 ] === 'undefined') {
            for (const [ firstElement, secondElement, thirdElement ] of array as Array<[ T1, T2, T3 ]>) {
                first.push(firstElement);
                second.push(secondElement);
                third.push(thirdElement);
            }

            return [
                new Proxy(first),
                new Proxy(second),
                new Proxy(third)
            ];
        }

        const fourth: Array<T4> = [];

        for (const [ firstElement, secondElement, thirdElement, fourthElement ] of array as Array<[ T1, T2, T3, T4 ]>) {
            first.push(firstElement);
            second.push(secondElement);
            third.push(thirdElement);
            fourth.push(fourthElement);
        }

        return [
            new Proxy(first),
            new Proxy(second),
            new Proxy(third),
            new Proxy(fourth)
        ];
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

    public static minimum(listOrArray: List<string> | Array<string>): Maybe<string>;
    public static minimum(listOrArray: List<number> | Array<number>): Maybe<number>;
    public static minimum<T extends Comparable>(listOrArray: List<T> | Array<T>): Maybe<T> {
        const array: Array<T> = List.toArray(listOrArray);
        let result = Nothing<T>();

        for (const element of array) {
            result = result.fold(
                (): Maybe<T> => Just(element),
                (prev: T): Maybe<T> => element < prev ? Just(element) : result
            );
        }

        return result;
    }

    public static maximum(listOrArray: List<string> | Array<string>): Maybe<string>;
    public static maximum(listOrArray: List<number> | Array<number>): Maybe<number>;
    public static maximum<T extends Comparable>(listOrArray: List<T> | Array<T>): Maybe<T> {
        const array: Array<T> = List.toArray(listOrArray);
        let result = Nothing<T>();

        for (const element of array) {
            result = result.fold(
                (): Maybe<T> => Just(element),
                (prev: T): Maybe<T> => element > prev ? Just(element) : result
            );
        }

        return result;
    }

    public static props<T extends object>(
        config: Record<{[ K in keyof T ]: List<T[ K ]> | Array<T[ K ]>}>
              | {[ K in keyof T ]: List<T[ K ]> | Array<T[ K ]>}
    ): List<Record<T>> {
        const config_ = Record.toObject(config);
        const configWithArrays = {} as {[ K in keyof T ]: Array<T[ K ]>};
        const result: Array<Record<T>> = [];
        let minimumLength: Maybe<number> = Nothing();

        for (const key in config_) {
            if (config_.hasOwnProperty(key)) {
                const array: Array<T[ keyof T ]> = List.toArray(config_[ key ]);

                configWithArrays[ key ] = array;
                minimumLength = minimumLength
                    .map((length: number): number => length < array.length ? length : array.length)
                    .orElse((): Maybe<number> => Just(array.length));
            }
        }

        for (let index = 0; index < minimumLength.getOrElse(0); index++) {
            const element = {} as T;

            for (const key in configWithArrays) {
                if (configWithArrays.hasOwnProperty(key)) {
                    element[ key ] = configWithArrays[ key ][ index ];
                }
            }

            result.push(Record.of(element));
        }

        return new Proxy(result);
    }

    public static sequence<T>(listOfLists: List<List<T> | Array<T>> | Array<List<T> | Array<T>>): List<T> {
        const listOfLists_: Array<List<T> | Array<T>> = List.toArray(listOfLists);
        let result: Array<T> = [];

        for (const listOrArray of listOfLists_) {
            result = result.concat(
                List.toArray(listOrArray)
            );
        }

        return new Proxy(result);
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
    public abstract uncons(): Maybe<[ T, List<T> ]>;
    public abstract push(element: T): List<T>;
    public abstract pop(): Maybe<[ T, List<T> ]>;
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

class Proxy<T> extends List<T> {
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
        if (this.array.length === 0) {
            return this;
        }

        const result: Array<T> = [];

        for (let index = this.array.length - 1; index >= 0; index--) {
            result.push(this.array[ index ]);
        }

        return new Proxy(result);
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
            new Proxy(this.array.slice(1))
        );
    }

    public last(): Maybe<T> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(this.array[ this.array.length - 1 ]);
    }

    public init(): Maybe<List<T>> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(
            new Proxy(this.array.slice(0, -1))
        );
    }

    public filter(fn: (element: T) => boolean): List<T> {
        if (this.array.length === 0) {
            return this;
        }

        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            }
        }

        return new Proxy(result);
    }

    public reject(fn: (element: T) => boolean): List<T> {
        if (this.array.length === 0) {
            return this;
        }

        const result: Array<T> = [];

        for (const element of this.array) {
            if (!fn(element)) {
                result.push(element);
            }
        }

        return new Proxy(result);
    }

    public remove(fn: (element: T) => boolean): List<T> {
        if (this.array.length === 0 ) {
            return this;
        }

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

        return new Proxy(result);
    }

    public take(count: number): List<T> {
        if (count >= this.array.length) {
            return this;
        }

        const result: Array<T> = this.array.slice(0, count);

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
    }

    public takeWhile(fn: (element: T) => boolean): List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            } else {
                return new Proxy(result);
            }
        }

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
    }

    public drop(count: number): List<T> {
        if (count === 0) {
            return this;
        }

        const result: Array<T> = this.array.slice(count);

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
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

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
    }

    public unique(): List<T> {
        if (this.array.length < 2) {
            return this;
        }

        const result: Array<T> = [];

        for (const element of this.array) {
            if (result.indexOf(element) === -1) {
                result.push(element);
            }
        }

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
    }

    public uniqueBy(fn: (element: T) => Comparable): List<T> {
        if (this.array.length < 2) {
            return this;
        }

        const result: Array<T> = [];
        const acc: {[ key: string ]: boolean } = {};

        for (const element of this.array) {
            const key = fn(element);

            if (!acc[ key ]) {
                acc[ key ] = true;
                result.push(element);
            }
        }

        if (result.length === this.array.length) {
            return this;
        }

        return new Proxy(result);
    }

    public replaceIf(fn: (element: T) => boolean, next: T): List<T> {
        if (this.array.length === 0) {
            return this;
        }

        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(fn(element) ? next : element);
        }

        return new Proxy(result);
    }


    public updateIf(fn: (element: T) => Maybe<T>): List<T> {
        if (this.array.length === 0) {
            return this;
        }

        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(
                fn(element).getOrElse(element)
            );
        }

        return new Proxy(result);
    }

    public cons(element: T): List<T> {
        return new Proxy(
            [ element ].concat(this.array)
        );
    }

    public uncons(): Maybe<[ T, List<T> ]> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just<[ T, List<T> ]>([
            this.array[ 0 ],
            new Proxy(this.array.slice(1))
        ]);
    }

    public push(element: T): List<T> {
        return new Proxy(
            this.array.concat([ element ])
        );
    }

    public pop(): Maybe<[ T, List<T> ]> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just<[ T, List<T> ]>([
            this.array[ this.array.length - 1 ],
            new Proxy(this.array.slice(0, -1))
        ]);
    }

    public append(listOrArray: List<T> | Array<T>): List<T> {
        if (this.array.length === 0) {
            return List.isList(listOrArray) ? listOrArray : new Proxy(listOrArray);
        }

        const array = List.toArray(listOrArray);

        if (array.length === 0) {
            return this;
        }

        return new Proxy(
            array.concat(this.array)
        );
    }

    public concat(listOrArray: List<T> | Array<T>): List<T> {
        if (this.array.length === 0) {
            return List.isList(listOrArray) ? listOrArray : new Proxy(listOrArray);
        }

        const array = List.toArray(listOrArray);

        if (array.length === 0) {
            return this;
        }

        return new Proxy(
            this.array.concat(array)
        );
    }

    public intersperse(gap: T): List<T> {
        if (this.array.length < 2) {
            return this;
        }

        const result = this.array.slice(0, 1);

        for (let index = 1; index < this.array.length; index++) {
            result.push(gap, this.array[ index ]);
        }

        return new Proxy(result);
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

        return [ new Proxy(success), new Proxy(failure) ];
    }

    public map<R>(fn: (element: T) => R): List<R> {
        if (this.array.length === 0) {
            return this as any as List<R>;
        }

        const result: Array<R> = [];

        for (const element of this.array) {
            result.push(fn(element));
        }

        return new Proxy(result);
    }

    public chain<R>(fn: ((element: T) => List<R>) | ((element: T) => Array<R>)): List<R> {
        if (this.array.length === 0) {
            return this as any as List<R>;
        }

        let result: Array<R> = [];

        for (const element of this.array) {
            const listOrArray = fn(element);

            result = result.concat(
                List.toArray(listOrArray)
            );
        }

        return new Proxy(result);
    }

    public filterMap<R>(fn: (element: T) => Maybe<R>): List<R> {
        if (this.array.length === 0) {
            return this as any as List<R>;
        }

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

        return new Proxy(result);
    }

    public indexedMap<R>(fn: (index: number, element: T) => R): List<R> {
        if (this.array.length === 0) {
            return this as any as List<R>;
        }

        const result: Array<R> = [];

        for (let index = 0; index < this.array.length; index++) {
            result.push(fn(index, this.array[ index ]));
        }

        return new Proxy(result);
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
        if (this.array.length < 2) {
            return this;
        }

        return new Proxy(
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
        if (this.array.length < 2) {
            return this;
        }

        return new Proxy(
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
