import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export abstract class List<T> {
    protected abstract isEmpty(): boolean;

    protected abstract member(value: T): boolean;

    protected abstract head(): Maybe<T>;

    protected abstract tail(): Maybe<List<T>>;

    protected abstract foldl<R>(fn: (value: T, acc: R) => R, acc: R): R;

    protected abstract map<R>(fn: (value: T) => R): List<R>;

    protected abstract cata<R>(pattern: Pattern<T, R>): R;

    public static isEmpty<T>(list: List<T>): boolean {
        return list.isEmpty();
    }

    public static member<T>(value: T, list: List<T>): boolean {
        return list.member(value);
    }

    public static tail<T>(list: List<T>): Maybe<List<T>> {
        return list.tail();
    }

    public static filter<T>(fn: (value: T) => boolean, list: List<T>): List<T> {
        return this.reverse(
            list.foldl(
                (value, acc) => fn(value) ? Cons(value, acc) : acc,
                Nil
            )
        );
    }

    public static head<T>(list: List<T>): Maybe<T> {
        return list.head();
    }

    public static size<T>(list: List<T>): number {
        return this.foldl(
            (_, acc) => acc + 1,
            0,
            list
        );
    }

    public static reverse<T>(list: List<T>): List<T> {
        return this.foldl(
            (value, acc) => Cons(value, acc),
            Nil,
            list
        );
    }

    public static foldl<T, R>(fn: (value: T, acc: R) => R, acc: R, list: List<T>): R {
        return list.foldl(fn, acc);
    }

    public static foldr<T, R>(fn: (value: T, acc: R) => R, acc: R, list: List<T>): R {
        return this.reverse(list).foldl(fn, acc);
    }

    public static map<T, R>(fn: (value: T) => R, list: List<T>): List<R> {
        return list.map(fn);
    }

    public static cata<T, R>(list: List<T>, pattern: Pattern<T, R>): R {
        return list.cata(pattern);
    }
}

interface Pattern<T, R> {
    Nil: () => R,
    Cons: (value: T, next: List<T>) => R
}

const list = {
    Nil: class Nil<T> extends List<T> {
        protected isEmpty() {
            return true;
        }

        protected member(): boolean {
            return false;
        }

        protected head(): Maybe<T> {
            return Nothing;
        }

        protected tail(): Maybe<List<T>> {
            return Nothing;
        }

        protected foldl<R>(_fn: (value: T, acc: R) => R, acc: R): R {
            return acc;
        }

        protected map<R>(): List<R> {
            return new Nil();
        }

        protected cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Nil();
        }
    },
    Cons: class Cons<T> extends List<T> {
        constructor (private readonly value: T, private readonly next: List<T>) {
            super();
        }

        protected isEmpty() {
            return false;
        }

        protected member(value: T): boolean {
            return value === this.value;
        }

        protected head(): Maybe<T> {
            return Just(this.value);
        }

        protected tail(): Maybe<List<T>> {
            return Just(this.next);
        }

        protected foldl<R>(fn: (value: T, acc: R) => R, acc: R): R {
            return List.foldl(
                fn,
                fn(this.value, acc),
                this.next
            );
        }

        protected map<R>(fn: (value: T) => R): List<R> {
            return new Cons(
                fn(this.value),
                List.map(fn, this.next)
            );
        }

        protected cata<R>(pattern: Pattern<T, R>): R {
            return pattern.Cons(this.value, this.next);
        }
    }
};

export const Nil: List<any> = new list.Nil();

export function Cons<T>(value: T, next: List<T>): List<T> {
    return new list.Cons(value, next);
}
