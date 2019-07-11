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
        URL.withPath('/profile').parse(
            Parser.top.ap(new ToHome())
        ),
        Nothing,
        'not empty path is not matched'
    );

    t.deepEqual(
        URL.withPath('/').parse(
            Parser.top.ap(new ToHome())
        ),
        Just(new ToHome()),
        'empty path is matched'
    );
});

test('Parser.s', t => {
    t.deepEqual(
        URL.withPath('/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        URL.withPath('/some/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Nothing,
        'different single path is not matched'
    );

    t.deepEqual(
        URL.withPath('/some/profile/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Nothing,
        'extra before'
    );

    t.deepEqual(
        URL.withPath('/profile/some/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Nothing,
        'extra after'
    );

    t.deepEqual(
        URL.withPath('/some/profile/thing/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Nothing,
        'extra around'
    );

    t.deepEqual(
        URL.withPath('/profile/').parse(
            Parser.s('profile').map(new ToProfile())
        ),
        Just(new ToProfile()),
        'exact single path is matched'
    );

    t.deepEqual(
        URL.withPath('/some/thing/profile').parse(
            Parser.s('some').slash.s('profile').ap(new ToProfile())
        ),
        Nothing,
        'extra between'
    );

    t.deepEqual(
        URL.withPath('/some/profile/').parse(
            Parser.s('some').slash.s('profile').ap(new ToProfile())
        ),
        Just(new ToProfile()),
        'exact multiple path is matched'
    );
});
