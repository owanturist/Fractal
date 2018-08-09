import {
    Value
} from './Json/Encode';
import {
    Cmd
} from './Platform/Cmd';
import {
    Sub
} from './Platform/Sub';

export abstract class Platform {
}

export class Runtime<S, M> {
    private readonly listeners: {[ key: string ]: Array<(value: Value) => void>} = {};

    constructor(
        private readonly dispatch: (port: string, value: Value) => void
    ) {
    }

    public send(port: string, value: Value): void {
        this.dispatch(port, value);
    }

    public subscribe(port: string, listener: (value: Value) => void): () => void {
        if (this.listeners[ port ] === undefined) {
            this.listeners[ port ] = [ listener ];
        } else if (this.listeners[ port ].indexOf(listener) === -1) {
            this.listeners[ port ].push(listener);
        }

        return () => {
            if (this.listeners[ port ] !== undefined) {
                this.listeners[ port ].filter(
                    (fn: (value: Value) => void): boolean => fn !== listener
                );
            }
        };
    }
}

export abstract class Program<S, M> extends Platform {
    constructor(
        private readonly initial: [ S, Cmd<M> ],
        private readonly update: (msg: M, state: S) => [ S, Cmd<M> ],
        private readonly subscriptions: (state: S) => Sub<M>
    ) {
        super();
    }

    public worker(): Runtime<S, M> {
        let [ state ] = this.initial;

        state = state;

        return new Runtime(
            (port: string, value: Value): void => {
                const subscription = this.subscriptions(state);
            }
        );
    }
}

class ProgramWithoutFlags<S, M> extends Program<S, M> {
    constructor(
        initial: [ S, Cmd<M> ],
        update: (msg: M, state: S) => [ S, Cmd<M> ],
        subscriptions: (state: S) => Sub<M>
    ) {
        super(initial, update, subscriptions);
    }
}

export const program = <S, M>(configuration: {
    initial: [ S, Cmd<M> ];
    update(msg: M, state: S): [ S, Cmd<M> ];
    subscriptions(state: S): Sub<M>;
}): Program<S, M> => new ProgramWithoutFlags(
    configuration.initial,
    configuration.update,
    configuration.subscriptions
);

