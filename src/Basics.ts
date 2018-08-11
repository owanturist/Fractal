export type Readonly<T> = {
    readonly [ K in keyof T ]: T[ K ];
};

export type Partial<T> = {
    [ K in keyof T ]?: T[ K ];
};

export type PartialPattern<T, R> = Partial<T> & Readonly<{ _(): R }>;

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

export const compare = <T extends Comparable>(left: T, right: T): Order => {
    if (left < right) {
        return LT;
    }

    if (left > right) {
        return GT;
    }

    return EQ;
};
