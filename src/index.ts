import {
    Maybe,
    Nothing as _Nothing,
    Just as _Just
} from './Maybe';

export {
    Maybe,
    MaybePattern
} from './Maybe';

export const Just = <T>(value: T): Maybe<T> => new _Just(value);

export const Nothing: Maybe<any> = new _Nothing();
