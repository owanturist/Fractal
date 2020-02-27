import { Router, Manager, Process, Task, Sub } from '../index';
import * as Scheduler from '../Scheduler';

import Decode from '../Json/Decode';


type EventName = string;

type Processes = Map<EventName, Process>;

type Decoders<AppMsg> = Map<EventName, Array<Decode.Decoder<AppMsg>>>;

interface State<AppMsg> {
    decoders: Decoders<AppMsg>;
    processes: Processes;
}

class BrowserEventsManager<AppMsg> implements Manager<AppMsg, Event, State<AppMsg>> {
    public readonly init = Task.succeed({
        decoders: new Map(),
        processes: new Map()
    });

    public onEffects(
        router: Router<AppMsg, Event>,
        _commands: Array<never>,
        subscriptions: Array<BrowserEventsSub<AppMsg>>,
        { processes }: State<AppMsg>
    ): Task<never, State<AppMsg>> {
        const expiredProcesses: Array<Process> = [];
        const newListeners: Array<EventName> = [];
        const existingProcesses: Processes = new Map();
        const newTaggers: Decoders<AppMsg> = subscriptions.reduce(
            (acc: Decoders<AppMsg>, sub: BrowserEventsSub<AppMsg>): Decoders<AppMsg> => sub.register(acc),
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
                newListeners.push(interval);
            }
        }

        return Task.sequence(expiredProcesses.map((process: Process): Task<never, void> => process.kill()))
            .chain(() => newListeners.reduce(
                (acc: Task<never, Processes>, eventName: EventName): Task<never, Processes> => {
                    return acc.chain((processes: Processes) => {
                        return setEvent(eventName, event => router.sendToSelf(event))
                            .spawn()
                            .map((process: Process) => processes.set(eventName, process));
                    });
                },
                Task.succeed(existingProcesses)
            )).map((newProcesses: Processes): State<AppMsg> => ({
                decoders: newTaggers,
                processes: newProcesses
            }));
    }

    public onSelfMsg(
        router: Router<AppMsg, Event>,
        event: Event,
        state: State<AppMsg>
    ): Task<never, State<AppMsg>> {
        const decoders = state.decoders.get(event.type);

        if (decoders == null) {
            return Task.succeed(state);
        }

        const msgs: Array<AppMsg> = [];

        for (const decoder of decoders) {
            decoder.decode(event).fold(
                () => { /* do nothing */ },
                msg => msgs.push(msg)
            );
        }

        return router.sendToApp(msgs).map(() => state);
    }
}

const manager: Manager<unknown, Event, State<unknown>> = new BrowserEventsManager();

const setEvent = (eventName: EventName, callTask: (event: Event) => Task<never, void>): Task<never, void> => {
    return Task.binding(() => {
        const handler = (event: Event) => {
            Scheduler.rawSpawn(callTask(event).execute());
        };

        document.addEventListener(eventName, handler);

        return () => document.removeEventListener(eventName, handler);
    });
};

class BrowserEventsSub<AppMsg> extends Sub<AppMsg> {
    protected readonly manager = manager;

    public constructor(
        private readonly eventName: EventName,
        private readonly decoder: Decode.Decoder<AppMsg>
    ) {
        super();
    }

    public map<R>(fn: (msg: AppMsg) => R): BrowserEventsSub<R> {
        return new BrowserEventsSub(this.eventName, this.decoder.map(fn));
    }

    public register(decoders: Decoders<AppMsg>): Decoders<AppMsg> {
        const bag = decoders.get(this.eventName);

        if (bag == null) {
            decoders.set(this.eventName, [ this.decoder ]);
        } else {
            bag.push(this.decoder);
        }

        return decoders;
    }
}

export const onKeyPress = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('keypress', decoder);
};

export const onKeyDown = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('keydown', decoder);
};

export const onKeyUp = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('keyup', decoder);
};

export const onClick = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('click', decoder);
};

export const onMouseMove = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('mousemove', decoder);
};

export const onMouseDown = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('mousedown', decoder);
};

export const onMouseUp = <Msg>(decoder: Decode.Decoder<Msg>): Sub<Msg> => {
    return new BrowserEventsSub('mouseup', decoder);
};
