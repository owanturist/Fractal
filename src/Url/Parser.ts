import {
    Url
} from './index';
import Maybe, { Nothing, Just } from '../Maybe';

interface Queries {
    readonly [ key: string ]: Array<string>;
}

interface State<T> {
    readonly unvisited: Array<string>;
    readonly queries: Queries;
    readonly fragment: Maybe<string>;
    readonly value: T;
}

const mapState = <T, R>(fn: (value: T) => R, { unvisited, queries, fragment, value }: State<T>): State<R> => ({
    unvisited,
    queries,
    fragment,
    value: fn(value)
});

const identity = <T>(value: T): T => value;

const first = <T>(arr: Array<T>): Maybe<T> => Maybe.fromNullable(arr[ 0 ]);

const rest = <T>(arr: Array<T>): Array<T> => arr.slice(1);

const getQueries = (key: string, params: Queries): Array<string> => params[ key ] || [];

const omitQueries = (key: string, {[ key ]: _, ...params }: Queries): Queries => params;

const buildDict = <T>(variants: Array<[ string, T ]>): { readonly [ key: string ]: T } => {
    const acc: {[ key: string ]: T } = {};

    for (const [ key, value ] of variants) {
        acc[ key ] = value;
    }

    return acc;
};

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

const prepareQuery = (query: string): Queries => {
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
    public static get root(): Parser<unknown, unknown> {
        return RootParser.inst;
    }

    public static s(path: string): Parser<unknown, unknown> {
        return new SlashImpl(Parser.root).s(path);
    }

    public static custom<A>(converter: (path: string) => Maybe<A>): Parser<(str: A) => unknown, unknown> {
        return new SlashImpl(Parser.root).custom(converter);
    }

    public static get string(): Parser<(str: string) => unknown, unknown> {
        return new SlashImpl(Parser.root).string;
    }

    public static get number(): Parser<(num: number) => unknown, unknown> {
        return new SlashImpl(Parser.root).number;
    }

    public static oneOf<A, B>(parsers: Array<Parser<A, B>>): Parser<A, B> {
        return new SlashImpl(Parser.root).oneOf(parsers);
    }

    public map<B_ extends B, C>(tagger: FN<A, B_>): Parser<(value: B_) => C, C> {
        return new MapParser(this as unknown as Parser<FN<A, B_>, B_>, tagger);
    }

    public get slash(): Slash<A, B> {
        return new SlashImpl(this);
    }

    public query(key: string): Query<A, B> {
        return new QueryImpl(key, this);
    }

    public fragment<B_ extends B, C>(converter: (valeu: Maybe<string>) => B_): Parser<FF<A, (value: B_) => C>, C> {
        return new FragmentParser(
            converter,
            this as unknown as Parser<FF<A, (value: B_) => C>, (value: B_) => C>
        );
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

class RootParser<A> extends Parser<A, A> {
    public static readonly inst: Parser<unknown, unknown> = new RootParser();

    public dive(state: State<A>): Array<State<A>> {
        return [ state ];
    }
}

class SParser<A, B> extends Parser<A, B> {
    public constructor(
        private readonly path: string,
        private readonly prev: Parser<A, B>
    ) {
        super();
    }

    public dive(state: State<A>): Array<State<B>> {
        return concatMap(
            ({ unvisited, queries, fragment, value }) => first(unvisited).cata({
                Nothing: () => [],

                Just: path => this.path === path ? [{
                    unvisited: rest(unvisited),
                    queries,
                    fragment,
                    value
                }] : []
            }),
            this.prev.dive(state)
        );
    }
}

class CustomParser<A, B, C> extends Parser<FF<A, (value: B) => C>, C> {
    public constructor(
        private readonly converter: (path: string) => Maybe<B>,
        private readonly prev: Parser<FF<A, (value: B) => C>, (value: B) => C>
    ) {
        super();
    }

    public dive(state: State<FF<A, (value: B) => C>>): Array<State<C>> {
        return concatMap(
            ({ unvisited, queries, fragment, value }) => first(unvisited).chain(this.converter).cata({
                Nothing: () => [],

                Just: converted => [{
                    unvisited: rest(unvisited),
                    queries,
                    fragment,
                    value: value(converted)
                }]
            }),
            this.prev.dive(state)
        );
    }
}

class QueryParser<A, B, C> extends Parser<FF<A, (values: B) => C>, C> {
    public constructor(
        private readonly converter: (values: Array<string>) => B,
        private readonly key: string,
        private readonly prev: Parser<FF<A, (value: B) => C>, (value: B) => C>
    ) {
        super();
    }

    public dive(state: State<FF<A, (value: B) => C>>): Array<State<C>> {
        return concatMap(
            ({ unvisited, queries, fragment, value }) => [{
                unvisited,
                queries: omitQueries(this.key, queries),
                fragment,
                value: value(this.converter(getQueries(this.key, queries)))
            }],
            this.prev.dive(state)
        );
    }
}

class OneOfParser<A, B, C> extends Parser<FF<A, B>, C> {
    public constructor(
        private readonly parsers: Array<Parser<B, C>>,
        private readonly prev: Parser<FF<A, B>, B>
    ) {
        super();
    }

    public dive(state: State<FF<A, B>>): Array<State<C>> {
        return concatMap(
            nextState => concatMap(
                parser => parser.dive(nextState),
                this.parsers
            ),
            this.prev.dive(state)
        );
    }
}

class MapParser<A, B, C> extends Parser<(value: B) => C, C> {
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
        }).map(state => mapState(value, state));
    }
}

class FragmentParser<A, B, C> extends Parser<FF<A, (value: B) => C>, C> {
    public constructor(
        private readonly converter: (value: Maybe<string>) => B,
        private readonly prev: Parser<FF<A, (value: B) => C>, (value: B) => C>
    ) {
        super();
    }

    public dive(state: State<FF<A, (value: B) => C>>): Array<State<C>> {
        return concatMap(
            ({ unvisited, queries, fragment, value }) => [{
                unvisited: rest(unvisited),
                queries,
                fragment: Nothing,
                value: value(this.converter(fragment))
            }],
            this.prev.dive(state)
        );
    }
}

export interface Slash<A, B> {
    string: Parser<FF<A, (value: string) => B>, B>;
    number: Parser<FF<A, (value: number) => B>, B>;
    s(path: string): Parser<A, B>;
    custom<B_ extends B, C>(converter: (str: string) => Maybe<B_>): Parser<FF<A, (value: B_) => C>, C>;
    oneOf<B_ extends B, C>(parsers: Array<Parser<B_, C>>): Parser<FF<A, B_>, C>;
}

class SlashImpl<A, B> implements Slash<A, B> {
    public constructor(
        private readonly parser: Parser<A, B>
    ) {}

    public s(path: string): Parser<A, B> {
        return new SParser(path, this.parser);
    }

    public get string(): Parser<FF<A, (value: string) => B>, B> {
        return this.custom(Just);
    }

    public get number(): Parser<FF<A, (value: number) => B>, B> {
        return this.custom(parseInt);
    }

    public custom<C, D>(converter: (str: string) => Maybe<C>): Parser<FF<A, (value: C) => D>, D> {
        return new CustomParser(
            converter,
            this.parser as unknown as Parser<FF<A, (value: C) => D>, (value: C) => D>
        );
    }

    public oneOf<B_ extends B, C>(parsers: Array<Parser<B_, C>>): Parser<FF<A, B_>, C> {
        return new OneOfParser(
            parsers,
            this.parser as unknown as Parser<FF<A, B_>, B_>
        );
    }
}

export interface Query<A, B> {
    string: Parser<FF<A, (value: Maybe<string>) => B>, B>;
    number: Parser<FF<A, (value: Maybe<number>) => B>, B>;
    boolean: Parser<FF<A, (value: Maybe<boolean>) => B>, B>;
    list: QueryList<A, B>;
    enum<B_ extends B, C>(variants: Array<[ string, B_ ]>): Parser<FF<A, (value: Maybe<B_>) => C>, C>;
    custom<B_ extends B, C>(converter: (values: Maybe<string>) => B_): Parser<FF<A, (value: B_) => C>, C>;
}

class QueryImpl<A, B> implements Query<A, B> {
    public constructor(
        private readonly key: string,
        private readonly parser: Parser<A, B>
    ) {}

    public get string(): Parser<FF<A, (value: Maybe<string>) => B>, B> {
        return this.custom(identity);
    }

    public get number(): Parser<FF<A, (value: Maybe<number>) => B>, B> {
        return this.custom(value => value.chain(parseInt));
    }

    public get boolean(): Parser<FF<A, (value: Maybe<boolean>) => B>, B> {
        return this.enum([
            [ 'false', false ],
            [ 'true', true ]
        ]);
    }

    public get list(): QueryList<A, B> {
        return new QueryListImpl(this.key, this.parser);
    }

    public enum<C, D>(variants: Array<[ string, C ]>): Parser<FF<A, (value: Maybe<C>) => D>, D> {
        const dict = buildDict(variants);

        return this.custom(value => value.chain(key => Maybe.fromNullable(dict[ key ])));
    }

    public custom<C, D>(converter: (value: Maybe<string>) => C): Parser<FF<A, (value: C) => D>, D> {
        return new QueryParser(
            values => converter(values.length === 1 ? Just(values[ 0 ]) : Nothing),
            this.key,
            this.parser as unknown as Parser<FF<A, (value: C) => D>, (value: C) => D>
        );
    }
}

export interface QueryList<A, B> {
    string: Parser<FF<A, (values: Array<string>) => B>, B>;
    number: Parser<FF<A, (values: Array<number>) => B>, B>;
    boolean: Parser<FF<A, (values: Array<boolean>) => B>, B>;
    enum<B_ extends B, C>(variants: Array<[ string, B_ ]>): Parser<FF<A, (values: Array<B_>) => C>, C>;
    custom<B_ extends B, C>(converter: (values: Array<string>) => B_): Parser<FF<A, (value: B_) => C>, C>;
}

class QueryListImpl<A, B> implements QueryList<A, B> {
    public constructor(
        private readonly key: string,
        private readonly parser: Parser<A, B>
    ) {}

    public get string(): Parser<FF<A, (values: Array<string>) => B>, B> {
        return this.custom(identity);
    }

    public get number(): Parser<FF<A, (values: Array<number>) => B>, B> {
        return this.custom(values => {
            return Maybe.combine(values.map(parseInt)).getOrElse([]);
        });
    }

    public get boolean(): Parser<FF<A, (values: Array<boolean>) => B>, B> {
        return this.enum([
            [ 'false', false ],
            [ 'true', true ]
        ]);
    }

    public enum<C, D>(variants: Array<[ string, C ]>): Parser<FF<A, (value: Array<C>) => D>, D> {
        const dict = buildDict(variants);

        return this.custom(values => {
            return Maybe.combine(
                values.map(key => Maybe.fromNullable(dict[ key ]))
            ).getOrElse([]);
        });
    }

    public custom<C, D>(converter: (values: Array<string>) => C): Parser<FF<A, (value: C) => D>, D> {
        return new QueryParser(
            converter,
            this.key,
            this.parser as unknown as Parser<FF<A, (value: C) => D>, (value: C) => D>
        );
    }
}
