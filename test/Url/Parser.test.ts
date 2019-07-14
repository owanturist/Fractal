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

const parseDate = (str: string): Maybe<Date> => {
    const date = new Date(str);

    return isNaN(date.getTime()) ? Nothing : Just(date);
};

const parseDateQuery = (value: Maybe<string>): Maybe<Date> => value.chain(parseDate);

const parseDateQueries = (values: Array<string>): Array<Date> => {
    return Maybe.sequence(values.map(parseDate)).getOrElse([]);
};

const serializeDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
};

const parseNonNegative = (str: string): Maybe<number> => {
    if (!/^[0-9]+$/.test(str)) {
        return Nothing;
    }

    const num = Number(str);

    return num < 0 ? Nothing : Just(num);
};

const single = <T1>(_1: T1) => ({ _1 });
const double = <T1>(_1: T1) => <T2>(_2: T2) => ({ _1, _2 });
const tripple = <T1>(_1: T1) => <T2>(_2: T2) => <T3>(_3: T3) => ({ _1, _2, _3 });

test('Parser.top', t => {
    t.deepEqual(
        Parser.root.map(0).parse(
            URL.withPath('/profile')
        ),
        Nothing,
        'not empty path is not matched'
    );

    t.deepEqual(
        Parser.root.map(0).parse(
            URL
        ),
        Just(0),
        'empty path is matched'
    );
});

test('Parser.s', t => {
    t.deepEqual(
        Parser.s('single').map(0).parse(
            URL
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
    t.deepEqual(
        Parser.custom(parseDate).map(single).parse(
            URL
        ),
        Nothing,
        'empty single path is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).map(single).parse(
            URL.withPath('/02-33-2019/')
        ),
        Nothing,
        'invalid single is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).map(single).parse(
            URL.withPath('/09-10-2019/')
        ),
        Just({
            _1: new Date('09-10-2019')
        }),
        'single is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.custom(parseDate).map(single).parse(
            URL.withPath('/before/03-23-2019/')
        ),
        Just({
            _1: new Date('03-23-2019')
        }),
        'single with path before is matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.s('after').map(single).parse(
            URL.withPath('/10-02-2018/after/')
        ),
        Just({
            _1: new Date('10-02-2018')
        }),
        'single with path after is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.custom(parseDate).slash.s('after').map(single).parse(
            URL.withPath('/before/12-31-2020/after/')
        ),
        Just({
            _1: new Date('12-31-2020')
        }),
        'single with path around is matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).map(double).parse(
            URL.withPath('/some/')
        ),
        Nothing,
        'short invalid double is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).map(double).parse(
            URL.withPath('/12-31-2020/')
        ),
        Nothing,
        'short valid double is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).map(double).parse(
            URL.withPath('/10-01-2013/between/10-01-2014/')
        ),
        Nothing,
        'extra between double is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).map(double).parse(
            URL.withPath('/10-01-2013/10-01-2020/')
        ),
        Just({
            _1: new Date('10-01-2013'),
            _2: new Date('10-01-2020')
        }),
        'double is matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.s('between').slash.custom(parseDate).map(double).parse(
            URL.withPath('/10-01-2013/wrong/10-01-2020/')
        ),
        Nothing,
        'different between is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.s('between').slash.custom(parseDate).map(double).parse(
            URL.withPath('/10-01-2013/between/10-01-2020/')
        ),
        Just({
            _1: new Date('10-01-2013'),
            _2: new Date('10-01-2020')
        }),
        'double with path between is matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).slash.custom(parseDate).map(tripple).parse(
            URL.withPath('/10-01-2013/10-01-2020/')
        ),
        Nothing,
        'short tripple is not matched'
    );

    t.deepEqual(
        Parser.custom(parseDate).slash.custom(parseDate).slash.custom(parseDate).map(tripple).parse(
            URL.withPath('/10-01-2013/10-01-2020/10-01-2027/')
        ),
        Just({
            _1: new Date('10-01-2013'),
            _2: new Date('10-01-2020'),
            _3: new Date('10-01-2027')
        }),
        'tripple is matched'
    );

    t.deepEqual(
        Parser.s('first')
        .slash.custom(parseDate)
        .slash.s('second')
        .slash.custom(parseDate)
        .slash.s('third')
        .slash.custom(parseDate)
        .slash.s('fourth')
        .map(tripple).parse(
            URL.withPath('/first/10-01-2013/second/10-01-2020/third/10-01-2027/fourth/')
        ),
        Just({
            _1: new Date('10-01-2013'),
            _2: new Date('10-01-2020'),
            _3: new Date('10-01-2027')
        }),
        'tripple with paths between and around is matched'
    );
});

test('Parser.string', t => {
    t.deepEqual(
        Parser.string.map(single).parse(
            URL
        ),
        Nothing,
        'empty path is not matched'
    );

    t.deepEqual(
        Parser.string.map(single).parse(
            URL.withPath('/first/')
        ),
        Just({
            _1: 'first'
        }),
        'root string is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.string.map(single).parse(
            URL.withPath('/before/first/')
        ),
        Just({
            _1: 'first'
        }),
        'string with path before is matched'
    );
});

test('Parser.number', t => {
    t.deepEqual(
        Parser.number.map(single).parse(
            URL
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
        Just({
            _1: 314
        }),
        'root number is matched'
    );

    t.deepEqual(
        Parser.s('before').slash.number.map(single).parse(
            URL.withPath('/before/42/')
        ),
        Just({
            _1: 42
        }),
        'number with path before is matched'
    );
});

test('Parser.oneOf', t => {
    t.deepEqual(
        Parser.oneOf([]).parse(
            URL
        ),
        Nothing,
        'match nothing for empty parsers'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.s('first').map(1)
        ]).parse(
            URL
        ),
        Nothing,
        'match nothing for single path'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.root.map(0)
        ]).parse(
            URL
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
            Parser.root.map(0),
            Parser.s('first').map(1)
        ]).parse(
            URL
        ),
        Just(0),
        'match top parser'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.root.map(0),
            Parser.root.map(1)
        ]).parse(
            URL
        ),
        Just(0),
        'match the first matched parser'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.root.map(0),
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
            Parser.root.map(0),
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
            Parser.root.map(0),
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
            Parser.root.map(0),
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

test('Parser.fragment', t => {
    const parseArrayOfStrings = (value: Maybe<string>): Array<string> => {
        return value.map(str => str.split(',')).getOrElse([ 'null' ]);
    };

    t.deepEqual(
        Parser.root
        .fragment(parseArrayOfStrings)
        .map(single).parse(URL),
        Just({
            _1: [ 'null' ]
        }),
        'empty fragment is matched as [ null ]'
    );

    t.deepEqual(
        Parser.root
        .fragment(parseArrayOfStrings)
        .map(single).parse(
            URL.withFragment('first,second')
        ),
        Just({
            _1: [ 'first', 'second' ]
        }),
        'not empty fragment is matched properly'
    );

    t.deepEqual(
        Parser.root
        .fragment(parseArrayOfStrings)
        .fragment(parseArrayOfStrings)
        .map(double).parse(
            URL.withFragment('first,second')
        ),
        Just({
            _1: [ 'first', 'second' ],
            _2: [ 'null' ]
        }),
        'double matching is prevented'
    );


    t.deepEqual(
        Parser.oneOf([
            Parser.root.fragment(parseArrayOfStrings).map(single),
            Parser.s('before').fragment(parseArrayOfStrings).map(single)
        ]).parse(
            URL.withPath('/before/').withFragment('first,second')
        ),
        Just({
            _1: [ 'first', 'second' ]
        }),
        'does not omit not passed fragment'
    );
});

test('Parser.query.custom', t => {
    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL
        ),
        Just({
            _1: Nothing
        }),
        'empty query string is not matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('to=10-02-2014')
        ),
        Just({
            _1: Nothing
        }),
        'empty requested query is not matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('from=10-33-2014')
        ),
        Just({
            _1: Nothing
        }),
        'single invalid requested query is not matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('from=10-02-2014&from=09-01-2013')
        ),
        Just({
            _1: Nothing
        }),
        'multiple valid requested query is not matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('from=10-02-2014')
        ),
        Just({
            _1: Just(new Date('10-02-2014'))
        }),
        'single valid requested query is matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('q=event&from=10-02-2014&to=10-02-2015')
        ),
        Just({
            _1: Just(new Date('10-02-2014'))
        }),
        'single valid requested query from multiple is matched'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withQuery('from=10-02-2014')
        ),
        Nothing,
        'different before single valid requested query is not matched'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withPath('/before/').withQuery('from=10-33-2014')
        ),
        Just({
            _1: Nothing
        }),
        'exact before single invalid requested query is not matched'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').custom(parseDateQuery)
        .map(single).parse(
            URL.withPath('/before/').withQuery('from=10-20-2014')
        ),
        Just({
            _1: Just(new Date('10-20-2014'))
        }),
        'exact before single valid requested query is matched'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .query('from').custom(parseDateQuery)
        .map(double).parse(
            URL.withQuery('q=event&from=10-02-2014&to=10-02-2015')
        ),
        Just({
            _1: Just(new Date('10-02-2014')),
            _2: Nothing
        }),
        'second valid matching is not applying'
    );

    t.deepEqual(
        Parser.root
        .query('from').custom(parseDateQuery)
        .query('to').custom(parseDateQuery)
        .query('current').custom(parseDateQuery)
        .map(tripple).parse(
            URL.withQuery('q=event&from=10-02-2014&current=10-08-2014&to=10-02-2015')
        ),
        Just({
            _1: Just(new Date('10-02-2014')),
            _2: Just(new Date('10-02-2015')),
            _3: Just(new Date('10-08-2014'))
        }),
        'tripple valid queries'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.root.query('from').custom(parseDateQuery).map(single),
            Parser.s('before').query('from').custom(parseDateQuery).map(single)
        ]).parse(
            URL.withPath('/before/').withQuery('from=10-02-2014')
        ),
        Just({
            _1: Just(new Date('10-02-2014'))
        }),
        'does not omit not passed query'
    );

    t.deepEqual(
        Parser.s('root')
        .query('from').custom(parseDateQuery)
        .slash.s('id')
        .slash.number
        .query('to').custom(parseDateQuery)
        .query('current').custom(parseDateQuery)
        .slash.s('name')
        .slash.string
        .map(_1 => _2 => _3 => _4 => _5 => ({ _1, _2, _3, _4, _5 }))
        .parse(
            URL.withPath('/root/id/1/name/ivan/')
                .withQuery('q=event&from=10-02-2014&current=10-08-2014&to=10-02-2015')
        ),
        Just({
            _1: Just(new Date('10-02-2014')),
            _2: 1,
            _3: Just(new Date('10-02-2015')),
            _4: Just(new Date('10-08-2014')),
            _5: 'ivan'
        }),
        'tripple valid queries mixed with paths and matchers'
    );
});

test('Parser.query.string', t => {
    t.deepEqual(
        Parser.root.query('q').string.map(single).parse(
            URL
        ),
        Just({
            _1: Nothing
        }),
        'empty query is not matched'
    );

    t.deepEqual(
        Parser.root.query('q').string.map(single).parse(
            URL.withQuery('q=search&q=something')
        ),
        Just({
            _1: Nothing
        }),
        'multiple query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('q').string.map(single).parse(
            URL.withQuery('q=search')
        ),
        Nothing,
        'not exact path with single query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('q').string.map(single).parse(
            URL.withPath('/before/').withQuery('q=search')
        ),
        Just({
            _1: Just('search')
        }),
        'exact path with single query is matched'
    );
});

test('Parser.query.number', t => {
    t.deepEqual(
        Parser.root.query('n').number.map(single).parse(
            URL
        ),
        Just({
            _1: Nothing
        }),
        'empty query is not matched'
    );

    t.deepEqual(
        Parser.root.query('n').number.map(single).parse(
            URL.withQuery('n=1&n=23')
        ),
        Just({
            _1: Nothing
        }),
        'multiple query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('n').number.map(single).parse(
            URL.withQuery('q=31')
        ),
        Nothing,
        'not exact path with single query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('n').number.map(single).parse(
            URL.withPath('/before/').withQuery('n=null')
        ),
        Just({
            _1: Nothing
        }),
        'path with single invalid query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('n').number.map(single).parse(
            URL.withPath('/before/').withQuery('n=42')
        ),
        Just({
            _1: Just(42)
        }),
        'exact path with single query is matched'
    );
});

test('Parser.query.enum', t => {
    t.deepEqual(
        Parser.root.query('start').enum([]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: Nothing
        }),
        'empty variants is not matched'
    );

    t.deepEqual(
        Parser.root.query('start').enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL
        ),
        Just({
            _1: Nothing
        }),
        'empty query is not matched'
    );

    t.deepEqual(
        Parser.root.query('start').enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second&start=first')
        ),
        Just({
            _1: Nothing
        }),
        'multiple valid variants are not matched'
    );

    t.deepEqual(
        Parser.root.query('start').enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=zero')
        ),
        Just({
            _1: Nothing
        }),
        'single invalid variant is not matched'
    );

    t.deepEqual(
        Parser.root.query('start').enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: Just(new Date('02-02-2002'))
        }),
        'single valid variant is matched'
    );

    t.deepEqual(
        Parser.root.query('start').enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'second', new Date('02-02-2012') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: Just(new Date('02-02-2012'))
        }),
        'latest valid single variant is matched'
    );
});

test('Parser.query.boolean', t => {
    t.deepEqual(
        Parser.root.query('checked').boolean.map(single).parse(
            URL
        ),
        Just({
            _1: Nothing
        }),
        'empty query string is not matched'
    );

    t.deepEqual(
        Parser.root.query('checked').boolean.map(single).parse(
            URL.withQuery('checked=notbool')
        ),
        Just({
            _1: Nothing
        }),
        'invalid single query is not matched'
    );

    t.deepEqual(
        Parser.root.query('checked').boolean.map(single).parse(
            URL.withQuery('checked=false&checked=true')
        ),
        Just({
            _1: Nothing
        }),
        'valid multiple queries are not matched'
    );

    t.deepEqual(
        Parser.root.query('checked').boolean.map(single).parse(
            URL.withQuery('checked=false')
        ),
        Just({
            _1: Just(false)
        }),
        'valid false is matched'
    );

    t.deepEqual(
        Parser.root.query('checked').boolean.map(single).parse(
            URL.withQuery('checked=true')
        ),
        Just({
            _1: Just(true)
        }),
        'valid true is matched'
    );

    t.deepEqual(
        Parser.root
        .query('checked').boolean
        .query('disabled').boolean
        .map(double).parse(
            URL.withQuery('checked=true&disabled=false')
        ),
        Just({
            _1: Just(true),
            _2: Just(false)
        }),
        'valid double queries are matched'
    );
});

test('Parser.query.list.custom', t => {
    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL
        ),
        Just({
            _1: []
        }),
        'empty query string is matched as empty array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('to=10-02-2014')
        ),
        Just({
            _1: []
        }),
        'empty requested query is matched as empty array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('from=10-33-2014')
        ),
        Just({
            _1: []
        }),
        'single invalid requested query is matched as empty array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('from=10-02-2014')
        ),
        Just({
            _1: [ new Date('10-02-2014') ]
        }),
        'single valid requested query is matched as singleton array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('from=10-02-2014&from=09-01-2013')
        ),
        Just({
            _1: [ new Date('10-02-2014'), new Date('09-01-2013') ]
        }),
        'multiple valid requested query is matched as multiple array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('q=event&from=10-02-2014&to=10-02-2015')
        ),
        Just({
            _1: [ new Date('10-02-2014') ]
        }),
        'single valid requested query from multiple is matched as singleton array'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withQuery('from=10-02-2014')
        ),
        Nothing,
        'different before single valid requested query is not matched'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withPath('/before/').withQuery('from=10-33-2014')
        ),
        Just({
            _1: []
        }),
        'exact before single invalid requested query is matched as empty array'
    );

    t.deepEqual(
        Parser.s('before')
        .query('from').list.custom(parseDateQueries)
        .map(single).parse(
            URL.withPath('/before/').withQuery('from=10-20-2014')
        ),
        Just({
            _1: [ new Date('10-20-2014') ]
        }),
        'exact before single valid requested query is matched as singleton array'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .query('from').list.custom(parseDateQueries)
        .map(double).parse(
            URL.withQuery('q=event&from=10-02-2014&to=10-02-2015')
        ),
        Just({
            _1: [ new Date('10-02-2014') ],
            _2: []
        }),
        'second valid matching is not applying'
    );

    t.deepEqual(
        Parser.root
        .query('from').list.custom(parseDateQueries)
        .query('to').list.custom(parseDateQueries)
        .query('current').list.custom(parseDateQueries)
        .map(tripple).parse(
            URL.withQuery('q=event&from=10-02-2014&current=10-08-2014&to=10-02-2015')
        ),
        Just({
            _1: [ new Date('10-02-2014') ],
            _2: [ new Date('10-02-2015') ],
            _3: [ new Date('10-08-2014') ]
        }),
        'tripple valid queries'
    );

    t.deepEqual(
        Parser.oneOf([
            Parser.root.query('from').list.custom(parseDateQueries).map(single),
            Parser.s('before').query('from').list.custom(parseDateQueries).map(single)
        ]).parse(
            URL.withPath('/before/').withQuery('from=10-02-2014')
        ),
        Just({
            _1: [ new Date('10-02-2014') ]
        }),
        'does not omit not passed query'
    );

    t.deepEqual(
        Parser.s('root')
        .query('from').list.custom(parseDateQueries)
        .slash.s('id')
        .slash.number
        .query('to').list.custom(parseDateQueries)
        .query('current').list.custom(parseDateQueries)
        .slash.s('name')
        .slash.string
        .map(_1 => _2 => _3 => _4 => _5 => ({ _1, _2, _3, _4, _5 }))
        .parse(
            URL.withPath('/root/id/1/name/ivan/')
                .withQuery('q=event&from=10-02-2014&current=10-08-2014&to=10-02-2015')
        ),
        Just({
            _1: [ new Date('10-02-2014') ],
            _2: 1,
            _3: [ new Date('10-02-2015') ],
            _4: [ new Date('10-08-2014') ],
            _5: 'ivan'
        }),
        'tripple valid queries mixed with paths and matchers'
    );
});

test('Parser.query.list.string', t => {
    t.deepEqual(
        Parser.root.query('q').list.string.map(single).parse(
            URL
        ),
        Just({
            _1: []
        }),
        'empty query is matched as empty array'
    );

    t.deepEqual(
        Parser.root.query('q').list.string.map(single).parse(
            URL.withQuery('q=search&q=something')
        ),
        Just({
            _1: [ 'search', 'something' ]
        }),
        'multiple query is matched as multiple array'
    );

    t.deepEqual(
        Parser.s('before').query('q').list.string.map(single).parse(
            URL.withQuery('q=search')
        ),
        Nothing,
        'not exact path with single query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('q').list.string.map(single).parse(
            URL.withPath('/before/').withQuery('q=search')
        ),
        Just({
            _1: [ 'search' ]
        }),
        'exact path with single query is matched as single array'
    );
});

test('Parser.query.list.number', t => {
    t.deepEqual(
        Parser.root.query('n').list.number.map(single).parse(URL),
        Just({
            _1: []
        }),
        'empty query is matched as empty array'
    );

    t.deepEqual(
        Parser.root.query('n').list.number.map(single).parse(
            URL.withQuery('n=1&n=23')
        ),
        Just({
            _1: [ 1, 23 ]
        }),
        'multiple query is matched as multiple array'
    );

    t.deepEqual(
        Parser.s('before').query('n').list.number.map(single).parse(
            URL.withQuery('q=31')
        ),
        Nothing,
        'not exact path with single query is not matched'
    );

    t.deepEqual(
        Parser.s('before').query('n').list.number.map(single).parse(
            URL.withPath('/before/').withQuery('n=null')
        ),
        Just({
            _1: []
        }),
        'path with single invalid query is matched as empty array'
    );

    t.deepEqual(
        Parser.s('before').query('n').list.number.map(single).parse(
            URL.withPath('/before/').withQuery('n=42')
        ),
        Just({
            _1: [ 42 ]
        }),
        'exact path with single query is matched as singleton array'
    );
});

test('Parser.query.list.enum', t => {
    t.deepEqual(
        Parser.root.query('start').list.enum([]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: []
        }),
        'empty variants is matched as empty list'
    );

    t.deepEqual(
        Parser.root.query('start').list.enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL
        ),
        Just({
            _1: []
        }),
        'empty query is matched as empty list'
    );

    t.deepEqual(
        Parser.root.query('start').list.enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second&start=first')
        ),
        Just({
            _1: [ new Date('02-02-2002'), new Date('01-01-2001') ]
        }),
        'multiple valid variants are matched as multiple array'
    );

    t.deepEqual(
        Parser.root.query('start').list.enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=zero')
        ),
        Just({
            _1: []
        }),
        'single invalid variant is matched as empty array'
    );

    t.deepEqual(
        Parser.root.query('start').list.enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: [ new Date('02-02-2002') ]
        }),
        'single valid variant is matched as singleton array'
    );

    t.deepEqual(
        Parser.root.query('start').list.enum([
            [ 'first', new Date('01-01-2001') ],
            [ 'second', new Date('02-02-2002') ],
            [ 'second', new Date('02-02-2012') ],
            [ 'third', new Date('03-03-2003') ]
        ]).map(single).parse(
            URL.withQuery('start=second')
        ),
        Just({
            _1: [ new Date('02-02-2012') ]
        }),
        'latest valid single variant is matched as single array'
    );
});

test('Parser.query.list.boolean', t => {
    t.deepEqual(
        Parser.root.query('checked').list.boolean.map(single).parse(
            URL
        ),
        Just({
            _1: []
        }),
        'empty query string is matched as empty array'
    );

    t.deepEqual(
        Parser.root.query('checked').list.boolean.map(single).parse(
            URL.withQuery('checked=notbool')
        ),
        Just({
            _1: []
        }),
        'invalid single query is matched as empty array'
    );

    t.deepEqual(
        Parser.root.query('checked').list.boolean.map(single).parse(
            URL.withQuery('checked=false&checked=true')
        ),
        Just({
            _1: [ false, true ]
        }),
        'valid multiple queries are matched as multiple array'
    );

    t.deepEqual(
        Parser.root.query('checked').list.boolean.map(single).parse(
            URL.withQuery('checked=false')
        ),
        Just({
            _1: [ false ]
        }),
        'valid single false is matched as single array'
    );

    t.deepEqual(
        Parser.root.query('checked').list.boolean.map(single).parse(
            URL.withQuery('checked=true')
        ),
        Just({
            _1: [ true ]
        }),
        'valid single true is matched as single array'
    );

    t.deepEqual(
        Parser.root
        .query('checked').list.boolean
        .query('disabled').list.boolean
        .map(double).parse(
            URL.withQuery('checked=true&disabled=false')
        ),
        Just({
            _1: [ true ],
            _2: [ false ]
        }),
        'valid double single queries are matched as double singleton arrays'
    );
});

test('Real example', t => {
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
            return `/events/${serializeDate(this.date)}`;
        }
    }

    class ToEvent implements Route {
        public static cons = (date: Date, index: number): Route => {
            return new ToEvent(date, index);
        }

        private constructor(
            private readonly date: Date,
            private readonly index: number
        ) {}

        public toPath(): string {
            return `/events/${serializeDate(this.date)}/${this.index}`;
        }
    }

    const parser = Parser.oneOf([
        Parser.root.map(ToHome.inst),
        Parser.s('profile').map(ToProfile.inst),
        Parser.s('article').slash.string.map(ToArticle.cons),
        Parser.s('events').slash.oneOf([
            Parser.custom(parseDate).map(ToEvents.cons),
            Parser.custom(parseDate).slash.custom(parseNonNegative).map(date => index => ToEvent.cons(date, index))
        ])
    ]);

    t.deepEqual(
        URL.withPath('/unknown/').parse(parser),
        Nothing,
        '/unknown/ path is not matched'
    );

    t.deepEqual(
        URL.parse(parser),
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
        Just(ToEvent.cons(new Date('10-02-2013'), 123)),
        '/events/10-02-2013/123/ path is matched ToEvent'
    );
});
