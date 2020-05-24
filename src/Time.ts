// import {
//     Unit
// } from './Basics';
// import { Router, Manager, Process, Task, Cmd, Sub } from './remade';
// import Dict from './Dict';

// export type Tagger<AppMsg> = (posix: number) => AppMsg;

// interface State<AppMsg> {
//     taggers: Dict<number, Array<Tagger<AppMsg>>>;
//     processes: Dict<number, Process>;
// }

// const taskManager = new class TimeManager<AppMsg> extends Manager<AppMsg, number, State<AppMsg>> {
//     private static gatherNewTaggers<AppMsg>(
//         subscriptions: Array<TimeSub<AppMsg>>
//     ): Dict<number, Array<Tagger<AppMsg>>> {
//         let newTaggers = Dict.empty as Dict<number, Array<Tagger<AppMsg>>>;

//         for (const sub of subscriptions) {
//             newTaggers = sub.register(newTaggers);
//         }

//         return newTaggers;
//     }

//     private static splitProcesses<AppMsg>(
//         newTaggers: Dict<number, Array<Tagger<AppMsg>>>,
//         processes: Dict<number, Process>
//     ): [ Dict<number, Process>, Array<Process> ] {
//         const acc = processes.foldl(
//             (interval, process, { existing, expired }) => {
//                 if (newTaggers.member(interval)) {
//                     return {
//                         existing: existing.insert(interval, process),
//                         expired
//                     };
//                 }

//                 return {
//                     existing,
//                     expired: [ ...expired, process ]
//                 };
//             },
//             {
//                 existing: Dict.empty as Dict<number, Process>,
//                 expired: [] as Array<Process>
//             }
//         );

//         return [ acc.existing, acc.expired ];
//     }

//     private static setEvery(interval: number, task: Task<never, Unit>): Task<never, Unit> {
//         return Task.custom(({ resolve, onCancel }) => {
//             const intervalID = setInterval(() => {
//                 resolve(task);
//             }, interval);

//             onCancel(() => clearInterval(intervalID));
//         });
//     }

//     public readonly init = Task.succeed({
//         taggers: Dict.empty,
//         processes: Dict.empty
//     } as State<AppMsg>);

//     public onEffects(
//         router: Router<AppMsg, number>,
//         _commands: Array<Cmd<AppMsg>>,
//         subscriptions: Array<TimeSub<AppMsg>>,
//         { processes }: State<AppMsg>
//     ): Task<never, State<AppMsg>> {
//         const nextTaggers = TimeManager.gatherNewTaggers(subscriptions);
//         const [ existingProcesses, expiredProcesses ] = TimeManager.splitProcesses(nextTaggers, processes);
//         const newIntervals: Array<number> = nextTaggers.keys().reduce(
//             (acc, interval) => existingProcesses.member(interval) ? acc : [ ...acc, interval ],
//             []
//         );

//         return Task.all(expiredProcesses.map(process => process.kill)).chain(() => {
//             return newIntervals.reduce(
//                 (acc, interval) => acc.chain(nextProcesses => {
//                     return
//                 }),
//                 Task.succeed(existingProcesses)
//             );
//         }).map(nextProcesses => ({
//             taggers: nextTaggers,
//             processes: nextProcesses
//         }));
//     }

//     public onSelfMsg(
//         _router: Router<AppMsg, number>,
//         _pid: number,
//         state: State<AppMsg>
//     ): Task<never, State<AppMsg>> {
//         return Task.succeed(state);
//     }
// }();

// abstract class TimeSub<AppMsg> extends Sub<AppMsg> {
//     public abstract register(taggers: Dict<number, Array<Tagger<AppMsg>>>): Dict<number, Array<Tagger<AppMsg>>>;

//     protected getManager(): Manager<AppMsg, number, State<AppMsg>> {
//         return taskManager as Manager<AppMsg, number, State<AppMsg>>;
//     }
// }

// class Every<AppMsg> extends TimeSub<AppMsg> {
//     public constructor(
//         private readonly interval: number,
//         private readonly tagger: Tagger<AppMsg>
//     ) {
//         super();
//     }

//     public map<R>(fn: (msg: AppMsg) => R): Sub<R> {
//         return new Every(
//             this.interval,
//             (posix: number): R => fn(this.tagger(posix))
//         );
//     }

//     public register(taggers: Dict<number, Array<Tagger<AppMsg>>>): Dict<number, Array<Tagger<AppMsg>>> {
//         return taggers.get(this.interval).fold(
//             () => taggers.insert(this.interval, [ this.tagger ]),
//             list => taggers.insert(this.interval, [ ...list, this.tagger ])
//         );
//     }
// }

// export const now: Task<never, number> = Task.custom(({ resolve }) => resolve(Date.now()));

// export const every = <Msg>(interval: number, tagger: Tagger<Msg>): Sub<Msg> => {
//     return new Every(interval, tagger);
// };
