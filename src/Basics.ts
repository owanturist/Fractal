import * as Interfaces from './Interfaces';

export const isString = (value: any): value is string => typeof value === 'string';

export const isNumber = (value: any): value is number => typeof value === 'number';

export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';

export const isArray = (input: any): input is Array<any> => input instanceof Array;

export const isObject = (input: any): input is {[ key: string ]: any} => {
    return typeof input === 'object' && input !== null && !isArray(input);
};

export abstract class Order implements Interfaces.Order {
    public abstract isLT(): boolean;
    public abstract isEQ(): boolean;
    public abstract isGT(): boolean;

    public abstract cata<T>(pattern: Order.Pattern<T>): T;
}

export const LT: Interfaces.Order = new (class extends Order {
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

export const EQ: Interfaces.Order = new (class extends Order {
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

export const GT: Interfaces.Order = new (class extends Order {
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
    export type Pattern<T> = Interfaces.Order.Pattern<T>;
}
