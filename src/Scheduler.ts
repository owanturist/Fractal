/**
 * T A S K S
 */

export type Task<E, T>
    = Succeed<T>
    | Fail<E>
    | Binding<E, T>
    | Chain<E, any, T>
    | OnError<any, T, E>
    | Receive<unknown, E, T>
    ;

interface Succeed<T> {
    readonly $: '_TASK__SUCCEED_';
    readonly __value: T;
}

export const succeed = <T>(value: T): Task<never, T> => ({
    $: '_TASK__SUCCEED_',
    __value: value
});


interface Fail<E> {
    readonly $: '_TASK__FAIL_';
    readonly __error: E;
}

export const fail = <E>(error: E): Task<E, never> => ({
    $: '_TASK__FAIL_',
    __error: error
});


interface Binding<E, T> {
    readonly $: '_TASK__BINDING';
    __kill: void | (() => void);
    __callback(bind: (task: Task<E, T>) => void): void | (() => void);
}

export const binding = <E, T>(callback: (done: (task: Task<E, T>) => void) => void | (() => void)): Task<E, T> => ({
    $: '_TASK__BINDING',
    __kill: undefined,
    __callback: callback
});


interface Chain<E, T, R> {
    readonly $: '_TASK__CHAIN_';
    readonly __task: Task<E, T>;
    __callback(value: T): Task<E, R>;
}

export const chain = <E, T, R>(
    callback: (value: T) => Task<E, R>,
    task: Task<E, T>
): Task<E, R> => ({
    $: '_TASK__CHAIN_',
    __task: task,
    __callback: callback
});


interface OnError<E, T, S> {
    readonly $: '_TASK__ON_ERROR_';
    readonly __task: Task<E, T>;
    __callback(error: E): Task<S, T>;
}

export const onError = <E, T, S>(
    callback: (error: E) => Task<S, T>,
    task: Task<E, T>
): Task<S, T> => ({
    $: '_TASK__ON_ERROR_',
    __task: task,
    __callback: callback
});


interface Receive<M, E, T> {
    readonly $: '_TASK__RECEIVE_';
    __callback(msg: M): Task<E, T>;
}

export const receive = <M, E, T>(callback: (msg: M) => Task<E, T>): Task<E, T> => ({
    $: '_TASK__RECEIVE_',
    __callback: callback
});

/**
 * S T A C K
 */

type Stack<E, T>
    = Head
    | Ok<E, any, T>
    | Err<any, T, E>
    ;

interface Head {
    readonly $: '_STACK_HEAD_';
}

const head: Stack<never, never> = {
    $: '_STACK_HEAD_'
};

interface Ok<E, T, R> {
    readonly $: '_STACK_OK_';
    readonly __next: Stack<E, T>;
    __callback(value: T): Task<E, R>;
}

const ok = <E, T, R>(
    callback: (value: T) => Task<E, R>,
    next: Stack<E, T>
): Stack<E, R> => ({
    $: '_STACK_OK_',
    __next: next,
    __callback: callback
});


interface Err<E, T, S> {
    readonly $: '_STACK_ERR_';
    readonly __next: Stack<E, T>;
    __callback(error: E): Task<S, T>;
}

const err = <E, T, S>(
    callback: (error: E) => Task<S, T>,
    next: Stack<E, T>
): Stack<S, T> => ({
    $: '_STACK_ERR_',
    __next: next,
    __callback: callback
});

/**
 * P R O C E S S
 */


export interface Process<E = unknown, T = unknown, M = unknown> {
    __root?: Task<E, T>;
    __stack: Stack<E, T>;
    readonly __mailbox: Array<M>;
}

const process = <E, T, M>(root: Task<E, T>): Process<E, T, M> => ({
    __root: root,
    __stack: head,
    __mailbox: []
});

export const rawSpawn = <E, T, M>(task: Task<E, T>): Process<E, T, M> => {
    const proc = process<E, T, M>(task);

    _enqueue(proc);

    return proc;
};

export const spawn = <E, T>(task: Task<E, T>): Task<never, Process<E, T>> => binding(
    (done: (task: Task<never, Process<E, T>>) => void): void => {
        done(succeed(rawSpawn(task)));
    }
);

export const rawSend = <E, T, M>(proc: Process<E, T, M>, msg: M): void => {
    proc.__mailbox.push(msg);
    _enqueue(proc);
};

export const send = <E, T, M>(proc: Process<E, T, M>, msg: M): Task<never, void> => binding(
    (done: (task: Task<never, void>) => void): void => {
        rawSend(proc, msg);
        done(succeed(undefined));
    }
);

export const kill = <E, T>(proc: Process<E, T>): Task<never, void> => binding(
    (done: (task: Task<never, void>) => void): void => {
        const task = proc.__root;

        if (task && task.$ === '_TASK__BINDING' && task.__kill) {
            task.__kill();
        }

        proc.__root = undefined;

        done(succeed(undefined));
    }
);

/**
 * S T E P
 */

const _queue: Array<Process> = [];
let _working = false;

function _enqueue<E, T, M>(proc: Process<E, T, M>): void {
    _queue.push(proc);

    if (_working) {
        return;
    }

    _working = true;

    let next = _queue.shift();

    while (next) {
        _step(next);

        next = _queue.shift();
    }

    _working = false;
}

function _step<E, T, M>(proc: Process<E, T, M>): void {
    while (proc.__root) {
        switch (proc.__root.$) {
            case '_TASK__CHAIN_': {
                proc.__stack = ok(proc.__root.__callback, proc.__stack);
                proc.__root = proc.__root.__task;

                break;
            }

            case '_TASK__ON_ERROR_': {
                proc.__stack = err(proc.__root.__callback, proc.__stack);
                proc.__root = proc.__root.__task;

                break;
            }

            case '_TASK__SUCCEED_': {
                while (proc.__stack.$ === '_STACK_ERR_') {
                    proc.__stack = proc.__stack.__next;
                }

                if (proc.__stack.$ === '_STACK_HEAD_') {
                    return;
                }

                proc.__root = proc.__stack.__callback(proc.__root.__value);
                proc.__stack = proc.__stack.__next;

                break;
            }

            case '_TASK__FAIL_': {
                while (proc.__stack.$ === '_STACK_OK_') {
                    proc.__stack = proc.__stack.__next;
                }

                if (proc.__stack.$ === '_STACK_HEAD_') {
                    return;
                }

                proc.__root = proc.__stack.__callback(proc.__root.__error);
                proc.__stack = proc.__stack.__next;

                break;
            }

            case '_TASK__RECEIVE_': {
                const msg = proc.__mailbox.shift();

                if (msg === undefined) {
                    return;
                }

                proc.__root = proc.__root.__callback(msg);

                break;
            }

            case '_TASK__BINDING': {
                proc.__root.__kill = proc.__root.__callback((newRoot: Task<E, T>): void => {
                    proc.__root = newRoot;

                    _enqueue(proc);
                });

                return;
            }
        }
    }
}
