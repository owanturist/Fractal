import {
    IsNever,
    WhenNever
} from './Basics';
import { Router, Manager } from './Platform';
import * as Scheduler from './Platform/Scheduler';
import { Cmd } from './Platform/Cmd';
import { Process } from './Process';
import Either, { Left, Right } from './Either';

export class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new Task(
            Scheduler.succeed(value)
        );
    }

    public static fail<E>(error: E): Task<E, never> {
        return new Task(
            Scheduler.fail(error)
        );
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        let acc: Scheduler.Task<E, Array<T>> = Scheduler.succeed([]);

        for (const task of tasks) {
            acc = Scheduler.chain(
                (arr: Array<T>): Scheduler.Task<E, Array<T>> => Scheduler.chain(
                    (value: T): Scheduler.Task<E, Array<T>> => {
                        arr.push(value);

                        return Scheduler.succeed(arr);
                    },
                    task.internal
                ),
                acc
            );
        }

        return new Task(acc);
    }

    public static binding<E, T>(callback: (done: (task: Task<E, T>) => void) => void | (() => void)): Task<E, T> {
        return new Task(Scheduler.binding(
            (done: (task: Scheduler.Task<E, T>) => void): void | (() => void) => callback(
                (task: Task<E, T>): void => done(task.internal)
            )
        ));
    }

    public constructor(protected internal: Scheduler.Task<E, T>) {}

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return this.chain((value: T): Task<E, R> => Task.succeed(fn(value)));
    }

    public chain<G, R>(fn: (value: T) => Task<WhenNever<E, G>, R>): Task<WhenNever<E, G>, R> {
        return new Task(
            Scheduler.chain(
                (value: T): Scheduler.Task<WhenNever<E, G>, R> => fn(value).internal,
                this.internal as Scheduler.Task<WhenNever<E, G>, T>
            )
        );
    }

    public mapError<S>(fn: (error: E) => S): Task<S, T> {
        return this.onError((error: E): Task<S, T> => Task.fail(fn(error)));
    }

    public onError<G, S>(fn: (error: E) => Task<S, WhenNever<T, G>>): Task<S, WhenNever<T, G>> {
        return new Task(
            Scheduler.onError(
                (error: E): Scheduler.Task<S, WhenNever<T, G>> => fn(error).internal,
                this.internal as Scheduler.Task<E, WhenNever<T, G>>
            )
        );
    }

    public perform<Msg>(tagger: IsNever<E, (value: T) => Msg, never>): Cmd<Msg> {
        const result = this.map((value: T): Msg => tagger(value)) as Task<never, Msg>;

        return new Perform(result);
    }

    public attempt<Msg>(tagger: (either: Either<E, T>) => Msg): Cmd<Msg> {
        const result = this
            .map((value: T): Msg => tagger(Right(value)))
            .onError((error: E): Task<never, Msg> => Task.succeed(tagger(Left(error))));

        return new Perform(result);
    }

    public spawn(): Task<never, Process> {
        return new Task(
            Scheduler.chain(
                (process: Scheduler.Process): Scheduler.Task<never, Process> => {
                    return Scheduler.succeed(new Process(process));
                },
                Scheduler.spawn(this.internal)
            )
        );
    }

    public execute(): Scheduler.Task<E, T> {
        return this.internal;
    }
}

const manager: Manager = {
    init: Task.succeed(undefined),

    onEffects<AppMsg>(router: Router<AppMsg, never>, commands: Array<Perform<AppMsg>>): Task<never, void> {
        return Task.sequence(
            commands.map((command: Perform<AppMsg>): Task<never, Process> => command.onEffects(router))
        ).map(() => undefined);
    },

    onSelfMsg(): Task<never, void> {
        return Task.succeed(undefined);
    }
};

class Perform<AppMsg> extends Cmd<AppMsg> {
    protected readonly manager = manager;

    public constructor(protected readonly task: Task<never, AppMsg>) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): Perform<R> {
        return new Perform(this.task.map(fn));
    }

    public onEffects(router: Router<AppMsg, never>): Task<never, Process> {
        return this.task
            .chain((msg: AppMsg): Task<never, void> => router.sendToApp(msg))
            .spawn();
    }
}
