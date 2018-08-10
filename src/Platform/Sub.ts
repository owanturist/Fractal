import {
    Value
} from '../Json/Encode';
import {
    Maybe,
    Nothing,
    Just
} from '../Maybe';

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

    protected static executePort<M>(name: string, value: Value, sub: Sub<M>): Maybe<M> {
        return sub.executePort(name, value);
    }

    public abstract map<R>(fn: (msg: M) => R): Sub<R>;

    protected abstract executePort(name: string, value: Value): Maybe<M>;
}

class None<M> extends Sub<M> {
    public map<R>(): Sub<R> {
        return this as any as Sub<R>;
    }

    protected executePort(): Maybe<M> {
        return Nothing();
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

    protected executePort(name: string, value: Value): Maybe<M> {
        for (const sub of this.subs) {
            const maybe = Sub.executePort(name, value, sub);

            if (maybe.isJust) {
                return maybe;
            }
        }

        return Nothing();
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

    protected executePort(name: string, value: Value): Maybe<M> {
        if (name === this.name) {
            return Just(this.tagger(value));
        }

        return Nothing();
    }
}
