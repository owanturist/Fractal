/**
 * E F F E C T S
 */

abstract class Effect<Msg> {
    protected static toPromise<Msg>(effect: Effect<Msg>, dispatch: (msg: Msg) => void): Promise<void> {
        return effect.toPromise(dispatch);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    protected abstract toPromise(dispatch: (msg: Msg) => void): Promise<void>;
}

abstract class Runner<Msg> extends Effect<Msg> {
    public static toPromise<Msg>(effect: Effect<Msg>, dispatch: (msg: Msg) => void): Promise<void> {
        return super.toPromise(effect, dispatch);
    }
}

const None = new class None<Msg> extends Effect<Msg> {
    public map<R>(): Effect<R> {
        return this;
    }

    protected toPromise(): Promise<void> {
        return Promise.resolve();
    }
}<never>();

class Batch<Msg> extends Effect<Msg> {
    public static of<Msg>(effects: Array<Effect<Msg>>): Effect<Msg> {
        const notNone: Array<Effect<Msg>> = [];

        for (const effect of effects) {
            // None is a singleton
            if (effect !== None) {
                notNone.push(effect);
            }
        }

        switch (notNone.length) {
            case 0: return None;
            case 1: return notNone[ 0 ];
            default: return new Batch(notNone);
        }
    }

    private constructor(private readonly effects: Array<Effect<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Effect<R> {
        const nextEffects: Array<Effect<R>> = new Array(this.effects.length);

        for (let i = 0; i < nextEffects.length; i++) {
            nextEffects[ i ] = this.effects[ i ].map(fn);
        }

        return new Batch(nextEffects);
    }

    protected toPromise(dispatch: (msg: Msg) => void): Promise<void> {
        const promises: Array<Promise<void>> = new Array(this.effects.length);

        for (let i = 0; i < promises.length; i++) {
            promises[ i ] = Effect.toPromise(this.effects[ i ], dispatch);
        }

        return Promise.all(promises).then(() => undefined);
    }
}

export abstract class Cmd<Msg> extends Effect<Msg> {
    public abstract effect(done: (msg: Msg) => void): void;

    public abstract map<R>(fn: (value: Msg) => R): Cmd<R>;

    protected toPromise(dispatch: (msg: Msg) => void): Promise<void> {
        return new Promise(resolve => this.effect(resolve)).then(dispatch);
    }
}

export namespace Cmd {
    export const none = None as unknown as Cmd<never>;

    export const batch = Batch.of as <Msg>(cmds: Array<Cmd<Msg>>) => Cmd<Msg>;
}

/**
 * P R O G R A M
 */

export interface Program<Msg, Model> {
    getModel(): Model;
    dispatch(msg: Msg): void;
    subscribe(subscriber: () => void): () => void;
}

export namespace Program {
    export const client = <Flags, Msg, Model>({ flags, init, update }: {
        flags: Flags;
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    }): Program<Msg, Model> => {
        return new ClientProgram(init(flags), update);
    };

    export const server = <Flags, Msg, Model>({ flags, init, update }: {
        flags: Flags;
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    }): Promise<Model> => {
        return new ServerProgram(init(flags), update).toPromise();
    };
}

class ClientProgram<Msg, Model> implements Program<Msg, Model> {
    private model: Model;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialEffects ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.executeCmd(initialEffects);
    }

    public dispatch = (msg: Msg): void => {
        const [ nextModel, effects ] = this.update(msg, this.model);

        this.model = nextModel;
        this.executeCmd(effects);

        for (const subscriber of this.subscribers) {
            subscriber();
        }
    }

    public getModel(): Model {
        return this.model;
    }

    public subscribe(subscriber: () => void): () => void {
        let subscribed = true;

        this.subscribers.push(subscriber);

        return (): void => {
            if (subscribed) {
                subscribed = false;
                this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
            }
        };
    }

    private executeCmd(cmd: Cmd<Msg>): void {
        Runner.toPromise(cmd, this.dispatch);
    }
}

class ServerProgram<Msg, Model> {
    private model: Model;
    private effects: Cmd<Msg>;

    public constructor(
        [ initialModel, initialEffects ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ]
    ) {
        this.model = initialModel;
        this.effects = initialEffects;
    }

    public toPromise(): Promise<Model> {
        return this.executeCmd(this.effects);
    }

    private dispatch = (msg: Msg): Promise<Model> => {
        const [ nextModel, effects ] = this.update(msg, this.model);

        this.model = nextModel;
        return this.executeCmd(effects);
    }

    private executeCmd(cmd: Cmd<Msg>): Promise<Model> {
        return Runner.toPromise(cmd, this.dispatch).then(() => this.model);
    }
}
