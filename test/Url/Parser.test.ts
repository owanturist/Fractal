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

// interface Route {
//     toPath(): string;
// }

// class ToHome implements Route {
//     public toPath(): string {
//         return '/';
//     }
// }

// class ToProfile implements Route {
//     public toPath(): string {
//         return '/profile';
//     }
// }

// class ToArticle implements Route {
//     public static cons(title: string): Route {
//         return new ToArticle(title);
//     }

//     private constructor(private readonly title: string) {}

//     public toPath(): string {
//         return `/article/${this.title}`;
//     }
// }

test('Parser.top', t => {
    t.deepEqual(
        Parser.top.map(0).parse(
            URL.withPath('/profile')
        ),
        Nothing,
        'not empty path is not matched'
    );

    t.deepEqual(
        Parser.top.map(0).parse(
            URL.withPath('/')
        ),
        Just(0),
        'empty path is matched'
    );
});

test('Parser.s', t => {
    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/some/')
        ),
        Nothing,
        'different single path is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/before/profile/')
        ),
        Nothing,
        'extra before is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/profile/after/')
        ),
        Nothing,
        'extra after is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/before/profile/after/')
        ),
        Nothing,
        'extra around is not matched'
    );

    t.deepEqual(
        Parser.s('profile').map(0).parse(
            URL.withPath('/profile/')
        ),
        Just(0),
        'exact single path is matched'
    );

    t.deepEqual(
        Parser.s('some').slash.s('profile').map(0).parse(
            URL.withPath('/some/between/profile')
        ),
        Nothing,
        'extra between is not matched'
    );

    t.deepEqual(
        Parser.s('some').slash.s('profile').map(0).parse(
            URL.withPath('/some/profile/')
        ),
        Just(0),
        'exact multiple path is matched'
    );

    t.deepEqual(
        Parser.s('some').slash.s('profile').slash.s('thing').map(0).parse(
            URL.withPath('/some/profile/thing/')
        ),
        Just(0),
        'exact long path is matched'
    );
});

test('Parser.string', t => {
    const single = (first: string) => ({ first });
    const double = (first: string) => (second: string) => ({ first, second });
    const tripple = (first: string) => (second: string) => (third: string) => ({ first, second, third });

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/before/article-title/')
        ),
        Nothing,
        'extra before is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/article-title/after/')
        ),
        Nothing,
        'extra after is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/before/article-title/after/')
        ),
        Nothing,
        'extra around is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/article-title/')
        ),
        Just(single('article-title')),
        'exact single string is matched'
    );

    t.deepEqual(
        Parser.s('some').slash.string.map(single).parse(
            URL.withPath('/some/article-title/')
        ),
        Just(single('article-title')),
        'exact single string with path before is matched'
    );

    t.deepEqual(
        Parser.string.slash.s('thing').map(single).parse(
            URL.withPath('/article-title/thing/')
        ),
        Just(single('article-title')),
        'exact single string with path after is matched'
    );

    t.deepEqual(
        Parser.s('some').slash.string.slash.s('thing').map(single).parse(
            URL.withPath('/some/article-title/thing/')
        ),
        Just(single('article-title')),
        'exact single string with path around is matched'
    );

    t.deepEqual(
        Parser.string.slash.string.map(double).parse(
            URL.withPath('/some/')
        ),
        Nothing,
        'too short for double is not matched'
    );

    t.deepEqual(
        Parser.string.slash.string.map(double).parse(
            URL.withPath('/some/between/article/')
        ),
        Nothing,
        'extra between are not matched'
    );

    t.deepEqual(
        Parser.string.slash.string.map(double).parse(
            URL.withPath('/some/article/')
        ),
        Just(double('some')('article')),
        'exact double strings are matched'
    );

    t.deepEqual(
        Parser.string.slash.s('between').slash.string.map(double).parse(
            URL.withPath('/some/wrong/article/')
        ),
        Nothing,
        'different between are not matched'
    );

    t.deepEqual(
        Parser.string.slash.s('between').slash.string.map(double).parse(
            URL.withPath('/some/between/article/')
        ),
        Just(double('some')('article')),
        'exact double strings with path between are matched'
    );

    t.deepEqual(
        Parser.string.slash.string.slash.string.map(tripple).parse(
            URL.withPath('/first/second/')
        ),
        Nothing,
        'too short for tripple is not matched'
    );

    t.deepEqual(
        Parser.string.slash.string.slash.string.map(tripple).parse(
            URL.withPath('/first/second/third/')
        ),
        Just(tripple('first')('second')('third')),
        'exact tripple strings are matched'
    );

    t.deepEqual(
        Parser.s('1')
        .slash.string
        .slash.s('2')
        .slash.string
        .slash.s('3')
        .slash.string
        .slash.s('4')
        .map(tripple).parse(
            URL.withPath('/1/first/2/second/3/third/4/')
        ),
        Just(tripple('first')('second')('third')),
        'exact tripple strings with paths between and around are matched'
    );
});
