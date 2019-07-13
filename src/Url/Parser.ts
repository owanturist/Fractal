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

const identity = <T>(value: T): T => value;

const first = <T>(arr: Array<T>): Maybe<T> => Maybe.fromNullable(arr[ 0 ]);

const rest = <T>(arr: Array<T>): Array<T> => arr.slice(1);

const concatMap = <T, R>(fn: (value: T) => Array<R>, arr: Array<T>): Array<R> => {
    const acc: Array<R> = [];

    for (const value of arr) {
        acc.push(...fn(value));
    }

    return acc;
};

const parseInt = (str: string): Maybe<number> => {
    return /^[0-9]+$/.test(str) ? Just(Number(str)) : Nothing;
};

const prepareUnvisited = (path: string): Array<string> => {
    return path.replace(/(^\/|\/$)/g, '')
        .split('/')
        .filter(p => p !== '');
};

const prepareQuery = (query: string): Params => {
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

type FA<F, R> = F extends (value: infer A) => R ? A : R;

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

export abstract class Parser<A, B> {
    public static get top(): Parser<unknown, unknown> {
        return ParserTop.inst;
    }

    public static s(path: string): Chainable<unknown, unknown> {
        return new SlashImpl(Parser.top).s(path);
    }

    public static custom<A>(converter: (path: string) => Maybe<A>): Chainable<(str: A) => unknown, unknown> {
        return new SlashImpl(Parser.top).custom(converter);
    }

    public static get string(): Chainable<(str: string) => unknown, unknown> {
        return new SlashImpl(Parser.top).string;
    }

    public static get number(): Chainable<(num: number) => unknown, unknown> {
        return new SlashImpl(Parser.top).number;
    }

    public static oneOf<A, B>(parsers: Array<Parser<A, B>>): Chainable<A, B> {
        return new SlashImpl(Parser.top).oneOf(parsers);
    }

    public map<B_ extends B, C>(tagger: FN<A, B_>): Parser<(value: B_) => C, C> {
        return new ParserMap(this as unknown as Parser<FN<A, B_>, B_>, tagger);
    }

    public parse(url: Url): Maybe<FA<A, B>> {
        const states = this.dive({
            unvisited: prepareUnvisited(url.path),
            queries: prepareQuery(url.query.getOrElse('')),
            fragment: url.fragment,
            value: identity as unknown as A
        });

        for (const state of states) {
            if (state.unvisited.length === 0) {
                return Just(state.value as FA<A, B>);
            }
        }

        return Nothing;
    }

    public abstract dive(state: State<A>): Array<State<B>>;
}

export interface Slash<A, B> {
    string: Chainable<FF<A, (value: string) => B>, B>;
    number: Chainable<FF<A, (value: number) => B>, B>;
    s(path: string): Chainable<A, B>;
    custom<B_ extends B, C>(converter: (str: string) => Maybe<B_>): Chainable<FF<A, (value: B_) => C>, C>;
    oneOf<B_ extends B, C>(parsers: Array<Parser<B_, C>>): Chainable<FF<A, B_>, C>;
}

class SlashImpl<A, B> implements Slash<A, B> {
    public constructor(
        private readonly parser: Parser<A, B>
    ) {}

    public s(path: string): Chainable<A, B> {
        return new ParserS(path, this.parser);
    }

    public get string(): Chainable<FF<A, (value: string) => B>, B> {
        return this.custom(Just);
    }

    public get number(): Chainable<FF<A, (value: number) => B>, B> {
        return this.custom(parseInt);
    }

    public custom<C, D>(converter: (str: string) => Maybe<C>): Chainable<FF<A, (value: C) => D>, D> {
        return new ParserCustom(
            converter,
            this.parser as unknown as Parser<FF<A, (value: C) => D>, (value: C) => D>
        );
    }

    public oneOf<B_ extends B, C>(parsers: Array<Parser<B_, C>>): Chainable<FF<A, B_>, C> {
        return new ParserOneOf(
            parsers,
            this.parser as unknown as Parser<FF<A, B_>, B_>
        );
    }
}

export interface Chainable<A, B> extends Parser<A, B> {
    slash: Slash<A, B>;
}

abstract class ChainableImpl<A, B> extends Parser<A, B> implements Chainable<A, B> {
    public get slash(): Slash<A, B> {
        return new SlashImpl(this);
    }
}

class ParserTop<A> extends Parser<A, A> {
    public static readonly inst: Parser<unknown, unknown> = new ParserTop();

    public dive(state: State<A>): Array<State<A>> {
        return [ state ];
    }
}

class ParserS<A, B> extends ChainableImpl<A, B> {
    public constructor(
        private readonly path: string,
        private readonly prev: Parser<A, B>
    ) {
        super();
    }

    public dive(state: State<A>): Array<State<B>> {
        return concatMap(
            (state: State<B>) => first(state.unvisited).cata({
                Nothing: () => [],

                Just: path => this.path === path ? [{
                    ...state,
                    unvisited: rest(state.unvisited)
                }] : []
            }),
            this.prev.dive(state)
        );
    }
}

class ParserCustom<A, B, C> extends ChainableImpl<FF<A, (value: B) => C>, C> {
    public constructor(
        private readonly converter: (path: string) => Maybe<B>,
        private readonly prev: Parser<FF<A, (value: B) => C>, (value: B) => C>
    ) {
        super();
    }

    public dive(state: State<FF<A, (value: B) => C>>): Array<State<C>> {
        return concatMap(
            state => first(state.unvisited).chain(this.converter).cata({
                Nothing: () => [],

                Just: value => [{
                    ...state,
                    unvisited: rest(state.unvisited),
                    value: state.value(value)
                }]
            }),
            this.prev.dive(state)
        );
    }
}

class ParserOneOf<A, B, C> extends ChainableImpl<FF<A, B>, C> {
    public constructor(
        private readonly parsers: Array<Parser<B, C>>,
        private readonly prev: Parser<FF<A, B>, B>
    ) {
        super();
    }

    public dive(state: State<FF<A, B>>): Array<State<C>> {
        return concatMap(
            state => concatMap(
                parser => parser.dive(state),
                this.parsers
            ),
            this.prev.dive(state)
        );
    }
}

class ParserMap<A, B, C> extends ChainableImpl<(value: B) => C, C> {
    public constructor(
        private readonly prev: Parser<FN<A, B>, B>,
        private readonly tagger: FN<A, B>
    ) {
        super();
    }

    public dive({ unvisited, queries, fragment, value }: State<(value: B) => C>): Array<State<C>> {
        return this.prev.dive({
            unvisited,
            queries,
            fragment,
            value: this.tagger
        }).map(state => ({ ...state, value: value(state.value)}));
    }
}
