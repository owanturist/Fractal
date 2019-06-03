import {
    Cata
} from '../Basics';
import {
    Maybe,
    Nothing,
    Just
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
    public static Http = Http;

    public static Https = Https;

    public static fromString(str: string): Maybe<Url> {
        try {
            const url = new URL(str);

            return Just(Url.create(
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

    public static create(protocol: Protocol, host: string, config: {
        port?: number;
        path?: string;
        query?: string;
        fragment?: string;
    } = {}): Url {
        return new Url(
            protocol,
            host,
            Maybe.fromNullable(config.port).chain((val: number) => isNaN(val) ? Nothing : Just(val)),
            config.path || '/',
            Maybe.fromNullable(config.query).chain((val: string) => val === '' ? Nothing : Just(val)),
            Maybe.fromNullable(config.fragment).chain((val: string) => val === '' ? Nothing : Just(val))
        );
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
