import { Value } from './index';

export default class Encoder implements Value {
    public constructor(private readonly value: unknown) {}

    public encode(indent: number): string {
        return JSON.stringify(this.value, null, indent);
    }

    public serialize(): unknown {
        return this.value;
    }

    public tap<R>(fn: (value: Value) => R): R {
        return fn(this);
    }
}
