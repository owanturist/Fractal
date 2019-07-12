import test from 'ava';

import {
    Nothing,
    Just
} from '../../src/Maybe';
import {
    Url
} from '../../src/Url';
import {
    Parser
} from '../../src/Url/Parser';

const URL = Url.cons(Url.Https, 'google.com');

interface Route {
    toPath(): string;
}

class ToHome implements Route {
    public toPath(): string {
        return '/';
    }
}

class ToProfile implements Route {
    public toPath(): string {
        return '/profile';
    }
}

test('Parser.top', t => {
    t.deepEqual(
        Parser.top.map(new ToHome()).parse(
            URL.withPath('/profile')
        ),
        Nothing,
        'not empty path is not matched'
    );

    t.deepEqual(
        Parser.top.map(new ToHome()).parse(
            URL.withPath('/')
        ),
        Just(new ToHome()),
        'empty path is matched'
    );
});

test('Parser.s', t => {
    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/some/')
        ),
        Nothing,
        'different single path is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/some/profile/')
        ),
        Nothing,
        'extra before'
    );

    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/profile/some/')
        ),
        Nothing,
        'extra after'
    );

    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/some/profile/thing/')
        ),
        Nothing,
        'extra around'
    );

    t.deepEqual(
        Parser.s('profile').map(new ToProfile()).parse(
            URL.withPath('/profile/')
        ),
        Just(new ToProfile()),
        'exact single path is matched'
    );

    t.deepEqual(
        Parser.s('some').slash.s('profile').map(new ToProfile()).parse(
            URL.withPath('/some/thing/profile')
        ),
        Nothing,
        'extra between'
    );

    t.deepEqual(
        Parser.s('some').slash.s('profile').map(new ToProfile()).parse(
            URL.withPath('/some/profile/')
        ),
        Just(new ToProfile()),
        'exact multiple path is matched'
    );
});
