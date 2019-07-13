import {
    Url
} from './index';
import {
    Maybe,
    Nothing,
    Just
} from '../Maybe';

export const debug = <T>(msg: string) => <R>(value: T & R) => {
    // tslint:disable-next-line:no-console
    console.log(msg, value);

    return value;
};

interface Params {
    readonly [ key: string ]: Array<string>;
}

interface State<T> {
    readonly unvisited: Array<string>;
    readonly queries: Params;
    readonly fragment: Maybe<string>;
    readonly value: T;
}

const identity = <T>(value: T): T => value;

const mapState = <T, R>(fn: (value: T) => R, { unvisited, queries, fragment, value }: State<T>): State<R> => ({
    unvisited,
    queries,
    fragment,
    value: fn(value)
});

const first = <T>(arr: Array<T>): Maybe<T> => Maybe.fromNullable(arr[ 0 ]);
const rest = <T>(arr: Array<T>): Array<T> => arr.slice(1);
const concatMap = <T, R>(fn: (value: T) => Array<R>, arr: Array<T>): Array<R> => {
    const acc: Array<R> = [];

    for (const value of arr) {
        acc.push(...fn(value));
    }

    return acc;
};

export class Parser<T> {
    public static top: Parser<unknown> = new Parser(state => [ state ]);

    public static get string(): Chainable<(value: string) => unknown> {
        return new SlashImpl(Parser.top).string;
    }

    public static get number(): Chainable<(value: number) => unknown> {
        return new SlashImpl(Parser.top).number;
    }

    public static custom<T>(converter: (str: string) => Maybe<T>): Chainable<(value: T) => unknown> {
        return new SlashImpl(Parser.top).custom(converter);
    }

    public static s<T>(path: string): Chainable<T> {
        return new SlashImpl<T>(Parser.top).s(path);
    }

    public static oneOf<T>(parsers: Array<Parser<T>>): Chainable<T> {
        return new SlashImpl(Parser.top).oneOf(parsers);
    }

    protected static prepareUnvisited(path: string): Array<string> {
        return path.replace(/(^\/|\/$)/g, '')
            .split('/')
            .filter(p => p !== '');
    }

    protected static prepareQuery(query: string): Params {
        const acc: { [key: string]: Array<string> } = {};

        for (const pair of query.split('&')) {
            const [ key, value ] = pair.split('=');

            if (key && value) {
                const values = acc[ key ];

                if (typeof values === 'undefined') {
                    acc[ key ] = [ value ];
                } else {
                    values.push(value);
                }
            }
        }

        return acc;
    }

    protected static dive<T>(parser: Parser<T>, state: State<T>): Array<State<unknown>> {
        return parser.fn(state);
    }

    protected constructor(
        private readonly fn: (state: State<T>) => Array<State<unknown>>
    ) {}

    public map<R>(tagger: FN<T, R>): Parser<(value: R) => unknown> {
        return new Parser(({ unvisited, queries, fragment, value }: State<(value: R) => T>): Array<State<T>> => {
            return this.fn({
                unvisited,
                queries,
                fragment,
                value: tagger as unknown as T
            }).map((state: State<R>): State<T> => mapState(value, state));
        });
    }

    public parse<R extends FA<T>>(url: Url): Maybe<R> {
        const states = this.fn({
            unvisited: Parser.prepareUnvisited(url.path),
            queries: Parser.prepareQuery(url.query.getOrElse('')),
            fragment: url.fragment,
            value: identity as unknown as T
        });

        for (const state of states) {
            if (state.unvisited.length === 0) {
                return Just(state.value as R);
            }
        }

        return Nothing;
    }
}

export interface Chainable<T> extends Parser<T> {
    slash: Slash<T>;
}

class ChainableImpl<T> extends Parser<T> implements Chainable<T>  {
    public static dive<T>(parser: Parser<T>, state: State<T>): Array<State<unknown>> {
        return super.dive(parser, state);
    }

    public constructor(fn: (state: State<T>) => Array<State<unknown>>) {
        super(fn);
    }

    public get slash(): Slash<T> {
        return new SlashImpl(this);
    }
}

export interface Slash<T> {
    string: Chainable<FF<T, (value: string) => unknown>>;
    number: Chainable<FF<T, (value: number) => unknown>>;
    s(path: string): Chainable<T>;
    custom<R>(converter: (str: string) => Maybe<R>): Chainable<FF<T, (value: R) => unknown>>;
    oneOf<R>(parsers: Array<Parser<R>>): Chainable<FF<T, R>>;
}

class SlashImpl<T> implements Slash<T> {
    public constructor(private readonly parser: Parser<T>) {}

    public get string(): Chainable<FF<T, (value: string) => unknown>> {
        return this.custom(Just);
    }

    public get number(): Chainable<FF<T, (value: number) => unknown>> {
        return this.custom(str => /^[0-9]+$/.test(str) ? Just(Number(str)) : Nothing);
    }

    public s(path: string): Chainable<T> {
        return this.next(({ unvisited, queries, fragment, value }: State<T>) => first(unvisited).cata({
            Nothing: () => [],

            Just: str => str !== path ? [] : [{
                unvisited: rest(unvisited),
                queries,
                fragment,
                value
            }]
        }));
    }

    public custom<R>(converter: (str: string) => Maybe<R>): Chainable<FF<T, (value: R) => unknown>> {
        return this.next(({ unvisited, queries, fragment, value }) => {
            return first(unvisited).chain(converter).cata({
                Nothing: () => [],

                Just: (converted: any): any => [{
                    unvisited: rest(unvisited),
                    queries,
                    fragment,
                    value: (value as any)(converted)
                }]
            });
        }) as any;
    }

    public oneOf<R>(parsers: Array<Parser<R>>): Chainable<FF<T, R>> {
        return this.next(state => concatMap(
            (parser): any => ChainableImpl.dive(parser, state),
            parsers
        )) as any;
    }

    private next<R>(fn: (state: State<R>) => Array<State<T>>): Chainable<T> {
        return new ChainableImpl(state => {
            return concatMap(fn, ChainableImpl.dive(this.parser, state));
        });
    }
}

type FA<F> = F extends (value: infer A) => unknown ? A : unknown;

type FF<F, R> = F extends (value: infer A) => infer N
    ? (value: A) => FF<N, R>
    : R;

type FN<F, R> = F extends (arg0: infer A0) => infer F1
    ? (arg0: A0) => F1 extends (arg1: infer A1) => infer F2
    ? (arg1: A1) => F2 extends (arg2: infer A2) => infer F3
    ? (arg2: A2) => F3 extends (arg3: infer A3) => infer F4
    ? (arg3: A3) => F4 extends (arg4: infer A4) => infer F5
    ? (arg4: A4) => F5 extends (arg5: infer A5) => infer F6
    ? (arg5: A5) => F6 extends (arg6: infer A6) => infer F7
    ? (arg6: A6) => F7 extends (arg7: infer A7) => infer F8
    ? (arg7: A7) => F8 extends (arg8: infer A8) => infer F9
    ? (arg8: A8) => F9 extends (arg9: infer A9) => infer F10
    ? (arg9: A9) => F10 extends (arg10: infer A10) => infer F11
    ? (arg10: A10) => F11 extends (arg11: infer A11) => infer F12
    ? (arg11: A11) => F12 extends (arg12: infer A12) => infer F13
    ? (arg12: A12) => F13 extends (arg13: infer A13) => infer F14
    ? (arg13: A13) => F14 extends (arg14: infer A14) => infer F15
    ? (arg14: A14) => F15 extends (arg15: infer A15) => infer F16
    ? (arg15: A15) => F16 extends (arg16: infer A16) => infer F17
    ? (arg16: A16) => F17 extends (arg17: infer A17) => infer F18
    ? (arg17: A17) => F18 extends (arg18: infer A18) => infer F19
    ? (arg18: A18) => F19 extends (arg19: infer A19) => infer F20
    ? (arg19: A19) => FN<F20, R> // it doesn't work properly but let's keep it here
    : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R;
/*

class Route {
    public foo() {
        throw new Error();
    }

    public bar() {
        throw new Error();
    }
}

const Home: Route = new Route();
const Profile: Route = new Route();
const Article = (_id: number): Route => new Route();
const Comment = (_id: number) => (_p: string): Route => new Route();
const Search = (_q: string) => (_p: number): Route => new Route();
const Post = (_q: string) => (_p: Date): Route => new Route();

const toDate = (str: string): Maybe<Date> => str === '' ? Nothing : Just(new Date(str));

export const test1n1 = Parser.top.map(Home);

export const test1n2 = Parser.s('article').slash.number.map(Article);

export const test1n3 = Parser.s('article')
    .slash.number
    .slash.s('comment')
    .slash.string
    .map(Comment);

export const test1n4 = Parser.custom(toDate);

export const test1n5 = Parser.s('post')
    .slash.string
    .slash.custom(toDate)
    .map(Post);

export const test1n6 = Parser.s('hi').slash.number.slash.oneOf([
    Parser.top.map(Home),
    Parser.number.map(Article)
]);

export const test2n1 = Parser.oneOf([
    Parser.top.map(Home),
    Parser.s('profile').map(Profile),
    Parser.s('article').slash.number.map(Article),
    Parser.s('article').slash.number.slash.string.map(Comment),
    Parser.s('search').slash.string.slash.number.map(Search),
    test1n5
]);

export const test3n1 = Parser.number.slash.string.parse(1 as any);

export const test3n2 = test2n1.parse(1 as any);

export const test1 = Parser.top.map(Home);
export const test2 = Parser.s('search').slash.number.slash.string.map(Comment);
export const test3 = Parser.s('foo').slash.number.slash.s('bar').map(Article);
export const test4 = Parser.s('foo').map(Home);
export const test5 = Parser.s('foo')
    .slash.string
    .slash.s('asd')
    .slash.number
    .map(Search);


export const test50 = Parser.top.query('dsa').boolean.parse(1 as any as Url);

export const test501 = Parser.number.slash.string.map(Comment);

export const test51 = Parser
    .s('base')
    .slash.number
    .query('q1').number
    .query('q2').boolean
    .query('q3').list.boolean
    .query('q4').custom(val => val)
    .query('q44').list.custom(val => val)
    .query('q4').enum([
        [ 'false', false ],
        [ 'true', true ]
    ])
    .query('q5').list.enum([
        [ 'false', false ],
        [ 'true', true ]
    ])
    .slash.number
    .slash.s('hi')
    .slash.string
    ;

export const test10 = Parser.oneOf([
    Parser.top.map(Home),
    Parser.top.query('hi').number.map(a => Article(a.getOrElse(0))),
    Parser.top.fragment(a => parseInt(a.getOrElse(''), 10)).map(Article),
    Parser.s('profile').map(Profile),
    Parser.s('article').slash.number.map(Article),
    Parser.s('article').slash.number.slash.s('comment').slash.string.map(Comment),
    Parser.s('search').slash.string.slash.number.map(Search),
    Parser.s('post').slash.string.slash.custom(str => str === '' ? Nothing : Just(new Date())).map(Post),
    Parser.s('hi').slash.number.fragment(a => a.getOrElse('')).map(Comment)
]);

export const test11 = Parser.s('base').slash.number.slash.oneOf([
    Parser.oneOf([
        Parser.top.map(Home)
    ]),
    Parser.top.map(Profile)
]).map(a => r => {
    return a > 2 ? r : Article(a);
});
*/
