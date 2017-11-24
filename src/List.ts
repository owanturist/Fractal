export abstract class List<T> extends Array<T> {
    public static isEmpty<T>(list: List<T>): boolean {
        return list.length === 0;
    }

    public static size<T>(list: List<T>): number {
        return list.length;
    }

    public static reverse<T>(list: List<T>): List<T> {
        switch (list.length) {
            case 0:
            case 1: {
                return list;
            }

            default: {
                const res: List<T> = [];

                for (let i = list.length - 1; i >= 0; i--) {
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
}
