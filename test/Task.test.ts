import test from 'ava';
import { SinonFakeTimers, spy, useFakeTimers } from 'sinon';

import { Program, Process, Task, Cmd } from '../src/remade';
import { Unit, inst, cons } from '../src/Basics';

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

test.serial('Task.succeed applyes almost immediately', async t => {
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

test.serial('Task.all waits for all sub tasts to be done', async t => {
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
        Task.all([
            Process.sleep(100),
            Process.sleep(1000),
            Process.sleep(10000)
        ]).tap(task => Task.perform(() => Increment, task))
    ];

    const subscriber = spy();

    const program = Program.client<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => [ msg.update(model), Cmd.none ]
    });

    program.subscribe(subscriber);

    t.plan(10);

    t.is(subscriber.callCount, 0, 'Subscriber not called');
    t.deepEqual(program.getModel(), { count: 0 }, 'Initial model does not change');

    await clock.tickAsync(0);
    t.is(subscriber.callCount, 0, 'Subscriber not called after async');
    t.deepEqual(program.getModel(), { count: 0 }, 'Model does not change');

    await clock.tickAsync(100); // 100
    t.is(subscriber.callCount, 0, 'Subscriber not called after 100');
    t.deepEqual(program.getModel(), { count: 0 }, 'First sleep does not change model');

    await clock.tickAsync(900); // 1000
    t.is(subscriber.callCount, 0, 'Subscriber not called after 1000');
    t.deepEqual(program.getModel(), { count: 0 }, 'Second sleep does not change model');

    await clock.tickAsync(9000); // 10000
    t.is(subscriber.callCount, 1, 'Subscriber called ones');
    t.deepEqual(program.getModel(), { count: 1 }, 'Increment applied');
});

test.serial('Task.all cancel fast sleep does not affect to the rest', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Cancel = cons(class Cancel implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                model,
                Task.perform(() => Increment(this.process), Process.sleep(50))
            ];
        }
    });

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Task.all([
            Process.sleep(100).spawn(),
            Process.sleep(1000).spawn(),
            Process.sleep(10000).spawn()
        ]).tap(task => Task.perform(processes => Cancel(processes[ 0 ]), task))
    ];

    t.plan(6);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(50); // 50
    t.false(done, 'Cancelation of sleep 100 does not affect');

    await clock.tickAsync(950); // 1000
    t.false(done, 'End of sleep 1000 does not affect');

    await clock.tickAsync(9000); // 10000
    t.true(done, 'End of sleep 10000 ends the chain');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.all early cancel long sleep does affects to the rest', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Cancel = cons(class Cancel implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                model,
                Task.perform(() => Increment(this.process), Process.sleep(50))
            ];
        }
    });

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Task.all([
            Process.sleep(100).spawn(),
            Process.sleep(1000).spawn(),
            Process.sleep(10000).spawn()
        ]).tap(task => Task.perform(processes => Cancel(processes[ 2 ]), task))
    ];

    t.plan(5);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(50); // 50
    t.false(done, 'Cancelation of sleep 10000 does not affect');

    await clock.tickAsync(950); // 1000
    t.true(done, 'End of sleep 1000 ends the chain');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.all late cancel long sleep does affects to the rest', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Cancel = cons(class Cancel implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                model,
                Task.perform(() => Increment(this.process), Process.sleep(2000))
            ];
        }
    });

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Task.all([
            Process.sleep(100).spawn(),
            Process.sleep(1000).spawn(),
            Process.sleep(10000).spawn()
        ]).tap(task => Task.perform(processes => Cancel(processes[ 2 ]), task))
    ];

    t.plan(6);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(100); // 100
    t.false(done, 'End of sleep 100 does not affect');

    await clock.tickAsync(900); // 1000
    t.false(done, 'End of sleep 1000 does not affect');

    await clock.tickAsync(1000); // 2000
    t.true(done, 'Cancelation of sleep 10000 ends the chain');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.chain cancelation of parent Process does not affect the whole chain', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Process.sleep(1000).spawn()
            .chain(process => Process.sleep(2000).spawn().map(() => process))
            .tap(task => Task.perform(Increment, task))
    ];

    t.plan(5);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(1000); // 1000
    t.false(done, 'Killing of 1000 sleep not affect');

    await clock.tickAsync(1000); // 2000
    t.true(done, '2000 sleep done');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.chain cancelation of child Process does not affect the whole chain', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Process.sleep(2000).spawn()
            .chain(() => Process.sleep(1000).spawn())
            .tap(task => Task.perform(Increment, task))
    ];

    t.plan(5);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(1000); // 1000
    t.false(done, 'Killing of 1000 sleep not affect');

    await clock.tickAsync(1000); // 2000
    t.true(done, '2000 sleep done');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.chain cancelation of child Process after sleep does not affect the whole chain', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Process.sleep(1000)
            .chain(() => Process.sleep(2000).spawn())
            .tap(task => Task.perform(Increment, task))
    ];

    t.plan(5);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.false(done, 'Initial effect is not done after async 0');

    await clock.tickAsync(100); // 100
    t.false(done, 'Initial effect is not done after async 100');

    await clock.tickAsync(900); // 1000
    t.true(done, '1000 sleep done');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});

test.serial('Task.chain cancelation of chained child Process affects the whole chain', async t => {
    interface Msg {
        update(model: Model): [ Model, Cmd<Msg> ];
    }

    const Increment = cons(class Increment implements Msg {
        public constructor(private readonly process: Process) {}

        public update(model: Model): [ Model, Cmd<Msg> ] {
            return [
                {
                    ...model,
                    count: model.count + 1
                },
                this.process.kill()
            ];
        }
    });

    interface Model {
        count: number;
    }

    const initial: [ Model, Cmd<Msg> ] = [
        { count: 0 },
        Process.sleep(2000)
            .chain(() => Process.sleep(1000))
            .spawn()
            .tap(task => Task.perform(Increment, task))
    ];

    t.plan(3);

    let done = false;
    const promise = Program.server<Unit, Msg, Model>({
        flags: Unit,
        init: () => initial,
        update: (msg, model) => msg.update(model)
    }).then(result => {
        done = true;

        return result;
    });

    t.false(done, 'Initial effect is not done');

    await clock.tickAsync(0);
    t.true(done, 'Canceled chained process done almost immediately');
    t.deepEqual(await promise, { count: 1 }, 'Increment applied');
});
