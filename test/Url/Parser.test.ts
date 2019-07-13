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

const toDate = (str: string): Maybe<Date> => {
    const date = new Date(str);

    return isNaN(date.getTime()) ? Nothing : Just(date);
};

const dateToString = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
};

const toNonNegative = (str: string): Maybe<number> => {
    if (!/^[0-9]+$/.test(str)) {
        return Nothing;
    }

    const num = Number(str);

    return num < 0 ? Nothing : Just(num);
};

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

test('Parser.string', t => {
    const single = (first: string) => ({ first });

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/first/')
        ),
        Just(single('first')),
        'root string is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.string.map(single).parse(
            URL.withPath('/before/first/')
        ),
        Just(single('first')),
        'string with path before is matched'
    );
});

test('Parser.number', t => {
    const single = (first: number) => ({ first });

    t.deepEqual(
        Parser.number.map(single).parse(
            URL.withPath('/')
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.number.map(single).parse(
            URL.withPath('/string/')
        ),
        Nothing,
        'string is not matched'
    );

    t.deepEqual(
        Parser.number.map(single).parse(
            URL.withPath('/1.3/')
        ),
        Nothing,
        'float is not matched'
    );

    t.deepEqual(
        Parser.number.map(single).parse(
            URL.withPath('/314/')
        ),
        Just(single(314)),
        'root number is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.number.map(single).parse(
            URL.withPath('/before/42/')
        ),
        Just(single(42)),
        'number with path before is matched'
    );
});

test('Parser.oneOf', t => {
    t.deepEqual(
        Parser.oneOf([]).parse(
            URL.withPath('/')
        ),
        Nothing,
        'match nothing for empty parsers'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.s('first').map(1)
        ]).parse(
            URL.withPath('/')
        ),
        Nothing,
        'match nothing for single path'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.top.map(0)
        ]).parse(
            URL.withPath('/')
        ),
        Just(0),
        'match for single top'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.s('first').map(1)
        ]).parse(
            URL.withPath('/first/')
        ),
        Just(1),
        'match for single path'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.top.map(0),
            Parser.s('first').map(1)
        ]).parse(
            URL.withPath('/')
        ),
        Just(0),
        'match top parser'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.top.map(0),
            Parser.top.map(1)
        ]).parse(
            URL.withPath('/')
        ),
        Just(0),
        'match the first matched parser'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.top.map(0),
            Parser.s('first').map(1),
            Parser.s('first').slash.s('second').map(2),
            Parser.s('second').map(3)
        ]).parse(
            URL.withPath('/first/second/')
        ),
        Just(2),
        'match composed path'
    );

    t.deepEqual(
        Parser.s('before').slash.oneOf([
            Parser.top.map(0),
            Parser.s('first').map(1),
            Parser.s('first').slash.s('second').map(2),
            Parser.s('second').map(3)
        ]).parse(
            URL.withPath('/before/first/')
        ),
        Just(1),
        'match composed path with before'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.top.map(0),
            Parser.s('first').map(1),
            Parser.s('first').slash.s('second').map(2),
            Parser.s('second').map(3)
        ]).slash.s('after').parse(
            URL.withPath('/second/after/')
        ),
        Just(3),
        'match composed path with after'
    );

    t.deepEqual(
        Parser.s('before').slash.oneOf([
            Parser.top.map(0),
            Parser.s('first').map(1),
            Parser.s('first').slash.s('second').map(2),
            Parser.s('second').map(3)
        ]).slash.s('after').parse(
            URL.withPath('/before/first/second/after/')
        ),
        Just(2),
        'match composed path with around'
    );
});

test('Parser.oneOf real example', t => {
    interface Route {
        toPath(): string;
    }

    class ToHome implements Route {
        public static readonly inst: Route = new ToHome();

        private constructor() {}

        public toPath(): string {
            return '/';
        }
    }

    class ToProfile implements Route {
        public static readonly inst: Route = new ToProfile();

        private constructor() {}

        public toPath(): string {
            return '/profile';
        }
    }

    class ToArticle implements Route {
        public static cons(title: string): Route {
            return new ToArticle(title);
        }

        private constructor(private readonly title: string) {}

        public toPath(): string {
            return `/article/${this.title}`;
        }
    }

    class ToEvents implements Route {
        public static cons(date: Date): Route {
            return new ToEvents(date);
        }

        private constructor(private readonly date: Date) {}

        public toPath(): string {
            return `/events/${dateToString(this.date)}`;
        }
    }

    class ToEvent implements Route {
        public static cons = (date: Date) => (index: number): Route => {
            return new ToEvent(date, index);
        }

        private constructor(
            private readonly date: Date,
            private readonly index: number
        ) {}

        public toPath(): string {
            return `/events/${dateToString(this.date)}/${this.index}`;
        }
    }

    const parser = Parser.oneOf([
        Parser.top.map(ToHome.inst),
        Parser.s('profile').map(ToProfile.inst),
        Parser.s('article').slash.string.map(ToArticle.cons),
        Parser.s('events').slash.oneOf([
            Parser.custom(toDate).map(ToEvents.cons),
            Parser.custom(toDate).slash.custom(toNonNegative).map(ToEvent.cons)
        ])
    ]);

    t.deepEqual(
        URL.withPath('/unknown/').parse(parser),
        Nothing,
        '/unknown/ path is not matched'
    );

    t.deepEqual(
        URL.withPath('/').parse(parser),
        Just(ToHome.inst),
        '/ path is matched ToHome'
    );

    t.deepEqual(
        URL.withPath('/profile/').parse(parser),
        Just(ToProfile.inst),
        '/profile/ path is matched ToProfile'
    );

    t.deepEqual(
        URL.withPath('/article/article-id/').parse(parser),
        Just(ToArticle.cons('article-id')),
        '/article/{article-id}/ path is matched ToArticle'
    );

    t.deepEqual(
        URL.withPath('/events/invalid-date/').parse(parser),
        Nothing,
        '/events/invalid-date/ path is not matched'
    );

    t.deepEqual(
        URL.withPath('/events/10-02-2013/').parse(parser),
        Just(ToEvents.cons(new Date('10-02-2013'))),
        '/events/10-02-2013/ path is matched ToEvents'
    );

    t.deepEqual(
        URL.withPath('/events/invalid-date/1/').parse(parser),
        Nothing,
        '/events/invalid-date/1/ path is not matched'
    );

    t.deepEqual(
        URL.withPath('/events/10-02-2013/-1/').parse(parser),
        Nothing,
        '/events/10-02-2013/-1/ path is not matched'
    );

    t.deepEqual(
        URL.withPath('/events/10-02-2013/123/').parse(parser),
        Just(ToEvent.cons(new Date('10-02-2013'))(123)),
        '/events/10-02-2013/123/ path is matched ToEvent'
    );
});
