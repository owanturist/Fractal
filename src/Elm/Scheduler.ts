// T A S K S

const __1_SUCCEED = 'SUCCEED';
const __1_FAIL = 'FAIL';
const __1_BINDING = 'BINDING';
const __1_AND_THEN = 'AND_THEN';
const __1_ON_ERROR = 'ON_ERROR';
const __1_RECEIVE = 'RECEIVE';


export function succeed(value) {
    return {
        $: __1_SUCCEED,
        __value: value
    };
}

export function fail(error) {
    return {
        $: __1_FAIL,
        __value: error
    };
}

export function binding(callback) {
    return {
        $: __1_BINDING,
        __callback: callback,
        __kill: null
    };
}

export function andThen(callback, task) {
    return {
        $: __1_AND_THEN,
        __callback: callback,
        __task: task
    };
}

export function onError(callback, task) {
    return {
        $: __1_ON_ERROR,
        __callback: callback,
        __task: task
    };
}

export function receive(callback) {
    return {
        $: __1_RECEIVE,
        __callback: callback
    };
}


// P R O C E S S E S

const __2_PROCESS = 'PROCESS';

let GUID = 0;

export function rawSpawn(task) {
    const proc = {
        $: __2_PROCESS,
        __id: GUID++,
        __root: task,
        __stack: null,
        __mailbox: []
    };

    _enqueue(proc);

    return proc;
}

export function spawn(task) {
    return binding(callback => {
        callback(succeed(rawSpawn(task)));
    });
}

export function rawSend(proc, msg) {
    proc.__mailbox.push(msg);
    _enqueue(proc);
}

export function send(proc, msg) {
    return binding(callback => {
        rawSend(proc, msg);
        callback(succeed(null));
    });
}

export function kill(proc) {
    return binding(callback => {
        const task = proc.__root;

        if (task.$ === __1_BINDING && task.__kill) {
            task.__kill();
        }

        proc.__root = null;

        callback(succeed(null));
    });
}


// S T E P

let _working = false;
const _queue = [];

function _enqueue(proc) {
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


function _step(proc) {
    while (proc.__root) {
        const rootTag = proc.__root.$;

        if (rootTag === __1_SUCCEED || rootTag === __1_FAIL) {
            while (proc.__stack && proc.__stack.$ !== rootTag) {
                proc.__stack = proc.__stack.__rest;
            }
            if (!proc.__stack) {
                return;
            }
            proc.__root = proc.__stack.__callback(proc.__root.__value);
            proc.__stack = proc.__stack.__rest;
        } else if (rootTag === __1_BINDING) {
            proc.__root.__kill = proc.__root.__callback(newRoot => {
                proc.__root = newRoot;
                _enqueue(proc);
            });

            return;
        } else if (rootTag === __1_RECEIVE) {
            if (proc.__mailbox.length === 0) {
                return;
            }
            proc.__root = proc.__root.__callback(proc.__mailbox.shift());
        } else {
            proc.__stack = {
                $: rootTag === __1_AND_THEN ? __1_SUCCEED : __1_FAIL,
                __callback: proc.__root.__callback,
                __rest: proc.__stack
            };
            proc.__root = proc.__root.__task;
        }
    }
}

/*

let SchedulerWorking = false;
const SchedulerQueue = [];


function _Scheduler_enqueue(proc) {
    SchedulerQueue.push(proc);

    if (SchedulerWorking) {
        return;
    }

    SchedulerWorking = true;

    let next = SchedulerQueue.shift();

    while (next) {
        _Scheduler_step(proc);

        next = SchedulerQueue.shift();
    }

    SchedulerWorking = false;
}


function _Scheduler_step(proc) {
    while (proc.__root) {
        const rootTag = proc.__root.$;

        if (rootTag === __1_SUCCEED || rootTag === __1_FAIL) {
            while (proc.__stack && proc.__stack.$ !== rootTag) {
                proc.__stack = proc.__stack.__rest;
            }
            if (!proc.__stack) {
                return;
            }
            proc.__root = proc.__stack.__callback(proc.__root.__value);
            proc.__stack = proc.__stack.__rest;
        } else if (rootTag === __1_BINDING) {
            proc.__root.__kill = proc.__root.__callback(newRoot => {
                proc.__root = newRoot;
                _Scheduler_enqueue(proc);
            });

            return;
        } else if (rootTag === __1_RECEIVE) {
            if (proc.__mailbox.length === 0) {
                return;
            }
            proc.__root = proc.__root.__callback(proc.__mailbox.shift());
        } else {
            proc.__stack = {
                $: rootTag === __1_AND_THEN ? __1_SUCCEED : __1_FAIL,
                __callback: proc.__root.__callback,
                __rest: proc.__stack
            };
            proc.__root = proc.__root.__task;
        }
    }
}

*/
