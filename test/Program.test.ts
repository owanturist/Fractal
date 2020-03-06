import test from 'ava';
import { SinonFakeTimers, spy, useFakeTimers } from 'sinon';

import { Program, Cmd } from '../src/remade';
import { inst, cons } from '../src/Basics';

const clock = useFakeTimers({
    toFake: [ 'setTimeout' ]
}) as SinonFakeTimers & {
    tickAsync(time: number): Promise<void>;
    nextAsync(): Promise<void>;
    runAllAsync(): Promise<void>;
};

test.beforeEach(() => {
    clock.reset();
});

test.after(() => {
    clock.uninstall();
});

const sleep: <Msg>(timeout: number, msg: Msg) => Cmd<Msg> = cons(class Sleep<Msg> extends Cmd<Msg> {
    public constructor(
        private readonly timeout: number,
        private readonly msg: Msg
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Sleep(this.timeout, fn(this.msg));
    }

    public effect(done: (msg: Msg) => void): void {
        setTimeout(() => done(this.msg), this.timeout);
    }
});

test.serial('Program.client() initial model and command works correctly', async t => {
    interface Msg {
        update(model: Model): Model;
    }

    const Increment = inst(class Increment implements Msg {
        public update(model: Model): Model {
            return {
                ...model,
                count: model.count + 1
            };
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        sleep(0, Increment)
    ];

    const program = Program.client<null, Msg, Model>({
        flags: null,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    });

    t.deepEqual(program.getModel(), { count: 0 }, 'Initial model keeps the same value');

    await clock.tickAsync(0);

    t.deepEqual(program.getModel(), { count: 1 }, 'Increment applied after timeout');
});

test('Program.client() flags are passed correctly', t => {
    interface Msg {
        update(model: Model): Model;
    }

    interface Model {
        count: number;
    }

    const init = (count: number): Model => ({ count });

    const program = Program.client<{ initial: number }, Msg, Model>({
        flags: { initial: 10 },
        init: flags => [ init(flags.initial), Cmd.none ],
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    });

    t.deepEqual(program.getModel(), { count: 10 });
});

test('Program.client() subscribers works correctly', t => {
    interface Msg {
        update(model: Model): Model;
    }

    const Increment = inst(class Increment implements Msg {
        public update(model: Model): Model {
            return {
                ...model,
                count: model.count + 1
            };
        }
    });

    interface Model {
        count: number;
    }

    const initial: Model = { count: 0 };

    const program = Program.client<null, Msg, Model>({
        flags: null,
        init: () => [ initial, Cmd.none ],
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    });

    const subscriber1 = spy();
    const subscriber2 = spy();

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 1 }, 'First Increment');
    t.is(subscriber1.callCount, 0, 'Not subscribed 1');
    t.is(subscriber2.callCount, 0, 'Not subscribed 2');

    const unsubscriber1 = program.subscribe(subscriber1);

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 2 }, 'Second Increment');
    t.is(subscriber1.callCount, 1, 'Subscribed 1');
    t.is(subscriber2.callCount, 0, 'Not subscribed 2');
    t.true(subscriber1.calledWith(), 'No argument passes to subscribers');

    const unsubscriber2 = program.subscribe(subscriber2);

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 3 }, 'Third Increment');
    t.is(subscriber1.callCount, 2, 'Subscribed 1');
    t.is(subscriber2.callCount, 1, 'Subscribed 2');

    unsubscriber1();

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 4 }, '4th Increment');
    t.is(subscriber1.callCount, 2, 'Unsubscribed 1');
    t.is(subscriber2.callCount, 2, 'Subscribed 2');

    unsubscriber2();

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 5 }, '5th Increment');
    t.is(subscriber1.callCount, 2, 'Unsubscribed 1');
    t.is(subscriber2.callCount, 2, 'Unsubscribed 2');

    unsubscriber1();
    unsubscriber2();

    program.dispatch(Increment);
    t.deepEqual(program.getModel(), { count: 6 }, '6th Increment');
    t.is(subscriber1.callCount, 2, 'Unsubscribed again 1');
    t.is(subscriber2.callCount, 2, 'Unsubscribed again 2');
});

test.serial('Program.client() effects call Msg', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Decrement = inst(class Decrement$ implements Msg {
        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count - 1
                },
                Cmd.none
            ];
        }
    });

    const Increment = inst(class Increment$ implements Msg {
        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                sleep(30, Increment)
            ];
        }
    });

    interface Flags {
        initial: number;
    }

    interface Model {
        count: number;
    }

    const init = (flags: Flags): [ Model, Cmd<Msg> ] => [
        { count: flags.initial },
        sleep(100, Decrement)
    ];

    const program = Program.client<Flags, Msg, Model>({
        flags: { initial: 5 },
        init,
        update: (msg, model) => msg.update(model)
    });

    t.deepEqual(program.getModel(), { count: 5 }, 'Initial Model');

    program.dispatch(Increment);

    t.deepEqual(program.getModel(), { count: 6 }, 'First Increment by dispatch');

    await clock.tickAsync(20);
    t.deepEqual(program.getModel(), { count: 6 }, 'Nothing changed');

    await clock.tickAsync(10); // 30
    t.deepEqual(program.getModel(), { count: 7 }, 'First Increment by sleep from update');

    await clock.tickAsync(30); // 60
    t.deepEqual(program.getModel(), { count: 8 }, 'Second Increment by sleep from update');

    await clock.tickAsync(30); // 90
    t.deepEqual(program.getModel(), { count: 9 }, 'Third Increment by sleep from update');

    await clock.tickAsync(10); // 100
    t.deepEqual(program.getModel(), { count: 8 }, 'Decrement by sleep from init');

    await clock.tickAsync(20); // 120
    t.deepEqual(program.getModel(), { count: 9 }, 'Fourth Increment by sleep from update');
});

test.serial('Program.client() TEA in action', async t => {
    // C O U N T E R

    interface CounterMsg {
        update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ];
    }

    const Decrement = inst(class Decrement implements CounterMsg {
        public update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ] {
            return [
                {
                    ...model,
                    count: model.count - 1
                },
                Cmd.none
            ];
        }
    });

    const Increment = inst(class Increment implements CounterMsg {
        public update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                Cmd.none
            ];
        }
    });

    const DelayedIncrement = inst(class DelayedIncrement implements CounterMsg {
        public update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ] {
            return [
                model,
                sleep(30, Increment)
            ];
        }
    });

    interface CounterModel {
        count: number;
    }

    const initCounter = (delay: number): [ CounterModel, Cmd<CounterMsg> ] => [
        { count: 0 },
        sleep(delay, Decrement)
    ];

    // A P P

    interface AppMsg {
        update(model: AppModel): [ AppModel, Cmd<AppMsg> ];
    }

    const LeftCounterMsg = cons<[ CounterMsg ], AppMsg>(class LeftCounterMsg$ implements AppMsg {
        public constructor(private readonly msg: CounterMsg) {}

        public update(model: AppModel): [ AppModel, Cmd<AppMsg> ] {
            const [ nextLeftCounter, cmdOfLeftCounter ] = this.msg.update(model.leftCounter);

            return [
                {
                    ...model,
                    leftCounter: nextLeftCounter
                },
                cmdOfLeftCounter.map(LeftCounterMsg)
            ];
        }
    });

    const RightCounterMsg = cons<[ CounterMsg ], AppMsg>(class RightCounterMsg$ implements AppMsg {
        public constructor(private readonly msg: CounterMsg) {}

        public update(model: AppModel): [ AppModel, Cmd<AppMsg> ] {
            const [ nextRightCounter, cmdOfRightCounter ] = this.msg.update(model.rightCounter);

            return [
                {
                    ...model,
                    rightCounter: nextRightCounter
                },
                cmdOfRightCounter.map(RightCounterMsg)
            ];
        }
    });

    interface AppModel {
        leftCounter: CounterModel;
        rightCounter: CounterModel;
    }

    const initApp = (): [ AppModel, Cmd<AppMsg> ] => {
        const [ leftCounter, cmdOfLeftCounter ] = initCounter(100);
        const [ rightCounter, cmdOfRightCounter ] = initCounter(150);

        return [
            { leftCounter, rightCounter },
            Cmd.batch([
                cmdOfLeftCounter.map(LeftCounterMsg),
                cmdOfRightCounter.map(RightCounterMsg)
            ])
        ];
    };

    const program = Program.client<null, AppMsg, AppModel>({
        flags: null,
        init: initApp,
        update: (msg, model) => msg.update(model)
    });

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 0 },
        rightCounter: { count: 0 }
    }, 'Initials are correct');

    program.dispatch(LeftCounterMsg(DelayedIncrement));

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 0 },
        rightCounter: { count: 0 }
    }, 'Delayed Increment does not affect immediately');

    program.dispatch(RightCounterMsg(Increment));

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 0 },
        rightCounter: { count: 1 }
    }, 'Increment affects immediately');

    await clock.tickAsync(30);

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 1 },
        rightCounter: { count: 1 }
    }, 'Delayed Increment affects after delay');

    await clock.tickAsync(70); // 100

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 0 },
        rightCounter: { count: 1 }
    }, 'Sleep 100 Decrement affects left counter');

    await clock.tickAsync(50); // 150

    t.deepEqual(program.getModel(), {
        leftCounter: { count: 0 },
        rightCounter: { count: 0 }
    }, 'Sleep 100 Decrement affects right counter');
});

test('Program.server() done immidiatelly when non of async', async t => {
    t.plan(1);

    const model = await Program.server<number, never, number>({
        flags: 10,
        init: flags => [ flags, Cmd.none ],
        update: (_msg, model) => [ model, Cmd.none ]
    });

    t.is(model, 10);
});

test.serial('Program.server() waits till initial effect done', async t => {
    interface Msg {
        update(model: Model): Model;
    }

    const Increment = inst(class Increment implements Msg {
        public update(model: Model): Model {
            return {
                ...model,
                count: model.count + 1
            };
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        sleep(100, Increment)
    ];

    t.plan(3);

    let done = false;
    const promise = Program.server<null, Msg, Model>({
        flags: null,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    }).then(result => {
        done = true;

        return result;
    });

    await clock.tickAsync(90);
    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(10); // 100
    t.true(done, 'Initial effect is done');
    t.deepEqual(await promise, { count: 1 });
});

test.serial('Program.server() waits till all initial effects done', async t => {
    interface Msg {
        update(model: Model): Model;
    }

    const Increment = inst(class Increment implements Msg {
        public update(model: Model): Model {
            return {
                ...model,
                count: model.count + 1
            };
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Cmd.batch([
            sleep(100, Increment),
            sleep(1000, Increment)
        ])
    ];

    t.plan(4);

    let done = false;
    const promise = Program.server<null, Msg, Model>({
        flags: null,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    }).then(result => {
        done = true;

        return result;
    });

    await clock.tickAsync(90);
    t.false(done, 'Initial effects are not done');

    await clock.tickAsync(10); // 100
    t.false(done, 'Not all initial effects are not done');

    await clock.tickAsync(900); // 1000
    t.true(done, 'Initial effects are done');
    t.deepEqual(await promise, { count: 2 });
});

test.serial('Program.server() waits till chain of effects done', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = inst(class Increment implements Msg {
        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                Cmd.none
            ];
        }
    });

    const DelayedIncrement = inst(class DelayedIncrement implements Msg {
        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                model,
                sleep(1000, Increment)
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        sleep(100, DelayedIncrement)
    ];

    t.plan(5);

    let done = false;
    const promise = Program.server<null, Msg, Model>({
        flags: null,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    await clock.tickAsync(90);
    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(10); // 100
    t.false(done, 'Effects chain is not done');

    await clock.tickAsync(900); // 1000
    t.false(done, 'Chained effect is not done');

    await clock.tickAsync(100); // 1100
    t.true(done, 'Chained effect is done');
    t.deepEqual(await promise, { count: 1 });
});

test.serial('Program.server() waits till TEA effects are done', async t => {
    // C O U N T E R

    interface CounterMsg {
        update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ];
    }

    const Increment = inst(class Increment implements CounterMsg {
        public update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                Cmd.none
            ];
        }
    });

    const DelayedIncrement = inst(class DelayedIncrement implements CounterMsg {
        public update(model: CounterModel): [ CounterModel, Cmd<CounterMsg> ] {
            return [
                model,
                sleep(1000, Increment)
            ];
        }
    });

    interface CounterModel {
        count: number;
    }

    const initCounter = (delay: number): [ CounterModel, Cmd<CounterMsg> ] => [
        { count: 0 },
        sleep(delay, DelayedIncrement)
    ];

    // A P P

    interface AppMsg {
        update(model: AppModel): [ AppModel, Cmd<AppMsg> ];
    }

    const LeftCounterMsg = cons<[ CounterMsg ], AppMsg>(class LeftCounterMsg$ implements AppMsg {
        public constructor(private readonly msg: CounterMsg) {}

        public update(model: AppModel): [ AppModel, Cmd<AppMsg> ] {
            const [ nextLeftCounter, cmdOfLeftCounter ] = this.msg.update(model.leftCounter);

            return [
                {
                    ...model,
                    leftCounter: nextLeftCounter
                },
                cmdOfLeftCounter.map(LeftCounterMsg)
            ];
        }
    });

    const RightCounterMsg = cons<[ CounterMsg ], AppMsg>(class RightCounterMsg$ implements AppMsg {
        public constructor(private readonly msg: CounterMsg) {}

        public update(model: AppModel): [ AppModel, Cmd<AppMsg> ] {
            const [ nextRightCounter, cmdOfRightCounter ] = this.msg.update(model.rightCounter);

            return [
                {
                    ...model,
                    rightCounter: nextRightCounter
                },
                cmdOfRightCounter.map(RightCounterMsg)
            ];
        }
    });

    interface AppModel {
        leftCounter: CounterModel;
        rightCounter: CounterModel;
    }

    const initApp = (): [ AppModel, Cmd<AppMsg> ] => {
        const [ leftCounter, cmdOfLeftCounter ] = initCounter(100);
        const [ rightCounter, cmdOfRightCounter ] = initCounter(150);

        return [
            { leftCounter, rightCounter },
            Cmd.batch([
                cmdOfLeftCounter.map(LeftCounterMsg),
                cmdOfRightCounter.map(RightCounterMsg)
            ])
        ];
    };

    t.plan(5);

    let done = false;
    const promise = Program.server<null, AppMsg, AppModel>({
        flags: null,
        init: initApp,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    await clock.tickAsync(50);
    t.false(done, 'Components do not complete initial effects');

    await clock.tickAsync(50); // 100
    t.false(done, 'Not all components complete initial effects');

    await clock.tickAsync(1000); // 1100
    t.false(done, 'Not all components complete chained effects');

    await clock.tickAsync(50); // 1150
    t.true(done, 'All components complete effects');
    t.deepEqual(await promise, {
        leftCounter: { count: 1 },
        rightCounter: { count: 1 }
    });
});

test.serial('Program.server() never completing init', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = inst(class Increment$ implements Msg {
        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                sleep(1000, Increment)
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        sleep(100, Increment)
    ];

    t.plan(4);

    let done = false;
    Program.server<null, Msg, Model>({
        flags: null,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(() => {
        done = true;
    });

    await clock.tickAsync(90);
    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(10); // 100
    t.false(done, 'Effects chain is not done');

    await clock.tickAsync(1000); // 1100
    t.false(done, 'Sleep end produces new sleep');

    await clock.tickAsync(10000);
    t.false(done, 'Never reaches the end of sleep chain');
});
