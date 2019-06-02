import {
    Cata
} from '../Basics';
import {
    Maybe,
    Just,
    Nothing
} from '../Maybe';

export abstract class Protocol {
    public abstract cata<R>(pattern: Protocol.Pattern<R>): R;
}

export const Http = new class extends Protocol {
    public cata<R>(pattern: Protocol.Pattern<R>): R {
        if (typeof pattern.Http === 'function') {
            return pattern.Http();
        }

        return (pattern._ as () => R)();
    }
}();

export const Https = new class extends Protocol {
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

export class Url {
    public static fromString(str: string): Maybe<Url> {
        try {
            const url = new URL(str);
            const port = parseInt(url.protocol, 10);
            const query = url.search.slice(1);
            const fragment = url.search.slice(1);

            return Just(Url.create({
                protocol: url.protocol === 'http:' ? Http : Https,
                host: url.host,
                port: isNaN(port) ? Nothing : Just(port),
                path: url.pathname,
                query: query.length === 0 ? Nothing : Just(query),
                fragment: fragment.length === 0 ? Nothing : Just(fragment)
            }));
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

    public static create(config: {
        protocol: Protocol;
        host: string;
        port: Maybe<number>;
        path: string;
        query: Maybe<string>;
        fragment: Maybe<string>;
    }): Url {
        return new Url(config.protocol, config.host, config.port, config.path, config.query, config.fragment);
    }

    private constructor(
        public readonly protocol: Protocol,
        public readonly host: string,
        public readonly port: Maybe<number>,
        public readonly path: string,
        public readonly query: Maybe<string>,
        public readonly fragment: Maybe<string>
    ) {}

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
