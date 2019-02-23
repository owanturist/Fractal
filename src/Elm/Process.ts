import * as Scheduler from './Scheduler';

export type ID = Scheduler.Process;

export function sleep(time: number): Scheduler.Task<never, void> {
    return Scheduler.binding(callback => {
        const id = setTimeout(() => {
            callback(Scheduler.succeed(undefined));
        }, time);

        return () => { clearTimeout(id); };
    });
}

export const spawn: <E, T>(task: Scheduler.Task<E, T>) => Scheduler.Task<E, ID> = Scheduler.spawn;

export const kill: (process: ID) => Scheduler.Task<never, void> = Scheduler.kill;
