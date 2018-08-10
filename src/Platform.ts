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


function noop() {
    // no operation
}

interface FractalProps<S, M> {
    readonly initialState: S;
    readonly view: StatelessComponent<{ state: S; dispatch(msg: M): void }>;
    dispatch(msg: M): void;
    subscribe(listener: (state: S) => void): void;
}

class Fractal<S, M> extends Component<FractalProps<S, M>, S> {
    constructor(props: FractalProps<S, M>, context: any) {
        super(props, context);

        props.subscribe(this.onStateChange);
        this.state = props.initialState;
    }

    public onStateChange = (nextState: S): void => {
        this.setState(nextState);
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
        public readonly send: (name: string, value: Value) => void
    ) {
    }

    public subscribe(name: string, listener: (value: Value) => void): () => void {
        if (this.listeners[ name ] === undefined) {
            this.listeners[ name ] = [ listener ];
        } else if (this.listeners[ name ].indexOf(listener) === -1) {
            this.listeners[ name ].push(listener);
        }

        return () => {
            if (this.listeners[ name ] !== undefined) {
                this.listeners[ name ].filter(
                    (fn: (value: Value) => void): boolean => fn !== listener
                );
            }
        };
    }
}

abstract class ProgramSub<M> extends Sub<M> {
    public static executePort<M>(name: string, value: Value, sub: Sub<M>): Array<M> {
        return Sub.executePort(name, value, sub);
    }
}

export abstract class Program<S, M> {
    private state: S;

    private onChange: (state: S) => void = noop;

    constructor(
        [ initialState ]: [ S, Cmd<M> ],
        private readonly update: (msg: M, state: S) => [ S, Cmd<M> ],
        private readonly subscriptions: (state: S) => Sub<M>,
        private readonly view: StatelessComponent<{ state: S; dispatch(msg: M): void }>
    ) {
        this.state = initialState;
    }

    public mount(node: HTMLElement | null): Runtime {
        render(
            createElement<FractalProps<S, M>>(
                Fractal,
                {
                    initialState: this.state,
                    view: this.view,
                    dispatch: this.dispatch,
                    subscribe: (listener: (state: S) => void) => {
                        this.onChange = listener;
                    }
                }
            ),
            node
        );

        return new Runtime(
            (name: string, value: Value): void => {
                const msgs = ProgramSub.executePort(
                    name,
                    value,
                    this.subscriptions(this.state)
                );

                for (const msg of msgs) {
                    this.dispatch(msg);
                }
            }
        );
    }

    private dispatch = (msg: M): void => {
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

