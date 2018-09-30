import * as React from 'react';
import {
    Sub
} from '../src/Platform/Sub';
import {
    Time
} from '../src/Time';

export interface State {
    count: number;
    autoIncrement: boolean;
}

export const initial: State = {
    count: 0,
    autoIncrement: false
};

export type Msg
    = { type: 'Increment' }
    | { type: 'Decrement' }
    | { type: 'Reset' }
    | { type: 'ToggleAutoIncrement' }
    ;

const Increment: Msg = { type: 'Increment' };
const Decrement: Msg = { type: 'Decrement' };
const Reset: Msg = { type: 'Reset' };
const ToggleAutoIncrement: Msg = { type: 'ToggleAutoIncrement' };

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

        case 'ToggleAutoIncrement': {
            return { ...state, autoIncrement: !state.autoIncrement };
        }
    }
};

export const View = ({ state, dispatch }: { state: State; dispatch(msg: Msg): void }): React.ReactElement<State> => (
    <div>
        <label>
            <input
                type='checkbox'
                checked={state.autoIncrement}
                onChange={() => dispatch(ToggleAutoIncrement)}
            />
            increment automaticly
        </label>
        <br />
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
    return Sub.batch([
        state.autoIncrement
            ? Time.second(1).every(() => Increment)
            : Sub.none(),
        state.count === 1
            ? Sub.none()
            : Sub.port('counter__reset', () => Reset)
    ]);
};
