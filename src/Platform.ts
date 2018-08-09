import {
    StatelessComponent,
    Component,
    createElement
} from 'react';
import {
    render
} from 'react-dom';
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

interface FractalProps<S, M> {
    readonly view: StatelessComponent<{ state: S; dispatch(msg: M): void }>;
    getState(): S;
    dispatch(msg: M): void;
    subscribe(listener: (state: S) => void): void;
}

class Fractal<S, M> extends Component<FractalProps<S, M>, S> {
    constructor(props: FractalProps<S, M>) {
        super(props);

        props.subscribe(this.onStateChange);
        this.state = props.getState();
    }

    public onStateChange = (nextState: S) => {
        this.setState(nextState);
    }

    public shouldComponentUpdate(_: FractalProps<S, M>, nextState: S) {
        return this.state !== nextState;
    }

    public render() {
        return createElement(
            this.props.view,
            {
                state: this.state,
                dispatch: this.props.dispatch
            }
        );
    }
}

export class Runtime {
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
    private state: S;

    private onChange: (state: S) => void;

    constructor(
        [ initialState ]: [ S, Cmd<M> ],
        private readonly update: (msg: M, state: S) => [ S, Cmd<M> ],
        private readonly subscriptions: (state: S) => Sub<M>,
        private readonly view: StatelessComponent<{ state: S; dispatch(msg: M): void }>
    ) {
        super();

        this.state = initialState;
        this.onChange = function noop() {
            // no operation
        };
    }

    public mount(node: HTMLElement | null): Runtime {
        render(
            createElement<FractalProps<S, M>>(
                Fractal,
                {
                    view: this.view,
                    getState: () => this.state,
                    dispatch: (msg: M): void => this.dispatch(msg),
                    subscribe: (listener: (state: S) => void) => {
                        this.onChange = listener;
                    }
                }
            ),
            node
        );

        return new Runtime(
            (): void => {
                this.subscriptions(this.state);
            }
        );
    }

    private dispatch(msg: M): void {
        const [ nextState ] = this.update(msg, this.state);

        this.state = nextState;

        this.onChange(nextState);
    }
}

class ProgramWithoutFlags<S, M> extends Program<S, M> {
    constructor(
        initial: [ S, Cmd<M> ],
        update: (msg: M, state: S) => [ S, Cmd<M> ],
        subscriptions: (state: S) => Sub<M>,
        view: StatelessComponent<{ state: S; dispatch(msg: M): void }>
    ) {
        super(initial, update, subscriptions, view);
    }
}

export const program = <S, M>(configuration: {
    initial: [ S, Cmd<M> ];
    view: StatelessComponent<{ state: S; dispatch(msg: M): void }>;
    update(msg: M, state: S): [ S, Cmd<M> ];
    subscriptions(state: S): Sub<M>;
}): Program<S, M> => new ProgramWithoutFlags(
    configuration.initial,
    configuration.update,
    configuration.subscriptions,
    configuration.view
);

