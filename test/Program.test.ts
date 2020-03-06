import test from 'ava';
import { SinonFakeTimers, spy, useFakeTimers } from 'sinon';

import { Program, Effect } from '../src/remade';
import { inst } from '../src/Basics';

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

const sleep = <Msg>(time: number, msg: Msg): Effect<Msg> => () => new Promise(resolve => {
    setTimeout(() => resolve(msg), time);
});

test('Program: initial model and command works correctly', async t => {
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

    const initial: [ Model, Array<Effect<Msg>> ] = [
        { count: 0 },
        [ sleep(0, Increment)
        ]
    ];

    const program = Program.run<null, Model, Msg>({
        flags: null,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), [] ]
    });

    t.plan(3);

    t.is(program.getModel(), initial[ 0 ], 'Initial model does not mutate');
    t.deepEqual(program.getModel(), { count: 0 }, 'Initial model keeps the same value');

    await clock.tickAsync(0);

    t.deepEqual(program.getModel(), { count: 1 }, 'Increment applied after timeout');
});

test('Program: flags are passed correctly', t => {
    interface Msg {
        update(model: Model): Model;
    }

    interface Model {
        count: number;
    }

    const init = (count: number): Model => ({ count });

    const program = Program.run<{ initial: number }, Model, Msg>({
        flags: { initial: 10 },
        init: flags => [ init(flags.initial), [] ],
        update: (msg, model) => [ msg.update(model), [] ]
    });

    t.deepEqual(program.getModel(), { count: 10 });
});

test('Program: subscribers works correctly', t => {
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

    const program = Program.run<null, Model, Msg>({
        flags: null,
        init: () => [ initial, [] ],
        update: (msg, model) => [ msg.update(model), [] ]
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

test('Program: Effects call Msg', async t => {
    interface Msg {
        update(model: Model): [ Model, Array<Effect<Msg>> ];
    }

    const Decrement = inst(class Decrement$ implements Msg {
        public update(model: Model): [ Model, Array<Effect<Msg>> ] {
            return [
                {
                    ...model,
                    count: model.count - 1
                },
                []
            ];
        }
    });

    const Increment = inst(class Increment$ implements Msg {
        public update(model: Model): [ Model, Array<Effect<Msg>> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                [ sleep(30, Increment)
                ]
            ];
        }
    });

    interface Flags {
        initial: number;
    }

    interface Model {
        count: number;
    }

    const init = (flags: Flags): [ Model, Array<Effect<Msg>> ] => [
        { count: flags.initial },
        [ sleep(100, Decrement)
        ]
    ];

    const program = Program.run<Flags, Model, Msg>({
        flags: { initial: 5 },
        init,
        update: (msg, model) => msg.update(model)
    });

    t.plan(8);

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
