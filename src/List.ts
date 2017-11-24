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

    public static member<T>(value: T, list: List<T>): boolean {
        for (const item of list) {
            if (value === item) {
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

    public static drop<T>(count: number, list: List<T>): List<T> {
        if (count === 0) {
            return list;
        }

        if (count >= this.size(list)) {
            return [];
        }

        return list.slice(count);
    }
}
