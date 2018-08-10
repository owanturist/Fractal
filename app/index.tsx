import * as React from 'react';
import * as Platform from '../src/Platform';
import {
    Cmd
} from '../src/Platform/Cmd';
import {
    Sub
} from '../src/Platform/Sub';
import * as Counter from './Counter';

interface State {
    counter: Counter.State;
}

const initial: [ State, Cmd<Msg> ] = [
    {
        counter: Counter.initial
    },
    Cmd.none()
];

type Msg
    = { type: 'NoOp' }
    | { type: 'CounterMsg'; _0: Counter.Msg }
    ;

const CounterMsg = (msg: Counter.Msg): Msg => ({ type: 'CounterMsg', _0: msg });

const update = (msg: Msg, state: State): [ State, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'NoOp': {
            return [ state, Cmd.none() ];
        }

        case 'CounterMsg': {
            return [
                { ...state, counter: Counter.update(msg._0, state.counter) },
                Cmd.none()
            ];
        }
    }
};

const View = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
    <div>
        <h1>Hello World!</h1>

        <Counter.View
            state={state.counter}
            dispatch={(msg: Counter.Msg) => dispatch(CounterMsg(msg))}
        />
    </div>
);

const subscriptions = (state: State): Sub<Msg> => {
    return Counter.subscriptions(state.counter).map(CounterMsg);
};

const rootNode = document.getElementById('root');
const btnNode = document.getElementById('btn-reset');

if (rootNode !== null && btnNode !== null) {
    const app = Platform
        .program({ initial, update, subscriptions, view: View })
        .mount(document.getElementById('root'));

    btnNode.addEventListener('click', () => {
        app.send('test-port', null);
    });
}
