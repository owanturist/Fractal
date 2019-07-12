import test from 'ava';

import {
    Maybe,
    Nothing,
    Just
} from '../../src/Maybe';
import {
    Url
} from '../../src/Url';
import {
    Parser
} from '../../src/Url/Parser';

const URL = Url.cons(Url.Https, 'fake.com');

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
        Parser.s('single').map(0).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL.withPath('/path/')
        ),
        Nothing,
        'different single path is not matched'
    );

    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL.withPath('/before/single/')
        ),
        Nothing,
        'extra before is not matched'
    );

    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL.withPath('/single/after/')
        ),
        Nothing,
        'extra after is not matched'
    );

    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL.withPath('/before/single/after/')
        ),
        Nothing,
        'extra around is not matched'
    );

    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL.withPath('/single/')
        ),
        Just(0),
        'exact single path is matched'
    );

    t.deepEqual(
        Parser.s('first').slash.s('second').map(0).parse(
            URL.withPath('/first/between/second')
        ),
        Nothing,
        'extra between is not matched'
    );

    t.deepEqual(
        Parser.s('first').slash.s('second').map(0).parse(
            URL.withPath('/first/second/')
        ),
        Just(0),
        'exact multiple path is matched'
    );

    t.deepEqual(
        Parser.s('first').slash.s('second').slash.s('third').map(0).parse(
            URL.withPath('/first/second/third/')
        ),
        Just(0),
        'exact long path is matched'
    );
});

test('Parser.custom', t => {
    const toDate = (str: string): Maybe<Date> => {
        const date = new Date(str);

        return isNaN(date.getTime()) ? Nothing : Just(date);
    };

    const single = (first: Date) => ({ first });
    const double = (first: Date) => (second: Date) => ({ first, second });
    const tripple = (first: Date) => (second: Date) => (third: Date) => ({ first, second, third });

    t.deepEqual(
        Parser.custom(toDate).map(single).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty single path is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).map(single).parse(
            URL.withPath('/02-33-2019/')
        ),
        Nothing,
        'invalid single is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).map(single).parse(
            URL.withPath('/09-10-2019/')
        ),
        Just(single(new Date('09-10-2019'))),
        'single is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.custom(toDate).map(single).parse(
            URL.withPath('/before/03-23-2019/')
        ),
        Just(single(new Date('03-23-2019'))),
        'single with path before is matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.s('after').map(single).parse(
            URL.withPath('/10-02-2018/after/')
        ),
        Just(single(new Date('10-02-2018'))),
        'single with path after is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.custom(toDate).slash.s('after').map(single).parse(
            URL.withPath('/before/12-31-2020/after/')
        ),
        Just(single(new Date('12-31-2020'))),
        'single with path around is matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).map(double).parse(
            URL.withPath('/some/')
        ),
        Nothing,
        'short invalid double is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).map(double).parse(
            URL.withPath('/12-31-2020/')
        ),
        Nothing,
        'short valid double is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).map(double).parse(
            URL.withPath('/10-01-2013/between/10-01-2014/')
        ),
        Nothing,
        'extra between double is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).map(double).parse(
            URL.withPath('/10-01-2013/10-01-2020/')
        ),
        Just(double(new Date('10-01-2013'))(new Date('10-01-2020'))),
        'double is matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.s('between').slash.custom(toDate).map(double).parse(
            URL.withPath('/10-01-2013/wrong/10-01-2020/')
        ),
        Nothing,
        'different between is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.s('between').slash.custom(toDate).map(double).parse(
            URL.withPath('/10-01-2013/between/10-01-2020/')
        ),
        Just(double(new Date('10-01-2013'))(new Date('10-01-2020'))),
        'double with path between is matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).slash.custom(toDate).map(tripple).parse(
            URL.withPath('/10-01-2013/10-01-2020/')
        ),
        Nothing,
        'short tripple is not matched'
    );

    t.deepEqual(
        Parser.custom(toDate).slash.custom(toDate).slash.custom(toDate).map(tripple).parse(
            URL.withPath('/10-01-2013/10-01-2020/10-01-2027/')
        ),
        Just(tripple(new Date('10-01-2013'))(new Date('10-01-2020'))(new Date('10-01-2027'))),
        'tripple is matched'
    );

    t.deepEqual(
        Parser.s('first')
        .slash.custom(toDate)
        .slash.s('second')
        .slash.custom(toDate)
        .slash.s('third')
        .slash.custom(toDate)
        .slash.s('fourth')
        .map(tripple).parse(
            URL.withPath('/first/10-01-2013/second/10-01-2020/third/10-01-2027/fourth/')
        ),
        Just(tripple(new Date('10-01-2013'))(new Date('10-01-2020'))(new Date('10-01-2027'))),
        'tripple with paths between and around is matched'
    );
});
