import * as Scheduler from './Scheduler';
import {
    Task
} from './Task';

export type Process = Scheduler.Process;

export function sleep(time: number): Task<never, void> {
    return Task.binding(callback => {
        const id = setTimeout(() => {
            callback(Task.succeed(undefined));
        }, time);

        return () => { clearTimeout(id); };
    });
}

export const kill: (process: Process) => Scheduler.Task<never, void> = Scheduler.kill;
