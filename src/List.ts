import * as Interfaces from './Interfaces';
import {
    isArray
} from './Basics';
import {
    Nothing,
    Just
} from './Maybe';


export class List<T> implements Interfaces.List<T> {
    public static of<T>(...elements: Array<T>): Interfaces.List<T> {
        return new List(elements.slice());
    }

    public static empty<T>(): Interfaces.List<T> {
        return new List<T>([]);
    }

    public static singleton<T>(element: T): Interfaces.List<T> {
        return new List([ element ]);
    }

    public static fromArray<T>(array: Array<T>): Interfaces.List<T> {
        return new List(array);
    }

    public static repeat<T>(count: number, element: T): Interfaces.List<T> {
        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(element);
        }

        return new List(result);
    }

    public static initialize<T>(count: number, creator: (index: number) => T): Interfaces.List<T> {
        const result: Array<T> = [];

        for (let index = 0; index < count; index++) {
            result.push(creator(index));
        }

        return new List(result);
    }

    public static range(start: number, end: number): Interfaces.List<number> {
        const result: Array<number> = [];

        for (let index = start; index < end; index++) {
            result.push(index);
        }

        return new List(result);
    }

    public static zip<T, R>(
        left: Interfaces.List<T> | Array<T>,
        right: Interfaces.List<R> | Array<R>
    ): Interfaces.List<[ T, R ]> {
        const left_: Array<T> = isArray(left) ? left : left.toArray();
        const right_: Array<R> = isArray(right) ? right : right.toArray();
        const result: Array<[ T, R ]> = [];

        for (let index = 0; index < left_.length && index < right_.length; index++) {
            result.push([ left_[ index ], right_[ index ]]);
        }

        return new List(result);
    }

    public static unzip<T, R>(
        list: Interfaces.List<[ T, R ]> | Array<[ T, R ]>
    ): [ Interfaces.List<T>, Interfaces.List<R> ] {
        const list_: Array<[ T, R ]> = isArray(list) ? list : list.toArray();
        const left: Array<T> = [];
        const right: Array<R> = [];

        for (const [ leftElement, rightElement ] of list_) {
            left.push(leftElement);
            right.push(rightElement);
        }

        return [ new List(left), new List(right) ];
    }

    public static sum(list: Interfaces.List<number> | Array<number>): number {
        const list_: Array<number> = isArray(list) ? list : list.toArray();
        let result = 0;

        for (const element of list_) {
            result += element;
        }

        return result;
    }

    public static product(list: Interfaces.List<number> | Array<number>): number {
        const list_: Array<number> = isArray(list) ? list : list.toArray();
        let result = 1;

        for (const element of list_) {
            result *= element;
        }

        return result;
    }

    public static minimum(
        list: Interfaces.List<Interfaces.Comparable> | Array<Interfaces.Comparable>
    ): Interfaces.Maybe<Interfaces.Comparable> {
        const list_: Array<Interfaces.Comparable> = isArray(list) ? list : list.toArray();
        let result = Nothing<Interfaces.Comparable>();

        for (const element of list_) {
            result = result.fold(
                (): Interfaces.Maybe<Interfaces.Comparable> => Just(element),
                (prev: Interfaces.Comparable): Interfaces.Maybe<Interfaces.Comparable> => {
                    return element < prev ? Just(element) : result;
                }
            );
        }

        return result;
    }

    public static maximum(
        list: Interfaces.List<Interfaces.Comparable> | Array<Interfaces.Comparable>
    ): Interfaces.Maybe<Interfaces.Comparable> {
        const list_: Array<Interfaces.Comparable> = isArray(list) ? list : list.toArray();
        let result = Nothing<Interfaces.Comparable>();

        for (const element of list_) {
            result = result.fold(
                (): Interfaces.Maybe<Interfaces.Comparable> => Just(element),
                (prev: Interfaces.Comparable): Interfaces.Maybe<Interfaces.Comparable> => {
                    return element > prev ? Just(element) : result;
                }
            );
        }

        return result;
    }

    public static props<T extends object>(
        config: {[ K in keyof T ]: Interfaces.List<T[ K ]> | Array<T[ K ]>}
    ): Interfaces.List<T> {
        const config_ = {} as {[ K in keyof T ]: Array<T[ K ]>};
        const result: Array<T> = [];
        let maxLength = 0;

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value: Interfaces.List<T[ keyof T ]> | Array<T[ keyof T ]> = config[ key ];

                config_[ key ] = isArray(value) ? value : value.toArray();

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

        return new List(result);
    }

    public static all<T>(
        listOfLists: Interfaces.List<Interfaces.List<T>>
            | Interfaces.List<Array<T>>
            | Array<Interfaces.List<T>>
            | Array<Array<T>>
    ): Interfaces.List<T> {
        const listOfLists_: Array<Interfaces.List<T> | Array<T>> = isArray(listOfLists)
            ? listOfLists
            : listOfLists.toArray();
        let result: Array<T> = [];

        for (const list of listOfLists_) {
            result = result.concat(
                isArray(list) ? list : list.toArray()
            );
        }

        return new List(result);
    }

    constructor(private readonly array: Array<T>) {}

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

    public reverse(): Interfaces.List<T> {
        const result: Array<T> = [];

        for (let index = this.array.length - 1; index >= 0; index--) {
            result.push(this.array[ index ]);
        }

        return new List(result);
    }

    public member(something: T): boolean {
        for (const element of this.array) {
            if (element === something) {
                return true;
            }
        }

        return false;
    }


    public head(): Interfaces.Maybe<T> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(this.array[ 0 ]);
    }

    public tail(): Interfaces.Maybe<List<T>> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(
            new List(this.array.slice(1))
        );
    }

    public last(): Interfaces.Maybe<T> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(this.array[ this.array.length ]);
    }

    public init(): Interfaces.Maybe<List<T>> {
        if (this.array.length === 0) {
            return Nothing();
        }

        return Just(
            new List(this.array.slice(0, -1))
        );
    }

    public filter(fn: (element: T) => boolean): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            }
        }

        return new List(result);
    }

    public reject(fn: (element: T) => boolean): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (!fn(element)) {
                result.push(element);
            }
        }

        return new List(result);
    }

    public remove(fn: (element: T) => boolean): Interfaces.List<T> {
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

        return new List(result);
    }

    public take(count: number): Interfaces.List<T> {
        return new List(this.array.slice(0, count));
    }

    public takeWhile(fn: (element: T) => boolean): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                result.push(element);
            } else {
                return new List(result);
            }
        }

        return new List(result);
    }

    public drop(count: number): Interfaces.List<T> {
        return new List(this.array.slice(count));
    }

    public dropWhile(fn: (element: T) => boolean): Interfaces.List<T> {
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

        return new List(result);
    }

    public unique(): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            if (result.indexOf(element) === -1) {
                result.push(element);
            }
        }

        return new List(result);
    }

    public uniqueBy(fn: (element: T) => Interfaces.Comparable): Interfaces.List<T> {
        const result: Array<T> = [];
        const acc: {[ key: string ]: boolean} = {};

        for (const element of this.array) {
            const key = fn(element);

            if (!acc[ key ]) {
                acc[ key ] = true;
                result.push(element);
            }
        }

        return new List(result);
    }

    public replaceIf(fn: (element: T) => boolean, next: T): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(fn(element) ? next : element);
        }

        return new List(result);
    }


    public updateIf(fn: (element: T) => Interfaces.Maybe<T>): Interfaces.List<T> {
        const result: Array<T> = [];

        for (const element of this.array) {
            result.push(
                fn(element).getOrElse(element)
            );
        }

        return new List(result);
    }

    public cons(element: T): Interfaces.List<T> {
        return new List(
            [ element ].concat(this.array)
        );
    }

    public append(another: Interfaces.List<T> | Array<T>): Interfaces.List<T> {
        const another_ = isArray(another) ? another : another.toArray();

        return new List(
            another_.concat(this.array)
        );
    }

    public concat(another: Interfaces.List<T> | Array<T>): Interfaces.List<T> {
        const another_ = isArray(another) ? another : another.toArray();

        return new List(
            this.array.concat(another_)
        );
    }

    public intersperse(gap: T): Interfaces.List<T> {
        const result = this.array.slice(0, 1);

        for (let index = 1; index < length; index++) {
            result.push(gap, this.array[ index ]);
        }

        return new List(result);
    }

    public partition(fn: (element: T) => boolean): [ Interfaces.List<T>, Interfaces.List<T> ] {
        const success: Array<T> = [];
        const failure: Array<T> = [];

        for (const element of this.array) {
            if (fn(element)) {
                success.push(element);
            } else {
                failure.push(element);
            }
        }

        return [ new List(success), new List(failure) ];
    }

    public map<R>(fn: (element: T) => R): Interfaces.List<R> {
        const result: Array<R> = [];

        for (const element of this.array) {
            result.push(fn(element));
        }

        return new List(result);
    }

    public chain<R>(fn: ((element: T) => Interfaces.List<R>) | ((element: T) => Array<R>)): Interfaces.List<R> {
        const result: Array<R> = [];

        for (const element of this.array) {
            const next = fn(element);

            result.concat(
                isArray(next) ? next : next.toArray()
            );
        }

        return new List(result);
    }

    public filterMap<R>(fn: (element: T) => Interfaces.Maybe<R>): Interfaces.List<R> {
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

        return new List(result);
    }

    public indexedMap<R>(fn: (index: number, element: T) => R): Interfaces.List<R> {
        const result: Array<R> = [];

        for (let index = 0; index < length; index++) {
            result.push(fn(index, this.array[ index ]));
        }

        return new List(result);
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

    public find(fn: (element: T) => boolean): Interfaces.Maybe<T> {
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

    public sortBy(fn: (element: T) => Interfaces.Comparable): Interfaces.List<T> {
        return new List(
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

    public sortWith(fn: (prev: T, next: T) => Interfaces.Order): Interfaces.List<T> {
        return new List(
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
