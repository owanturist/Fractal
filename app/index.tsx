import * as Platform from '../src/Platform';
import {
    Cmd
} from '../src/Platform/Cmd';
import {
    Sub
} from '../src/Platform/Sub';

// const p: Platform.Runtime<boolean, 'msg'> = Platform.program({
//     initial: [ false, Cmd.none() ],
//     update: (msg: 'msg', state: boolean) => [state, Cmd.none()],
//     subscriptions: () => Sub.none()
// }).worker();

