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

    public static port<M>(name: string, tagger: (value: Value) => M) {
        return new Port(name, tagger);
    }

    protected static executeSubscriptionPort<M>(name: string, value: Value, sub: Sub<M>): Maybe<M> {
        return sub.executePort(name, value);
    }

    public abstract map<R>(fn: (value: M) => R): Sub<R>;

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

class Port<M> extends Sub<M> {
    constructor(
        private readonly name: string,
        private readonly tagger: (value: Value) => M
    ) {
        super();
    }

    public map<R>(fn: (value: M) => R): Sub<R> {
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
