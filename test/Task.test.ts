import test from 'ava';
import { SinonFakeTimers, spy, useFakeTimers } from 'sinon';

import { Program, Task, Cmd } from '../src/remade';
import { Unit, inst } from '../src/Basics';

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

test.serial('Task.perform() Task.succeed applyes almost immediately', async t => {
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
        Task.perform(() => Increment, Task.succeed(Unit))
    ];

    const subscriber = spy();

    const program = Program.client<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    });

    program.subscribe(subscriber);

    t.plan(4);

    t.is(subscriber.callCount, 0, 'Subscriber not called');
    t.deepEqual(program.getModel(), { count: 0 }, 'Initial model does not change');

    await clock.tickAsync(0);

    t.is(subscriber.callCount, 1, 'Subscriber called ones');
    t.deepEqual(program.getModel(), { count: 1 }, 'Increment applied');
});
