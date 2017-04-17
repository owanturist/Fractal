export type Branch<T> = (a: T) => void;

export interface TaskPattern<E, T, R> {
    Err(a: E): R;
    Ok(b: T): R;
}

export class Task<E, T> {
    constructor(private readonly fork: (reject: Branch<E>, resolve: Branch<T>) => void) {}

    public static success<E, T>(b: T): Task<E, T> {
        return new Task(
            (_: Branch<E>, resolve: Branch<T>): void => {
                resolve(b);
            }
        );
    }

    public static fail<E, T>(a: E): Task<E, T> {
        return new Task(
            (reject: Branch<E>): void => {
                reject(a);
            }
        );
    }

    public map<T1>(f: (b: T) => T1): Task<E, T1> {
        return new Task(
            (reject: Branch<E>, resolve: Branch<T1>): void => {
                this.fork(
                    reject,
                    (b: T) => resolve(f(b))
                )
            }
        );
    }

    public mapErr<E1>(f: (a: E) => E1): Task<E1, T> {
        return new Task(
            (reject: Branch<E1>, resolve: Branch<T>): void => {
                this.fork(
                    (a: E) => reject(f(a)),
                    resolve
                );
            }
        );
    }


    public bimap<E1, T1>(f: (b: E) => E1, g: (a: T) => T1): Task<E1, T1> {
        return new Task(
            (reject: Branch<E1>, resolve: Branch<T1>): void => {
                this.fork(
                    (a: E) => reject(f(a)),
                    (b: T) => resolve(g(b))
                );
            }
        );
    }

    public chain<T1>(f: (b: T) => Task<E, T1>): Task<E, T1> {
        return new Task(
            (reject: Branch<E>, resolve: Branch<T1>): void => {
                this.fork(
                    reject,
                    (b: T) => f(b).fork(reject, resolve)
                );
            }
        );
    }

    public orElse<E1>(f: (b: E) => Task<E1, T>): Task<E1, T> {
        return new Task(
            (reject: Branch<E1>, resolve: Branch<T>): void => {
                this.fork(
                    (a: E) => f(a).fork(reject, resolve),
                    resolve
                );
            }
        );
    }

    public fold<T1>(f: (b: E) => T1, g: (a: T) => T1): Task<E, T1> {
        return new Task(
            (_, resolve: Branch<T1>): void => {
                this.fork(
                    (a: E) => resolve(f(a)),
                    (b: T) => resolve(g(b))
                );
            }
        );
    }

    public cata<R>(pattern: TaskPattern<E, T, R>): Task<E, R> {
        return this.fold(pattern.Err, pattern.Ok);
    }
}
