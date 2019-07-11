import {
    Url
} from './index';
import {
    Maybe,
    Nothing,
    Just
} from '../Maybe';

interface Params {
    readonly [ key: string ]: Array<string>;
}

interface State<T> {
    readonly unvisited: Array<string>;
    readonly queries: Params;
    readonly fragment: Maybe<string>;
    readonly value: T;
}

export abstract class Parser<T> {
    public static get top(): Parser<unknown> {
        throw new Error();
    }

    public static get string(): Chainable<(value: string) => unknown> {
        throw new Error();
    }

    public static get number(): Chainable<(value: number) => unknown> {
        throw new Error();
    }

    public static custom<T>(_converter: (str: string) => Maybe<T>): Chainable<(value: T) => unknown> {
        throw new Error();
    }

    public static s(_path: string): Chainable<unknown> {
        throw new Error();
    }

    public static oneOf<T>(_parsers: Array<Parser<T>>): Chainable<T> {
        throw new Error();
    }

    protected static visit(unvisited: Array<string>): Maybe<[ string, Array<string> ]> {
        return Maybe.fromNullable(unvisited[ unvisited.length - 1 ]).map(path => [ path, unvisited.slice(0, -1) ]);
    }

    protected static preparePath(path: string): Array<string> {
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

    public map<R>(_tagger: FA<T, R>): Parser<(value: R) => unknown> {
        throw new Error();
    }

    public abstract parse(_url: Url): Maybe<T extends (value: infer A) => unknown ? A : unknown>;
}

abstract class Chainable<A> extends Parser<A> {
    public get slash(): Slash<A> {
        throw new Error();
    }
}

class Slash<T> {
    public st?: State<never>;

    public get string(): Chainable<FF<T, (value: string) => unknown>> {
        throw new Error();
    }

    public get number(): Chainable<FF<T, (value: number) => unknown>> {
        throw new Error();
    }

    public s(_path: string): Chainable<T> {
        throw new Error();
    }

    public custom<R>(_converter: (str: string) => Maybe<R>): Chainable<FF<T, (value: R) => unknown>> {
        throw new Error();
    }

    public oneOf<R>(_parsers: Array<Parser<R>>): Chainable<FF<T, R>> {
        throw new Error();
    }
}

type FF<F, R> = F extends (arg: infer A) => infer N
    ? (arg: A) => FF<N, R>
    : R;

type FA<F, R> = F extends (arg0: infer A0) => infer F1
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
    ? (arg19: A19) => FA<F20, R> // it doesn't work properly but let's keep it here
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
]).parse(1 as any);

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
