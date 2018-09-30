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
    firstCounter: Counter.State;
    secondConuter: Counter.State;
}

const initial: [ State, Cmd<Msg> ] = [
    {
        firstCounter: Counter.initial,
        secondConuter: Counter.initial
    },
    Cmd.none()
];

type Msg
    = { type: 'FirstCounterMsg'; _0: Counter.Msg }
    | { type: 'SecondCounterMsg'; _0: Counter.Msg }
    ;

const FirstCounterMsg = (msg: Counter.Msg): Msg => ({ type: 'FirstCounterMsg', _0: msg });
const SecondCounterMsg = (msg: Counter.Msg): Msg => ({ type: 'SecondCounterMsg', _0: msg });

const update = (msg: Msg, state: State): [ State, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'FirstCounterMsg': {
            return [
                { ...state, firstCounter: Counter.update(msg._0, state.firstCounter)},
                Cmd.none()
            ];
        }

        case 'SecondCounterMsg': {
            return [
                { ...state, secondConuter: Counter.update(msg._0, state.secondConuter)},
                Cmd.none()
            ];
        }
    }
};

const View = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
    <div>
        <h1>Hello World!</h1>

        <Counter.View
            state={state.firstCounter}
            dispatch={(msg: Counter.Msg) => dispatch(FirstCounterMsg(msg))}
        />

        <Counter.View
            state={state.secondConuter}
            dispatch={(msg: Counter.Msg) => dispatch(SecondCounterMsg(msg))}
        />
    </div>
);

const subscriptions = (state: State): Sub<Msg> => {
    return Sub.batch([
        Counter.subscriptions(state.firstCounter).map(FirstCounterMsg),
        Counter.subscriptions(state.secondConuter).map(SecondCounterMsg)
    ]);
};

const rootNode = document.getElementById('root');
const btnNode = document.getElementById('btn-reset');

if (rootNode !== null && btnNode !== null) {
    const app = Platform
        .program({ initial, update, subscriptions, view: View })
        .mount(document.getElementById('root'));

    btnNode.addEventListener('click', () => {
        app.send('counter__reset', null);
    });
}
