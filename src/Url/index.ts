import {
    Cata
} from '../Basics';
import {
    Maybe,
    Nothing,
    Just
} from '../Maybe';
import {
    Parser
} from './Parser';

export interface Protocol {
    isHttp(): boolean;
    isHttps(): boolean;
    isEqual(another: Protocol): boolean;
    cata<R>(pattern: Protocol.Pattern<R>): R;
}

export const Http = new class Http implements Protocol {
    public isHttp(): boolean {
        return true;
    }

    public isHttps(): boolean {
        return false;
    }

    public isEqual(another: Protocol): boolean {
        return another.isHttp();
    }

    public cata<R>(pattern: Protocol.Pattern<R>): R {
        if (typeof pattern.Http === 'function') {
            return pattern.Http();
        }

        return (pattern._ as () => R)();
    }
}();

export const Https = new class Https implements Protocol {
    public isHttp(): boolean {
        return false;
    }

    public isHttps(): boolean {
        return true;
    }

    public isEqual(another: Protocol): boolean {
        return another.isHttps();
    }

    public cata<R>(pattern: Protocol.Pattern<R>): R {
        if (typeof pattern.Https === 'function') {
            return pattern.Https();
        }

        return (pattern._ as () => R)();
    }
}();

export namespace Protocol {
    export type Pattern<R> = Cata<{
        Http(): R;
        Https(): R;
    }>;
}

const trimMaybeString = (str: string): Maybe<string> => {
    const trimmed = str.trim();

    return trimmed === '' ? Nothing : Just(trimmed);
};

export class Url {
    public static Http = Http;

    public static Https = Https;

    public static fromString(str: string): Maybe<Url> {
        try {
            const url = new URL(str);

            return Just(Url.cons(
                url.protocol === 'http:' ? Http : Https,
                url.host,
                {
                    port: parseInt(url.protocol, 10),
                    path: url.pathname,
                    query: url.search.slice(1),
                    fragment: url.search.slice(1)
                }
            ));
        } catch (err) {
            return Nothing;
        }
    }

    public static fromPercent(str: string): Maybe<Url> {
        try {
            return Url.fromString(decodeURIComponent(str));
        } catch (err) {
            return Nothing;
        }
    }

    public static cons(protocol: Protocol, host: string, config: {
        port?: number;
        path?: string;
        query?: string;
        fragment?: string;
    } = {}): Url {
        return new Url(
            protocol,
            host,
            Url.preparePort(config.port),
            Url.preparePath(config.path),
            Url.prepareQuery(config.query),
            Url.prepareFragment(config.fragment)
        );
    }

    private static preparePort(port?: number): Maybe<number> {
        return Maybe.fromNullable(port).chain((val: number) => isNaN(val) ? Nothing : Just(val));
    }

    private static preparePath(path?: string): string {
        return Maybe.fromNullable(path).chain(trimMaybeString).getOrElse('/');
    }

    private static prepareQuery(query?: string): Maybe<string> {
        return Maybe.fromNullable(query).chain(trimMaybeString);
    }

    private static prepareFragment(fragment?: string): Maybe<string> {
        return Maybe.fromNullable(fragment).chain(trimMaybeString);
    }

    private constructor(
        public readonly protocol: Protocol,
        public readonly host: string,
        public readonly port: Maybe<number>,
        public readonly path: string,
        public readonly query: Maybe<string>,
        public readonly fragment: Maybe<string>
    ) {}

    public withProtocol(nextProtocol: Protocol): Url {
        if (this.protocol.isEqual(nextProtocol)) {
            return this;
        }

        return new Url(nextProtocol, this.host, this.port, this.path, this.query, this.fragment);
    }

    public withHost(nextHost: string): Url {
        if (this.host === nextHost) {
            return this;
        }

        return new Url(this.protocol, nextHost, this.port, this.path, this.query, this.fragment);
    }

    public withoutPort(): Url {
        if (this.port.isNothing()) {
            return this;
        }

        return new Url(this.protocol, this.host, Nothing, this.path, this.query, this.fragment);
    }

    public withPort(nextPort: number): Url {
        return Url.preparePort(nextPort).cata({
            Nothing: () => this.withoutPort(),
            Just: port => new Url(this.protocol, this.host, Just(port), this.path, this.query, this.fragment)
        });
    }

    public withoutPath(): Url {
        return this.withPath('');
    }

    public withPath(nextPath: string): Url {
        return new Url(this.protocol, this.host, this.port, Url.preparePath(nextPath), this.query, this.fragment);
    }

    public withoutQuery(): Url {
        if (this.query.isNothing()) {
            return this;
        }

        return new Url(this.protocol, this.host, this.port, this.path, Nothing, this.fragment);
    }

    public withQuery(nextQuery: string): Url {
        return Url.prepareQuery(nextQuery).cata({
            Nothing: () => this.withoutQuery(),
            Just: query => new Url(this.protocol, this.host, this.port, this.path, Just(query), this.fragment)
        });
    }

    public withoutFragment(): Url {
        if (this.fragment.isNothing()) {
            return this;
        }

        return new Url(this.protocol, this.host, this.port, this.path, this.query, Nothing);
    }

    public withFragment(nextFragment: string): Url {
        return Url.prepareFragment(nextFragment).cata({
            Nothing: () => this.withoutFragment(),
            Just: fragment => new Url(this.protocol, this.host, this.port, this.path, this.query, Just(fragment))
        });
    }

    public parse<T>(parser: Parser<T>): Maybe<T> {
        return parser.parse(this);
    }

    public toString(): string {
        return [
            this.protocol.cata({
                Http: () => 'http://',
                Https: () => 'https://'
            }),
            this.host,
            this.path,
            this.query.map((query: string) => `?${query}`).getOrElse(''),
            this.fragment.map((fragment: string) => `#${fragment}`).getOrElse('')
        ].join('');
    }

    public toPercent(): string {
        return encodeURIComponent(this.toString());
    }
}
