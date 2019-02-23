/**
 * T A S K S
 */

export type Task<E, T>
    = Succeed<T>
    | Fail<E>
    | Binding<E, T>
    | AndThen<E, T>
    | OnError<E, T>
    | Receive<E, T>
    ;

interface Succeed<T> {
    $: '_TASK__SUCCEED_';
    __value: T;
}

export const succeed = <T>(value: T): Task<never, T> => ({
    $: '_TASK__SUCCEED_',
    __value: value
});


interface Fail<E> {
    $: '_TASK__FAIL_';
    __error: E;
}

export const fail = <E>(error: E): Task<E, never> => ({
    $: '_TASK__FAIL_',
    __error: error
});


interface Binding<E, T> {
    $: '_TASK__BINDING';
    __kill: void | (() => void);
    __callback(bind: (task: Task<E, T>) => void): void | (() => void);
}

export const binding = <E, T>(callback: (bind: (task: Task<E, T>) => void) => void | (() => void)): Task<E, T> => ({
    $: '_TASK__BINDING',
    __kill: undefined,
    __callback: callback
});


interface AndThen<E, T> {
    $: '_TASK__AND_THEN_';
    __task: Task<E, T>;
    __callback<R>(value: T): Task<E, R>;
}

export const andThen = <E, T>(
    callback: <R>(value: T) => Task<E, R>,
    task: Task<E, T>
): Task<E, T> => ({
    $: '_TASK__AND_THEN_',
    __task: task,
    __callback: callback
});


interface OnError<E, T> {
    $: '_TASK__ON_ERROR_';
    __task: Task<E, T>;
    __callback<S>(error: E): Task<S, T>;
}

export const onError = <E, T>(
    callback: <S>(error: E) => Task<S, T>,
    task: Task<E, T>
): Task<E, T> => ({
    $: '_TASK__ON_ERROR_',
    __task: task,
    __callback: callback
});


interface Receive<E, T> {
    $: '_TASK__RECEIVE_';
    __callback<M>(msg: M): Task<E, T>;
}

export const receive = <E, T>(callback: <M>(msg: M) => Task<E, T>): Task<E, T> => ({
    $: '_TASK__RECEIVE_',
    __callback: callback
});

/**
 * S T A C K
 */

type Stack<E, T>
    = Head
    | Ok<E, T>
    | Err<E, T>
    ;

interface Head {
    $: '_STACK_HEAD_';
}

const head: Stack<never, never> = {
    $: '_STACK_HEAD_'
};

interface Ok<E, T> {
    $: '_STACK_OK_';
    __next: Stack<E, T>;
    __callback<R>(value: T): Task<E, R>;
}

const ok = <E, T>(
    callback: <R>(value: T) => Task<E, R>,
    next: Stack<E, T>
): Stack<E, T> => ({
    $: '_STACK_OK_',
    __next: next,
    __callback: callback
});


interface Err<E, T> {
    $: '_STACK_ERR_';
    __next: Stack<E, T>;
    __callback<S>(error: E): Task<S, T>;
}

const err = <E, T>(
    callback: <S>(error: E) => Task<S, T>,
    next: Stack<E, T>
): Stack<E, T> => ({
    $: '_STACK_ERR_',
    __next: next,
    __callback: callback
});

/**
 * P R O C E S S
 */

let GUID = 0;

export interface Process<E = unknown, T = unknown, M = unknown> {
    __id: number;
    __root?: Task<E, T>;
    __stack: Stack<E, T>;
    __mailbox: Array<M>;
}

const process = <E, T>(root: Task<E, T>): Process<E, T> => ({
    __id: GUID++,
    __root: root,
    __stack: head,
    __mailbox: []
});

export const rawSpawn = <E, T>(task: Task<E, T>): Process<E, T> => {
    const proc = process(task);

    _enqueue(proc);

    return proc;
};

export const spawn = <E, T>(task: Task<E, T>): Task<never, Process<E, T>> => binding(
    (callback: (task: Task<never, Process<E, T>>) => void): void => {
        callback(succeed(rawSpawn(task)));
    }
);

export const rawSend = <E, T, M>(proc: Process<E, T, M>, msg: M): void => {
    proc.__mailbox.push(msg);
    _enqueue(proc);
};

export const send = <E, T, M>(proc: Process<E, T, M>, msg: M): Task<never, void> => binding(
    (callback: (task: Task<never, void>) => void): void => {
        rawSend(proc, msg);
        callback(succeed(undefined));
    }
);

export const kill = <E, T>(proc: Process<E, T>): Task<never, void> => binding(
    (callback: (task: Task<never, void>) => void): void => {
        const task = proc.__root;

        if (task && task.$ === '_TASK__BINDING' && task.__kill) {
            task.__kill();
        }

        proc.__root = undefined;

        callback(succeed(undefined));
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

            case '_TASK__BINDING': {
                proc.__root.__kill = proc.__root.__callback((newRoot: Task<E, T>): void => {
                    proc.__root = newRoot;

                    _enqueue(proc);
                });

                return;
            }

            case '_TASK__RECEIVE_': {
                const msg = proc.__mailbox.shift();

                if (msg === undefined) {
                    return;
                }

                proc.__root = proc.__root.__callback(msg);

                break;
            }

            case '_TASK__AND_THEN_': {
                proc.__stack = ok(proc.__root.__callback, proc.__stack);
                proc.__root = proc.__root.__task;

                break;
            }

            case '_TASK__ON_ERROR_': {
                proc.__stack = err(proc.__root.__callback, proc.__stack);
                proc.__root = proc.__root.__task;
            }
        }
    }
}
