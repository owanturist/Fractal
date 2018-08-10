import * as React from 'react';
import * as Platform from '../src/Platform';
import {
    Cmd
} from '../src/Platform/Cmd';
import {
    Sub
} from '../src/Platform/Sub';


interface State {
    count: number;
}

const initial: [ State, Cmd<Msg> ] = [
    {
        count: 0
    },
    Cmd.none()
];

type Msg
    = { type: 'Increment' }
    | { type: 'Decrement' }
    | { type: 'Reset' }
    ;

const Increment: Msg = { type: 'Increment' };
const Decrement: Msg = { type: 'Decrement' };
const Reset: Msg = { type: 'Reset' };

const update = (msg: Msg, state: State): [ State, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'Increment': {
            return [
                { ...state, count: state.count + 1 },
                Cmd.none()
            ];
        }

        case 'Decrement': {
            return [
                { ...state, count: state.count - 1 },
                Cmd.none()
            ];
        }

        case 'Reset': {
            return [
                { ...state, count: 0 },
                Cmd.none()
            ];
        }
    }
};

const view = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
    <div>
        <button
            onClick={() => dispatch(Decrement)}
        >-</button>
        {state.count.toString()}
        <button
            onClick={() => dispatch(Increment)}
        >+</button>
    </div>
);

const subscriptions = (state: State): Sub<Msg> => {
    if (state.count === 1) {
        return Sub.none();
    }

    return Sub.port('test-port', () => Reset);
};

const rootNode = document.getElementById('root');
const btnNode = document.getElementById('btn-reset');

if (rootNode !== null && btnNode !== null) {
    const app = Platform
        .program({ initial, update, subscriptions, view })
        .mount(document.getElementById('root'));

    btnNode.addEventListener('click', () => {
        app.send('test-port', null);
    });
}
