// import { Router, Manager, Task, Cmd } from './remade';
// import { Unit } from './Basics';
// import Dict from './Dict';

// interface State {
//     readonly timeouts: Dict<string, number>;
// }

// const initial: State = {
//     timeouts: Dict.empty as Dict<string, number>
// }

// const manager = new class TimeManager extends Manager<State> {
//     public init = Task.succeed(initial);

//     public onEffects<AppMsg>(
//         router: Router<AppMsg>,
//         commands: Array<After<AppMsg>>,
//         state: State
//     ): [ State, Task<never, Unit> ] {
//         return [
//             state,
//             Task.succeed(Unit)
//         ];
//     }
// }();

// class After<Msg> extends Cmd<Msg> {
//     public constructor(
//         private readonly milliseconds: number,
//         private readonly msg: Msg
//     ) {
//         super();
//     }

//     public map<R>(fn: (msg: Msg) => R): Cmd<R> {
//         return new After(this.milliseconds, fn(this.msg));
//     }

//     public onEffects<AppMsg>(
//         createTask: <T>(cb: (done: (value: T) => void) => void) => Task<never, T>,
//         router: Router<AppMsg>,
//         state: State
//     ): [ State, Task<never, Unit> ] {
//         return [
//             state,
//             createTask(done => {
//                 done(Unit);
//             })
//         ];
//     }

//     protected getManager(): Manager<State> {
//         return manager;
//     }
// }
