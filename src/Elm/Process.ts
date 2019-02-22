import * as Scheduler from './Scheduler';

export function sleep(time) {
    return Scheduler.binding(callback => {
        const id = setTimeout(() => {
            callback(Scheduler.succeed(null));
        }, time);

        return () => { clearTimeout(id); };
    });
}

export const spawn = Scheduler.spawn;
