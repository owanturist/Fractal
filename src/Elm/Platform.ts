import * as Scheduler from './Scheduler';
import * as Process from './Process';
import * as Task from './Task';

const noop = () => {
    // do nothing
};

const __2_LEAF = 'LEAF';
const __2_MAP = 'MAP';
const __2_NODE = 'NODE';
const __2_SELF = 'SELF';

// P R O G R A M S


export function worker(impl) {
    return _initialize(
        impl.init,
        impl.update,
        impl.subscriptions
    );
}

// INITIALIZE A PROGRAM


function _initialize(init, update, subscriptions) {
    const [initialModel, initialCmd] = init();

    const managers = {};
    let model = initialModel;

    const ports = _setupEffects(managers, sendToApp);

    function sendToApp(msg) {
        const [nextModel, nextCmd] = update(msg, model);

        model = nextModel;

        _Platform_dispatchEffects(managers, nextCmd, subscriptions(model));
    }

    _Platform_dispatchEffects(managers, initialCmd, subscriptions(model));

    return ports ? { ports } : {};
}


// EFFECT MANAGERS


const effectManagers = {
    TASK: Task.home
};


function _setupEffects(managers, sendToApp) {
    let ports;

    // setup all necessary effect managers
    // tslint:disable-next-line:forin
    for (const key in effectManagers) {
        const manager = effectManagers[key];

        if (manager.__portSetup) {
            ports = ports || {};
            ports[key] = manager.__portSetup(key, sendToApp);
        }

        managers[key] = _instantiateManager(manager, sendToApp);
    }

    return ports;
}


export function createManager(init, onEffects, onSelfMsg, cmdMap, subMap) {
    return {
        __init: init,
        __onEffects: onEffects,
        __onSelfMsg: onSelfMsg,
        __cmdMap: cmdMap,
        __subMap: subMap
    };
}


function _instantiateManager(info, sendToApp) {
    const router = {
        __sendToApp: sendToApp,
        __selfProcess: undefined
    };

    const onEffects = info.__onEffects;
    const onSelfMsg = info.__onSelfMsg;
    const cmdMap = info.__cmdMap;
    const subMap = info.__subMap;

    function loop(state) {
        return Scheduler.andThen(loop, Scheduler.receive(msg => {
            const value = msg.a;

            if (msg.$ === __2_SELF) {
                return onSelfMsg(router, value, state);
            }

            const o = cmdMap && subMap
                ? onEffects(router, value.__cmds, value.__subs, state)
                : onEffects(router, cmdMap ? value.__cmds : value.__subs, state);

            return o;
        }));
    }

    return router.__selfProcess = Scheduler.rawSpawn(Scheduler.andThen(loop, info.__init));
}


// ROUTING


export function sendToApp(router, msg) {
    return Scheduler.binding(callback => {
        router.__sendToApp(msg);
        callback(Scheduler.succeed(null));
    });
}


export function sendToSelf(router, msg) {
    return Scheduler.send(router.__selfProcess, {
        $: __2_SELF,
        a: msg
    });
}


// BAGS


export function leaf(home, value) {
    return {
        $: __2_LEAF,
        __home: home,
        __value: value
    };
}


export function batch(list) {
    return {
        $: __2_NODE,
        __bags: list
    };
}


function map(tagger, bag) {
    return {
        $: __2_MAP,
        __func: tagger,
        __bag: bag
    };
}

// PIPE BAGS INTO EFFECT MANAGERS


function _Platform_dispatchEffects(managers, cmdBag, subBag) {
    const effectsDict = {};

    _Platform_gatherEffects(true, cmdBag, effectsDict, null);
    _Platform_gatherEffects(false, subBag, effectsDict, null);

    // tslint:disable-next-line:forin
    for (const home in managers) {
        Scheduler.rawSend(managers[home], {
            $: 'fx',
            a: effectsDict[home] || { __cmds: [], __subs: [] }
        });
    }
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers) {
    switch (bag.$) {
        case __2_LEAF:
            const home = bag.__home;
            const effect = _Platform_toEffect(isCmd, home, taggers, bag.__value);
            effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
            return;

        case __2_NODE:
            for (const leaf of bag.__bags) {
                _Platform_gatherEffects(isCmd, leaf, effectsDict, taggers);
            }
            return;

        case __2_MAP:
            _Platform_gatherEffects(isCmd, bag.__bag, effectsDict, {
                __tagger: bag.__func,
                __rest: taggers
            });
            return;
    }
}


function _Platform_toEffect(isCmd, home, taggers, value) {
    function applyTaggers(x) {
        let y = x;

        for (let temp = taggers; temp; temp = temp.__rest) {
            y = temp.__tagger(y);
        }
        return y;
    }

    const map = isCmd
        ? effectManagers[home].__cmdMap
        : effectManagers[home].__subMap;

    return map(applyTaggers, value);
}


function _Platform_insert(isCmd, newEffect, effects) {
    const effects_ = effects || { __cmds: [], __subs: [] };

    isCmd
        ? (effects_.__cmds = [ ...effects_.__cmds, newEffect ])
        : (effects_.__subs = [ ...effects_.__subs, newEffect ]);

    return effects_;
}


// OUTGOING PORTS

function _checkPortName(name) {
    if (effectManagers[name]) {
        // tslint:disable-next-line:no-console
        console.error(`The port '${name}' already exists.`);
    }
}


export function outgoingPort(name) {
    _checkPortName(name);

    effectManagers[name] = {
        __cmdMap: outgoingPortMap,
        __portSetup: setupOutgoingPort
    };

    return value => leaf(name, value);
}


const outgoingPortMap = (_tagger, value) => value;

function setupOutgoingPort(name) {
    let subs = [];

    // CREATE MANAGER

    const init = Process.sleep(0);

    effectManagers[name].__init = init;
    effectManagers[name].__onEffects = (router, cmdList, state) => {
        for (const cmd of cmdList) {
            // grab a separate reference to subs in case unsubscribe is called
            const currentSubs = subs;

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < currentSubs.length; i++) {
                currentSubs[i](cmd);
            }
        }
        return init;
    };

    // PUBLIC API

    function subscribe(callback) {
        subs.push(callback);
    }

    function unsubscribe(callback) {
        // copy subs into a new array in case unsubscribe is called within a
        // subscribed callback
        subs = subs.slice();

        const index = subs.indexOf(callback);

        if (index >= 0) {
            subs.splice(index, 1);
        }
    }

    return { subscribe, unsubscribe };
}


// INCOMING PORTS


export function incomingPort(name) {
    _checkPortName(name);
    effectManagers[name] = {
        __subMap: _incomingPortMap,
        __portSetup: _setupIncomingPort
    };
    return value => leaf(name, value);
}

function _incomingPortMap(tagger, finalTagger) {
    return value => tagger(finalTagger(value));
}

function _setupIncomingPort(name, sendToApp) {
    let subs = [];

    // CREATE MANAGER

    const init = Scheduler.succeed(null);

    effectManagers[name].__init = init;
    effectManagers[name].__onEffects = (router, subList, state) => {
        subs = subList;
        return init;
    };

    // PUBLIC API

    function send(incomingValue) {
        for (const sub of subs) {
            sendToApp(sub(incomingValue));
        }
    }

    return { send };
}
