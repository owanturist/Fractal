import {
    WhenNever
} from 'Basics';
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
    readonly visited: Array<string>;
    readonly unvisited: Array<string>;
    readonly params: Params;
    readonly frag: Maybe<string>;
    readonly value: T;
}

const getFirstMatch = <T>(states: Array<State<T>>): Maybe<T> => {
    if (states.length === 0) {
        return Nothing;
    }

    const state = states[0];

    if (state.unvisited.length === 0) {
        return Just(state.value);
    }

    return getFirstMatch(states.slice(1));
};

export const processPath = (path: string): Array<string> => path.replace(/(^\/|\/$)/g, '').split('/');

export const processQuery = (query: string): Params => {
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
};

class TopParser {
    public ap<R>(_tagger: R): Parser<R> {
        throw new Error();
    }

    public query(_name: string): Query<never> {
        throw new Error();
    }

    public fragment<R>(_handler: (fr: Maybe<string>) => R): Parser<(arg: R) => never> {
        throw new Error();
    }
}

export class Parser<T> {
    public static get top(): TopParser {
        throw new Error();
    }

    public static get string(): Parser<(value: string) => never> {
        throw new Error();
    }

    public static get number(): Parser<(value: number) => never> {
        throw new Error();
    }

    public static custom<T>(_parser: (str: string) => Maybe<T>): Parser<(value: T) => never> {
        throw new Error();
    }

    public static s(_path: string): Parser<never> {
        throw new Error();
    }

    public static oneOf<T>(_parsers: Array<Parser<T>>): Parser<T> {
        throw new Error();
    }

    private constructor() {}

    public ap<R>(_tagger: [ T ] extends [ never ] ? R : FR<T, R>): Parser<R> {
        throw new Error();
    }

    public map<R>(_tagger: (value: T) => R): Parser<R> {
        throw new Error();
    }

    public get slash(): Path<T> {
        throw new Error();
    }

    public query(_name: string): Query<T> {
        throw new Error();
    }

    public fragment<R>(_handler: (fr: Maybe<string>) => R): Parser<FF<T, R>> {
        throw new Error();
    }

    public parse(_url: Url): Maybe<T> {
        throw new Error();
    }
}

abstract class Path<T> {
    public get string(): Parser<FF<T, string>> {
        throw new Error();
    }

    public get number(): Parser<FF<T, number>> {
        throw new Error();
    }

    public custom<R>(_parser: (str: string) => Maybe<R>): Parser<FF<T, R>> {
        throw new Error();
    }

    public s(_path: string): Parser<T> {
        throw new Error();
    }

    public oneOf<R>(_parsers: Array<Parser<R>>): Parser<FF<T, R>> {
        throw new Error();
    }
}

abstract class Query<T> {
    public get string(): Parser<FF<T, Maybe<string>>> {
        throw new Error();
    }

    public get number(): Parser<FF<T, Maybe<number>>> {
        throw new Error();
    }

    public get boolean(): Parser<FF<T, Maybe<boolean>>> {
        throw new Error();
    }

    public get list(): QueryList<T> {
        throw new Error();
    }

    public custom<R>(_parser: (str: Maybe<string>) => R): Parser<FF<T, R>> {
        throw new Error();
    }

    public enum<R>(_vairants: Array<[ string, R ]>): Parser<FF<T, Maybe<R>>> {
        throw new Error();
    }
}

abstract class QueryList<T> {
    public get string(): Parser<FF<T, Array<string>>> {
        throw new Error();
    }

    public get number(): Parser<FF<T, Array<number>>> {
        throw new Error();
    }

    public get boolean(): Parser<FF<T, Array<boolean>>> {
        throw new Error();
    }

    public custom<R>(_parser: (str: Array<string>) => R): Parser<FF<T, R>> {
        throw new Error();
    }

    public enum<R>(_vairants: Array<[ string, R ]>): Parser<FF<T, Array<R>>> {
        throw new Error();
    }
}

type FF<F, R> = WhenNever<F, unknown> extends (arg: infer A) => infer N
    ? (arg: A) => FF<N, R>
    : (arg: R) => never;

type FR<F, R> = F extends (arg0: infer A0) => infer F1
    ? (arg0: A0) => WhenNever<F1, unknown> extends (arg1: infer A1) => infer F2
    ? (arg1: A1) => WhenNever<F2, unknown> extends (arg2: infer A2) => infer F3
    ? (arg2: A2) => WhenNever<F3, unknown> extends (arg3: infer A3) => infer F4
    ? (arg3: A3) => WhenNever<F4, unknown> extends (arg4: infer A4) => infer F5
    ? (arg4: A4) => WhenNever<F5, unknown> extends (arg5: infer A5) => infer F6
    ? (arg5: A5) => WhenNever<F6, unknown> extends (arg6: infer A6) => infer F7
    ? (arg6: A6) => WhenNever<F7, unknown> extends (arg7: infer A7) => infer F8
    ? (arg7: A7) => WhenNever<F8, unknown> extends (arg8: infer A8) => infer F9
    ? (arg8: A8) => WhenNever<F9, unknown> extends (arg9: infer A9) => infer F10
    ? (arg9: A9) => WhenNever<F10, unknown> extends (arg10: infer A10) => infer F11
    ? (arg10: A10) => WhenNever<F11, unknown> extends (arg11: infer A11) => infer F12
    ? (arg11: A11) => WhenNever<F12, unknown> extends (arg12: infer A12) => infer F13
    ? (arg12: A12) => WhenNever<F13, unknown> extends (arg13: infer A13) => infer F14
    ? (arg13: A13) => WhenNever<F14, unknown> extends (arg14: infer A14) => infer F15
    ? (arg14: A14) => WhenNever<F15, unknown> extends (arg15: infer A15) => infer F16
    ? (arg15: A15) => WhenNever<F16, unknown> extends (arg16: infer A16) => infer F17
    ? (arg16: A16) => WhenNever<F17, unknown> extends (arg17: infer A17) => infer F18
    ? (arg17: A17) => WhenNever<F18, unknown> extends (arg18: infer A18) => infer F19
    ? (arg18: A18) => WhenNever<F19, unknown> extends (arg19: infer A19) => infer F20
    ? (arg19: A19) => FR<F20, R> // it doesn't work properly but let's keep it here
    : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R : R;

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

export const test1 = Parser.top.ap(Home);
export const test2 = Parser.s('search').slash.number.slash.string.ap(Comment);
export const test3 = Parser.s('foo').slash.number.slash.s('bar').ap(Article);
export const test4 = Parser.s('foo').ap(Home);
export const test5 = Parser.s('foo')
    .slash.string
    .slash.s('asd')
    .slash.number
    .ap(Search);


export const test50 = Parser.top.query('dsa').boolean.parse(1 as any as Url);

export const test501 = Parser.number.slash.string.ap(Comment);

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
    Parser.top.ap(Home),
    Parser.top.query('hi').number.ap(a => Article(a.getOrElse(0))),
    Parser.top.fragment(a => parseInt(a.getOrElse(''), 10)).ap(Article),
    Parser.s('profile').ap(Profile),
    Parser.s('article').slash.number.ap(Article),
    Parser.s('article').slash.number.slash.s('comment').slash.string.ap(Comment),
    Parser.s('search').slash.string.slash.number.ap(Search),
    Parser.s('post').slash.string.slash.custom(str => str === '' ? Nothing : Just(new Date())).ap(Post),
    Parser.s('hi').slash.number.fragment(a => a.getOrElse('')).ap(Comment)
]);

export const test11 = Parser.s('base').slash.number.slash.oneOf([
    Parser.oneOf([
        Parser.top.ap(Home)
    ]),
    Parser.top.ap(Profile)
]).ap(a => r => {
    return a > 2 ? r : Article(a);
});
