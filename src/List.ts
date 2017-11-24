import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export abstract class List<T> extends Array<T> {
    public static isEmpty<T>(list: List<T>): boolean {
        return list.length === 0;
    }

    public static size<T>(list: List<T>): number {
        return list.length;
    }

    public static reverse<T>(list: List<T>): List<T> {
        const size = this.size(list);

        switch (size) {
            case 0:
            case 1: {
                return list;
            }

            default: {
                const res: List<T> = [];

                for (let i = size - 1; i >= 0; i--) {
                    res.push(list[ i ]);
                }

                return res;
            }
        }
    }

    public static member<T>(x: T, list: List<T>): boolean {
        for (const value of list) {
            if (x === value) {
                return true;
            }
        }

        return false;
    }

    public static head<T>(list: List<T>): Maybe<T> {
        if (this.isEmpty(list)) {
            return Nothing;
        }

        return Just(list[ 0 ]);
    }

    public static tail<T>(list: List<T>): Maybe<List<T>> {
        if (this.isEmpty(list)) {
            return Nothing;
        }

        return Just(this.drop(1, list));
    }

    public static filter<T>(fn: (value: T) => boolean, list: List<T>): List<T> {
        if (this.isEmpty(list)) {
            return list;
        }

        const res: List<T> = [];

        for (const value of list) {
            if (fn(value)) {
                res.push(value);
            }
        }

        if (this.size(list) === this.size(res)) {
            return list;
        }

        return res;
    }

    public static drop<T>(count: number, list: List<T>): List<T> {
        if (count === 0) {
            return list;
        }

        if (count >= this.size(list)) {
            return [];
        }

        return list.slice(count);
    }

    public static take<T>(count: number, list: List<T>): List<T> {
        if (count === 0) {
            return [];
        }

        if (count >= this.size(list)) {
            return list;
        }

        return list.slice(0, count);
    }

    public static singleton<T>(value: T): List<T> {
        return [ value ];
    }

    public static repeat<T>(count: number, value: T): List<T> {
        switch (count) {
            case 0: {
                return [];
            }

            case 1: {
                return this.singleton(value);
            }

            default: {
                const res: List<T> = [];

                while (count--) {
                    res.push(value);
                }

                return res;
            }
        }
    }

    public static range(start: number, end: number): List<number> {
        if (start === end) {
            return [ start ];
        }

        if (start > end) {
            return [];
        }

        const res: List<number> = [];

        do {
            res.push(start);
        } while (start++ < end)

        return res;
    }

    public static cons<T>(value: T, list: List<T>): List<T> {
        return [ value ].concat(list);
    }
}
