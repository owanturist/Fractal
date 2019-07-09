import {
} from 'ts-toolbelt';
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

export abstract class Parser<T> {
    public static string(): Parser<(value: string) => unknown> {
        throw new Error();
    }

    public static number(): Parser<(value: number) => unknown> {
        throw new Error();
    }

    public static s(_path: string): Parser<unknown> {
        throw new Error();
    }

    public static oneOf<T>(_parsers: Array<Parser<T>>): Parser<T> {
        throw new Error();
    }

    public static top(): Parser<unknown> {
        throw new Error();
    }

    public abstract ap<R>(
        tagger: T extends (...args: infer A) => unknown ? (...args: A) => R : R
    ): Parser<R>;

    public abstract slash(): Slash<T>;

    public abstract parse(): string;
}

abstract class Slash<T> {
    public string(): Parser<
        (...args: T extends (...args: infer A) => unknown ? Append<A, string> : [ string ]) => unknown
    > {
        throw new Error();
    }

    public number(): Parser<
        (...args: T extends (...args: infer A) => unknown ? Append<A, number> : [ number ]) => unknown
    > {
        throw new Error();
    }

    public s(_path: string): Parser<T> {
        throw new Error();
    }

    public oneOf<R>(
        _parsers: Array<Parser<T extends (...args: infer A) => unknown ? (...args: A) => R : R>>
    ): Parser<R> {
        throw new Error();
    }
}

type Append<A extends Array<unknown>, T> = A extends [ infer A0 ]
    ? A extends [ A0, infer A1 ]
        ? A extends [ A0, A1, infer A2 ]
            ? A extends [ A0, A1, A2, infer A3 ]
                ? A extends [ A0, A1, A2, A3, infer A4 ]
                    ? A extends [ A0, A1, A2, A3, A4, infer A5 ]
                        ? A extends [ A0, A1, A2, A3, A4, A5, infer A6 ]
                            ? [ A0, A1, A2, A3, A4, A5, A6, T ]
                            : [ A0, A1, A2, A3, A4, A5, T ]
                        : [ A0, A1, A2, A3, A4, T ]
                    : [ A0, A1, A2, A3, T ]
                : [ A0, A1, A2, T ]
            : [ A0, A1, T ]
        : [ A0, T ]
    : [ T ]
    ;

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
const Commnet = (_id: number, _p: string): Route => new Route();
const Search = (_q: string, _p: number): Route => new Route();

export const test1 = Parser.top().ap(Profile);
export const test2 = Parser.s('search').slash().string().slash().number().ap(Search);
export const test3 = Parser.s('foo').slash().number().slash().s('bar').ap(Article);
export const test4 = Parser.s('foo').ap(Home);
export const test5 = Parser.s('foo')
    .slash().string()
    .slash().s('asd')
    .slash().number()
    .ap(Search);

export const test6 = Parser.s('foo');

export const test10 = Parser.oneOf([
    Parser.top().ap(Home),
    Parser.s('profile').ap(Profile),
    Parser.s('article').slash().number().ap(Article),
    Parser.s('article').slash().number().slash().s('comment').slash().string().ap(Commnet),
    Parser.s('search').slash().string().slash().number().ap(Search)
]);

export const test11 = Parser.s('base').slash().number().slash().oneOf([
    Parser.top().ap(Article)
    // Parser.string().ap(Commnet)
]);
