import {
    Value
} from '../Json/Encode';
import {
    Platform
} from '../Platform';
import {
    Cmd
} from './Cmd';
import {
    Sub
} from './Sub';

export abstract class Port extends Platform {
    public static send<M>(name: string, value: Value): Cmd<M> {

    }
}
