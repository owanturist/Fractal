import * as React from 'react';
import {
    Sub
} from '../src/Platform/Sub';


export interface State {
    count: number;
}

export const initial: State = {
    count: 0
};

export type Msg
    = { type: 'Increment' }
    | { type: 'Decrement' }
    | { type: 'Reset' }
    ;

const Increment: Msg = { type: 'Increment' };
const Decrement: Msg = { type: 'Decrement' };
const Reset: Msg = { type: 'Reset' };

export const update = (msg: Msg, state: State): State => {
    switch (msg.type) {
        case 'Increment': {
            return { ...state, count: state.count + 1 };
        }

        case 'Decrement': {
            return { ...state, count: state.count - 1 };
        }

        case 'Reset': {
            return { ...state, count: 0 };
        }
    }
};

export const View = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
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

export const subscriptions = (state: State): Sub<Msg> => {
    if (state.count === 1) {
        return Sub.none();
    }

    return Sub.port('test-port', () => Reset);
};
