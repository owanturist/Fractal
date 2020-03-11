// import { Router, Manager, Process, Task, Cmd } from './remade';
// import { Maybe } from './Maybe';
// import Dict from './Dict';

// type State = Dict<string, Process>;

// const initial = Dict.empty as State;

// const manager = new class TimeManager extends Manager<State> {
//     public init = Task.succeed(initial);

//     public onEffects<AppMsg>(
//         router: Router<AppMsg>,
//         commands: Array<After<AppMsg>>,
//         state: State
//     ): Task<never, State> {
//         return commands.reduce(
//             (acc, task) => acc.chain(nextState => task.onEffects(router, nextState)),
//             Task.succeed(state)
//         );
//     }
// }();

// class After<Msg> extends Cmd<Msg> {
//     public constructor(
//         private readonly name: Maybe<string>,
//         private readonly timeout: number,
//         private readonly msg: Msg
//     ) {
//         super();
//     }

//     public map<R>(fn: (msg: Msg) => R): Cmd<R> {
//         return new After(this.name, this.timeout, fn(this.msg));
//     }

//     public onEffects(
//         router: Router<Msg>,
//         state: State
//     ): Task<never, State> {
//         return router.sendToApp(done => {
//             const timeoutID = setTimeout(() => done(this.msg), this.timeout);

//             return () => clearTimeout(timeoutID);
//         })
//             .spawn()
//             .map(process => this.name.map(name => state.insert(name, process)).getOrElse(state));
//     }

//     protected getManager(): Manager<State> {
//         return manager;
//     }
// }

// // export function after() {}
