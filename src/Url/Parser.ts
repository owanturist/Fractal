import {
    Maybe,
    Nothing,
    Just
} from '../Maybe';

export type Returns<F> = {
    next: F extends (...args: Array<unknown>) => infer R ? Returns<R> : F;
    end: F;
}[ F extends (...args: Array<unknown>) => unknown ? 'next' : 'end' ];

export let kjk: Returns<(a: boolean) => (b: string) => number>;

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
    const acc: {[ key: string ]: Array<string>} = {};

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

export abstract class Parser<A, B> {
    public static top: Parser<unknown, unknown>;

    public static string: Parser<(str: string) => unknown, unknown>;

    public static number: Parser<(num: number) => unknown, unknown>;

    public static s(
        // path: string
    ): Parser<unknown, unknown> {
        throw new Error('');
    }

    public static oneOf<A, B>(
        // parsers: Array<Parser<A, B>>
    ): Parser<A, B> {
        throw new Error('');
    }

    public slash<C, D>(
        // parser: Parser<B extends unknown ? C : B, D>
    ): Parser<Fad<A, Fad<B extends unknown ? C : B, D>>, D> {
        throw new Error('');
    }

    // public query(name: string, parser: Parser<T>): Parser<T> {
    //     throw new Error('');
    // }

    public map<C>(
        // tagger: Fad<A, B extends unknown ? C : B>
    ): Parser<Fad<(val: B extends unknown ? C : B) => unknown, unknown>, unknown> {
        throw new Error('');
    }

    // public parse(url: Url): Maybe<T> {
    //     throw new Error('');
    // }
}

export abstract class Container<A, B> extends Parser<(value: A) => B, B> {}

type Fad<T, R> = T extends (val: infer A) => infer N
    ? (val: A) => Fad<N, R>
    : T extends (val: infer A) => unknown
        ? (val: A) => R
        : R
    ;

// export let tta: Fad<(q: string) => (p: number) => unknown, Route>;
// export let ttq: Fad<(val: Route) => unknown, unknown>;
// export let ttb: Fas<() => () => boolean>;
// export let tti: Fas<(a: string) => () => boolean>;
// export let ttx: Fas<() => (b: number) => boolean>;
// export let ttc: Fas<() => (b: number) => () => boolean>;
// export let ttk: Fas<() => (b: number) => () => (c: boolean) => (d: string) => () => boolean>;

// type Route
//     = { $: 'HOME' }
//     | { $: 'PROFILE' }
//     | { $: 'ARTICLE'; _0: number }
//     | { $: 'SEARCH'; _0: string; _1: number }
//     ;

// const Home: Route = { $: 'HOME' };
// const Profile: Route = { $: 'PROFILE' };
// const Article = (id: number): Route => ({ $: 'ARTICLE', _0: id });
// const Search = (q: string) => (p: number): Route => ({ $: 'SEARCH', _0: q, _1: p });

// export const foo: Parser<(val: Route) => unknown, unknown> = Parser.oneOf([
//     Parser.top.map<Route>(Home),
//     Parser.s('profile').map(Profile),
//     Parser.s('article').slash(Parser.number).map(Article),
//     Parser.s('search').slash(Parser.string).slash(Parser.number).map(Search)
// ]);


// export const search: Parser<(val: Route) => unknown, unknown> = Parser
//     .s('search')
//     .slash(Parser.string)
//     .slash(Parser.s('p'))
//     .slash(Parser.number)
//     .slash(Parser.s('p'))
//     .map(Search)
//     ;

// export const article = Parser.s('profile').map(Profile);
// export const s = Parser.top.map(Home);

// export const asx = Parser.number.slash(Parser.s('ad')).slash(Parser.number).slash(Parser.string);

// export const asd = Parser
//     .s('asd')
//     .slash(Parser.s('asd'))
//     .slash(Parser.string)
//     .slash(Parser.number)
//     .slash(Parser.string)
//     ;

// export const baz = Parser.s('article').slash(Parser.number).map(Article);

// export const baf = Parser.s('article').slash(Parser.number).map(Article).parse(Url.create(Url.Http, ''));
