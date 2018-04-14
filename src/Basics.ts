export type Readonly<T> = {
    readonly [ K in keyof T ]: T[ K ];
};

interface ValueArray extends Array<Value> {}

export type Value
    = null
    | string
    | boolean
    | number
    | ValueArray
    | {[ key: string ]: Value }
    ;

export type Comparable = string | number;

export abstract class Order {
    public abstract isLT(): boolean;
    public abstract isEQ(): boolean;
    public abstract isGT(): boolean;

    public abstract cata<T>(pattern: Order.Pattern<T>): T;
}

export const LT: Order = new (class extends Order {
    public isLT(): boolean {
        return true;
    }

    public isEQ(): boolean {
        return false;
    }

    public isGT(): boolean {
        return false;
    }

    public cata<T>(pattern: Order.Pattern<T>) {
        return pattern.LT();
    }
})();

export const EQ: Order = new (class extends Order {
    public isLT(): boolean {
        return false;
    }

    public isEQ(): boolean {
        return true;
    }

    public isGT(): boolean {
        return false;
    }

    public cata<T>(pattern: Order.Pattern<T>) {
        return pattern.EQ();
    }
})();

export const GT: Order = new (class extends Order {
    public isLT(): boolean {
        return false;
    }

    public isEQ(): boolean {
        return false;
    }

    public isGT(): boolean {
        return true;
    }

    public cata<T>(pattern: Order.Pattern<T>) {
        return pattern.GT();
    }
})();

export namespace Order {
    export type Pattern<T> = Readonly<{
        LT(): T;
        EQ(): T;
        GT(): T;
    }>;
}

export const isString = (value: Value): value is string => typeof value === 'string';

export const isNumber = (value: Value): value is number => typeof value === 'number';

export const isBoolean = (value: Value): value is boolean => typeof value === 'boolean';

export const isArray = (input: Value): input is Array<Value> => input instanceof Array;

export const isObject = (input: Value): input is {[ key: string ]: Value} => {
    return typeof input === 'object' && input !== null && !isArray(input);
};
