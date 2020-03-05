export type Effect<Msg> = (dispatch: (msg: Msg) => void) => void;

/**
 * P R O G R A M
 */

export interface Program<Model, Msg> {
    getModel(): Model;
    dispatch(msg: Msg): void;
    subscribe(subscriber: () => void): () => void;
}

export namespace Program {
    export const run = <Flags, Model, Msg>({ flags, init, update }: {
        flags: Flags;
        init(flags: Flags): [ Model, Array<Effect<Msg>> ];
        update(msg: Msg, model: Model): [ Model, Array<Effect<Msg>> ];
    }): Program<Model, Msg> => {
        return new ProgramImpl(init(flags), update);
    };
}

class ProgramImpl<Model, Msg> implements Program<Model, Msg> {
    private model: Model;
    private readonly subscribers: Array<() => void> = [];

    public constructor(
        [ initialModel, initialEffects ]: [ Model, Array<Effect<Msg>> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Array<Effect<Msg>> ]
    ) {
        this.model = initialModel;
        this.executeEffects(initialEffects);
    }

    public dispatch = (msg: Msg): void => {
        const [ nextModel, effects ] = this.update(msg, this.model);

        this.model = nextModel;
        this.executeEffects(effects);

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

    private executeEffects(effects: Array<Effect<Msg>>): void {
        for (const effect of effects) {
            effect(this.dispatch);
        }
    }
}
