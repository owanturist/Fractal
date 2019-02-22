import * as Scheduler from './Scheduler';
import * as Platform from './Platform';
import {
    Either,
    Left,
    Right
} from '../Either';

// tslint:disable-next-line:no-empty-interface
interface Task<E, T> {}

export const succeed = <E, T>(value: T): Task<E, T> => Scheduler.succeed(value);

export const fail = <E, T>(error: E): Task<E, T> => Scheduler.fail(error);

export const andThen = <E, T, R>(fn: (value: T) => Task<E, R>, task: Task<E, T>): Task<E, R> => {
    return Scheduler.andThen(fn, task);
};

export const onError = <E, S, T>(fn: (error: E) => Task<S, T>, task: Task<E, T>): Task<S, T> => {
    return Scheduler.onError(fn, task);
};

export const map = <E, T, R>(fn: (value: T) => R, task: Task<E, T>): Task<E, R> => {
    return andThen(
        (value: T): Task<E, R> => succeed(fn(value)),
        task
    );
};

export const mapError = <E, S, T>(fn: (error: E) => S, task: Task<E, T>): Task<S, T> => {
    return andThen(
        (error: E): Task<S, T> => succeed(fn(error)),
        task
    );
};

export const map2 = <E, T1, T2, R>(
    fn: (value1: T1, value2: T2) => R,
    task1: Task<E, T1>,
    task2: Task<E, T2>
): Task<E, R> => {
    return andThen(
        (value1: T1): Task<E, R> => andThen(
            (value2: T2): Task<E, R> => succeed(fn(value1, value2)),
            task2
        ),
        task1
    );
};


export const sequence = <E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> => {
    return tasks.reduceRight(
        (acc: Task<E, Array<T>>, task: Task<E, T>): Task<E, Array<T>> => map2(
            (result: Array<T>, value: T): Array<T> => [ value, ...result ],
            acc,
            task
        ),
        succeed([])
    );
};

// R O U T E R

const spawnCmd = <Msg>(router, cmd: MyCmd<Msg>): Task<any, null> => {
    return Scheduler.spawn(
        andThen(
            (msg: Msg) => Platform.sendToApp(router, msg),
            cmd
        )
    );
};

export const home = Platform.createManager(
    succeed(null),
    <Msg>(router, commands: Array<MyCmd<Msg>>): Task<never, null> => {
        return map(
            () => null,
            sequence(commands.map((cmd: MyCmd<Msg>): Task<any, null> => spawnCmd(router, cmd)))
        );
    },
    () => succeed(null),
    <T, R>(tagger: (value: T) => R, cmd: MyCmd<T>): MyCmd<R> => map(tagger, cmd),
    null
);

type MyCmd<Msg> = Task<never, Msg>;

export const perform = <T, Msg>(tagger: (value: T) => Msg, task: Task<never, T>) => {
    const result: MyCmd<Msg> = map(tagger, task);

    return Platform.leaf('TASK', result);
};

export const attempt = <E, T, Msg>(tagger: (either: Either<E, T>) => Msg, task: Task<E, T>) => {
    const result: MyCmd<Msg> = onError(
        (error: E): Task<never, Msg> => succeed(tagger(Left(error))),
        andThen(
            (value: T): Task<never, Msg> => succeed(tagger(Right(value))),
            task
        )
    );

    return Platform.leaf('TASK', result);
};
