import * as Scheduler from './Platform/Scheduler';
import { Task } from './Task';

export class Process {
    public static sleep(time: number): Task<never, void> {
        return Task.binding((callback: (task: Task<never, void>) => void) => {
            const id = setTimeout(() => {
                callback(Task.succeed(undefined));
            }, time);

            return () => { clearTimeout(id); };
        });
    }

    public constructor(protected readonly internal: Scheduler.Process) {}

    public kill(): Task<never, void> {
        return new Task(
            Scheduler.kill(this.internal)
        );
    }

    public execute(): Scheduler.Process {
        return this.internal;
    }
}
