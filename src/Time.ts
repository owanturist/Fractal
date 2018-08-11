/* tslint-ignore bitwice */

import {
    Sub
} from './Platform/Sub';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MIUTES_IN_HOUR = 60;

export class Time {
    public static millisecond(amount: number): Time {
        // tslint:disable-next-line:no-bitwise
        return new Time(amount | 0);
    }

    public static second(amount: number): Time {
        // tslint:disable-next-line:no-bitwise
        return Time.millisecond((amount | 0) * MILLISECONDS_IN_SECOND);
    }

    public static minute(amount: number): Time {
        // tslint:disable-next-line:no-bitwise
        return Time.second((amount | 0) * SECONDS_IN_MINUTE);
    }

    public static hour(amount: number): Time {
        // tslint:disable-next-line:no-bitwise
        return Time.minute((amount | 0) * MIUTES_IN_HOUR);
    }

    constructor(private readonly value: number) {}

    public inMilliseconds(): number {
        return this.value;
    }

    public inSeconds(): number {
        // tslint:disable-next-line:no-bitwise
        return (this.inMilliseconds() / MILLISECONDS_IN_SECOND) | 0;
    }

    public inMinutes(): number {
        // tslint:disable-next-line:no-bitwise
        return (this.inSeconds() / SECONDS_IN_MINUTE) | 0;
    }

    public inHours(): number {
        // tslint:disable-next-line:no-bitwise
        return (this.inMinutes() / MIUTES_IN_HOUR) | 0;
    }

    public every<M>(tagger: (time: Time) => M): Sub<M> {
        return new TimeSub(this.inMilliseconds(), tagger);
    }
}

class TimeSub<M> extends Sub<M> {
    constructor(
        private readonly delay: number,
        private readonly tagger: (time: Time) => M
    ) {
        super();
    }

    public map<R>(fn: (msg: M) => R): Sub<R> {
        return new TimeSub(
            this.delay,
            (time: Time): R => fn(this.tagger(time))
        );
    }

    protected executeEvery(dispatch: (msg: M) => void): Array<() => () => void> {
        return [
            () => {
                const intervalId = setInterval(() => {
                    dispatch(
                        this.tagger(Time.millisecond(Date.now()))
                    );
                }, this.delay);

                return () => {
                    clearInterval(intervalId);
                };
            }
        ];
    }

    protected executePort(): Array<M> {
        return [];
    }
}
