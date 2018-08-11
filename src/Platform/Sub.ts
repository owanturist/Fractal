import {
    Value
} from '../Json/Encode';


export abstract class Sub<M> {
    public static none<M>(): Sub<M> {
        return new None();
    }

    public static batch<M>(subs: Array<Sub<M>>): Sub<M> {
        return new Batch(subs);
    }

    public static port<M>(name: string, tagger: (value: Value) => M) {
        return new Port(name, tagger);
    }

    protected static executeEvery<M>(dispatch: (msg: M) => void, sub: Sub<M>): Array<() => () => void> {
        return sub.executeEvery(dispatch);
    }

    protected static executePort<M>(name: string, value: Value, sub: Sub<M>): Array<M> {
        return sub.executePort(name, value);
    }

    public abstract map<R>(fn: (msg: M) => R): Sub<R>;

    protected abstract executeEvery(dispatch: (msg: M) => void): Array<() => () => void>;

    protected abstract executePort(name: string, value: Value): Array<M>;
}

class None<M> extends Sub<M> {
    public map<R>(): Sub<R> {
        return this as any as Sub<R>;
    }

    protected executeEvery(): Array<() => () => void> {
        return [];
    }

    protected executePort(): Array<M> {
        return [];
    }
}

class Batch<M> extends Sub<M> {
    constructor(private readonly subs: Array<Sub<M>>) {
        super();
    }

    public map<R>(fn: (msg: M) => R): Sub<R> {
        const nextSubs: Array<Sub<R>> = [];

        for (const sub of this.subs) {
            nextSubs.push(sub.map(fn));
        }

        return new Batch(nextSubs);
    }

    protected executeEvery(dispatch: (msg: M) => void): Array<() => () => void> {
        const msgs: Array<() => () => void> = [];

        for (const sub of this.subs) {
            const butchOfMsgs = Sub.executeEvery(dispatch, sub);

            if (butchOfMsgs.length !== 0) {
                msgs.push(...butchOfMsgs);
            }

        }

        return msgs;
    }

    protected executePort(name: string, value: Value): Array<M> {
        const msgs: Array<M> = [];

        for (const sub of this.subs) {
            const butchOfMsgs = Sub.executePort(name, value, sub)

            if (butchOfMsgs.length !== 0) {
                msgs.push(...butchOfMsgs);
            }
        }

        return msgs;
    }
}

class Port<M> extends Sub<M> {
    constructor(
        private readonly name: string,
        private readonly tagger: (value: Value) => M
    ) {
        super();
    }

    public map<R>(fn: (msg: M) => R): Sub<R> {
        return new Port(
            this.name,
            (value: Value): R => fn(this.tagger(value))
        );
    }

    protected executeEvery(): Array<() => () => void> {
        return [];
    }

    protected executePort(name: string, value: Value): Array<M> {
        if (name === this.name) {
            return [
                this.tagger(value)
            ];
        }

        return [];
    }
}
