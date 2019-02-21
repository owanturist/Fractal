// T A S K S

const __1_SUCCEED = 'SUCCEED';
const __1_FAIL = 'FAIL';
const __1_BINDING = 'BINDING';
const __1_AND_THEN = 'AND_THEN';
const __1_ON_ERROR = 'ON_ERROR';
const __1_RECEIVE = 'RECEIVE';


function _Scheduler_succeed(value) {
    return {
        $: __1_SUCCEED,
        __value: value
    };
}

function _Scheduler_fail(error) {
    return {
        $: __1_FAIL,
        __value: error
    };
}

function _Scheduler_binding(callback) {
    return {
        $: __1_BINDING,
        __callback: callback,
        __kill: null
    };
}

function _Scheduler_andThen(callback, task) {
    return {
        $: __1_AND_THEN,
        __callback: callback,
        __task: task
    };
}

function _Scheduler_onError(callback, task) {
    return {
        $: __1_ON_ERROR,
        __callback: callback,
        __task: task
    };
}

function _Scheduler_receive(callback) {
    return {
        $: __1_RECEIVE,
        __callback: callback
    };
}


// P R O C E S S E S

const __2_PROCESS = 'PROCESS';

let GUID = 0;

function _Scheduler_rawSpawn(task) {
    const proc = {
        $: __2_PROCESS,
        __id: GUID++,
        __root: task,
        __stack: null,
        __mailbox: []
    };

    _Scheduler_enqueue(proc);

    return proc;
}

function _Scheduler_spawn(task) {
    return _Scheduler_binding(callback => {
        callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
    });
}

function _Scheduler_rawSend(proc, msg) {
    proc.__mailbox.push(msg);
    _Scheduler_enqueue(proc);
}

function _Scheduler_send(proc, msg) {
    return _Scheduler_binding(callback => {
        _Scheduler_rawSend(proc, msg);
        callback(_Scheduler_succeed(null));
    });
}

function _Scheduler_kill(proc) {
    return _Scheduler_binding(callback => {
        const task = proc.__root;

        if (task.$ === __1_BINDING && task.__kill) {
            task.__kill();
        }

        proc.__root = null;

        callback(_Scheduler_succeed(null));
    });
}


// S T E P

let working = false;
const queue = [];

function _Scheduler_enqueue(proc) {
    queue.push(proc);

    if (working) {
        return;
    }

    working = true;

    let next = queue.shift();

    while (next) {
        _Scheduler_step(proc);

        next = queue.shift();
    }

    working = false;
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
        } else /* if (rootTag === __1_AND_THEN || rootTag === __1_ON_ERROR) */ {
            proc.__stack = {
                $: rootTag === __1_AND_THEN ? __1_SUCCEED : __1_FAIL,
                __callback: proc.__root.__callback,
                __rest: proc.__stack
            };
            proc.__root = proc.__root.__task;
        }
    }
}
