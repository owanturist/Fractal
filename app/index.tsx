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
    ;

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
    }
};

const view = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
    <div>
        <button
            onClick={() => dispatch({ type: 'Decrement' })}
        >-</button>
        {state.count.toString()}
        <button
            onClick={() => dispatch({ type: 'Increment' })}
        >+</button>
    </div>
);

export const p = Platform.program({
    initial,
    update,
    subscriptions: () => Sub.none(),
    view
}).mount(document.getElementById('root'));
