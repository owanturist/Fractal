interface Fn<T, R> extends Function {
    <P>(value: T): R | Fn<R, P>;
}

interface Pattern<T, R> {
    readonly Nothing: () => R;
    readonly Just: (value: T) => R;
}

interface LazyPattern<T, R> {
    readonly Nothing?: () => R;
    readonly Just?: (value: T) => R;
    readonly _: () => R;
}

export abstract class Maybe<T> {
    public abstract map<R, P>(fn: (value: T) => Fn<R, P>): Pipe<R, P>;
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;

    public abstract chain<R, P>(fn: (value: T) => Pipe<R, P>): Pipe<R, P>;
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;

    public abstract getOrElse(defaults: T): T;

    public abstract cata<R>(pattern: Pattern<T, R>): R;
    public abstract cata<R>(pattern: LazyPattern<T, R>): R;
}

class Nothing<T> implements Maybe<T> {
    public map<R, P>(fn: (value: T) => Fn<R, P>): Pipe<R, P>;
    public map<R>(fn: (value: T) => R): Maybe<R>;
    public map<R>(): Maybe<R> {
        return new Nothing();
    }

    public chain<R, P>(fn: (value: T) => Pipe<R, P>): Pipe<R, P>;
    public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public chain<R>(): Maybe<R> {
        return new Nothing();
    }

    public getOrElse(defaults: T): T {
        return defaults;
    }

    public cata<R>(pattern: Pattern<T, R>): R;
    public cata<R>(pattern: LazyPattern<T, R>): R;
    public cata<R>(pattern: Pattern<T, R> | LazyPattern<T, R>): R {
        return 'Nothing' in pattern
            ? (pattern as Pattern<T, R>).Nothing()
            : (pattern as LazyPattern<T, R>)._();
    }
}

class Just<T> implements Maybe<T> {
    constructor(protected readonly value: T) {}

    public map<R, P>(fn: (value: T) => Fn<R, P>): Pipe<R, P>;
    public map<R>(fn: (value: T) => R): Maybe<R>;
    public map<R, P>(fn: (value: T) => R | (Fn<R, P>)): Maybe<R> | Pipe<R, P> {
        const fnOrValue = fn(this.value);

        return typeof fnOrValue === 'function'
            ? new Pipe(fnOrValue)
            : new Just(fnOrValue);
    }

    public chain<R, P>(fn: (value: T) => Pipe<R, P>): Pipe<R, P>;
    public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public chain<R, P>(fn: (value: T) => Maybe<R> | Pipe<R, P>): Maybe<R> | Pipe<R, P> {
        return fn(this.value);
    }

    public getOrElse(): T {
        return this.value;
    }

    public cata<R>(pattern: Pattern<T, R>): R;
    public cata<R>(pattern: LazyPattern<T, R>): R;
    public cata<R>(pattern: Pattern<T, R> | LazyPattern<T, R>): R {
        return 'Just' in pattern
            ? (pattern as Pattern<T, R>).Just(this.value)
            : (pattern as LazyPattern<T, R>)._();
    }
}

class Pipe<T, R> extends Just<Fn<T, R>> {
    public ap<P>(maybe: Maybe<T>): Pipe<R, P>;
    public ap(maybe: Maybe<T>): Maybe<R>;
    public ap<P>(maybe: Maybe<T>): Maybe<R> | Pipe<R, P> {
        const fo: Fn<T, R> | Fn<T, Fn<R, P>> = this.value;

        return maybe.chain(
            (value: T): any => {
                const foo: R | Fn<R, P> = fo(value);

                return typeof foo === 'function'
                    ? new Pipe(foo) as Pipe<R, P>
                    : new Just(foo) as Maybe<R>
            }
        );
    }
}

export const __Nothing__: Maybe<any> = new Nothing();

export function __Just__<T, R>(fn: Fn<T, R>): Pipe<T, R>;
export function __Just__<T>(value: T): Maybe<T>;
export function __Just__<T, R>(fnOrValue: T | Fn<T, R>): Maybe<T> | Pipe<T, R> {
    return typeof fnOrValue === 'function'
        ? new Pipe(fnOrValue)
        : new Just(fnOrValue);
}

export const A = __Just__(1);
export const B = __Just__(2);
export const C = __Just__('hi');

const pipe1 = __Just__((a: number) => a * 2).ap(A);
const pipe2 = __Just__((a: number) => (b: number) => a * 2 - b).ap(A);
const pipe3 = A.map(a => (b: number) => a * b);
const pipe4 = A.chain(a => __Just__((b: number) => a * b));

// const pip = fn.ap(A)

export function bar<T1, T2, T3, T4, R>(
    fn: (t1: T1) => (t2: T2) => (t3: T3) => (t4: T4) => R,
    t1: T1,
    t2: T2,
    t3: T3,
    t4: T4
): R;
export function bar<T1, T2, T3, R>(
    fn: (t1: T1) => (t2: T2) => (t3: T3) => R,
    t1: T1,
    t2: T2,
    t3: T3
): R;
export function bar<T1, T2, R>(
    fn: (t1: T1) => (t2: T2) => R,
    t1: T1,
    t2: T2
): R;
export function bar<T1, R>(
    fn: (t1: T1) => R,
    t1: T1
): R;
export function bar<T1, T2, T3, T4, R>(
    fn: Function,
    t1: T1,
    t2?: T2,
    t3?: T3,
    t4?: T4
): R {
    if (typeof t2 === 'undefined') {
        return fn(t1);
    }

    if (typeof t3 === 'undefined') {
        return fn(t1)(t2);
    }

    if (typeof t4 === 'undefined') {
        return fn(t1)(t2)(t3);
    }

    return fn(t1)(t2)(t3)(t4);
}

const asd = bar(
    (a: number) => (b: number) => (c: number): number => a * b * c,
    1,
    3
);
