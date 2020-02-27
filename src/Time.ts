import { Router, Manager, Process, Task, Sub } from './index';
import * as Scheduler from './Scheduler';

type Processes = Map<number, Process>;

type Taggers<AppMsg> = Map<number, Array<(posix: number) => AppMsg>>;

interface State<AppMsg> {
    taggers: Taggers<AppMsg>;
    processes: Processes;
}

class TimeManager<AppMsg> implements Manager<AppMsg, number, State<AppMsg>> {
    public readonly init = Task.succeed({
        taggers: new Map(),
        processes: new Map()
    });

    public onEffects(
        router: Router<AppMsg, number>,
        _commands: Array<never>,
        subscriptions: Array<TimeSub<AppMsg>>,
        { processes }: State<AppMsg>
    ): Task<never, State<AppMsg>> {
        const expiredProcesses: Array<Process> = [];
        const newIntervals: Array<number> = [];
        const existingProcesses: Processes = new Map();
        const newTaggers: Taggers<AppMsg> = subscriptions.reduce(
            (acc: Taggers<AppMsg>, sub: TimeSub<AppMsg>): Taggers<AppMsg> => sub.register(acc),
            new Map()
        );

        for (const [ interval, existingProcess ] of processes) {
            if (newTaggers.has(interval)) {
                existingProcesses.set(interval, existingProcess);
            } else {
                expiredProcesses.push(existingProcess);
            }
        }

        for (const interval of newTaggers.keys()) {
            if (!existingProcesses.has(interval)) {
                newIntervals.push(interval);
            }
        }

        return Task.sequence(expiredProcesses.map((process: Process): Task<never, void> => process.kill()))
            .chain(() => newIntervals.reduce(
                (acc: Task<never, Processes>, interval: number): Task<never, Processes> => {
                    return acc.chain((processes: Processes) => {
                        return setEvery(interval, router.sendToSelf(interval))
                            .spawn()
                            .map((process: Process) => processes.set(interval, process));
                    });
                },
                Task.succeed(existingProcesses)
            )).map((newProcesses: Processes): State<AppMsg> => ({
                taggers: newTaggers,
                processes: newProcesses
            }));
    }

    public onSelfMsg(
        router: Router<AppMsg, number>,
        interval: number,
        state: State<AppMsg>
    ): Task<never, State<AppMsg>> {
        const taggers = state.taggers.get(interval);

        if (typeof taggers === 'undefined') {
            return Task.succeed(state);
        }

        const now = Date.now();

        return Task.sequence(
            taggers.map((tagger: (posix: number) => AppMsg) => router.sendToApp(tagger(now)))
        ).map(() => state);
    }
}

const manager: Manager<unknown, number, State<unknown>> = new TimeManager();

abstract class TimeSub<AppMsg> extends Sub<AppMsg> {
    protected readonly manager = manager;

    public abstract register(taggers: Taggers<AppMsg>): Taggers<AppMsg>;
}

class Every<AppMsg> extends TimeSub<AppMsg> {
    public constructor(
        private readonly interval: number,
        private readonly tagger: (poxis: number) => AppMsg
    ) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): TimeSub<R> {
        return new Every(
            this.interval,
            (posix: number): R => fn(this.tagger(posix))
        );
    }

    public register(taggers: Taggers<AppMsg>): Taggers<AppMsg> {
        const bag = taggers.get(this.interval);

        if (bag == null) {
            taggers.set(this.interval, [ this.tagger ]);
        } else {
            bag.push(this.tagger);
        }

        return taggers;
    }
}

const setEvery = (timeout: number, task: Task<never, void>): Task<never, void> => {
    return Task.binding(() => {
        const intervalId = setInterval(() => {
            Scheduler.rawSpawn(task.execute());
        }, timeout);

        return () => clearInterval(intervalId);
    });
};

export const now: Task<never, number> = Task.binding((done: (task: Task<never, number>) => void): void => {
    done(Task.succeed(Date.now()));
});

export const every = <AppMsg>(interval: number, tagger: (posix: number) => AppMsg): Sub<AppMsg> => {
    return new Every(interval, tagger);
};
