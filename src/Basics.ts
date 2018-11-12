export interface DefaultCase<R> {
    _(): R;
}

export type WithDefaultCase<T, R> = T | Partial<T> & DefaultCase<R>;

export type IsNever<A, T, F> = [ A ] extends [ never ] ? T : F;

export type WhenNever<A, T> = IsNever<A, T, A>;
