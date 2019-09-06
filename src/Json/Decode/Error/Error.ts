import {
    Cata,
    cons
} from '../../../Basics';

const wrapFieldName = (name: string): string => {
    if (/^[a-z_][0-9a-z_]*$/i.test(name)) {
        return `.${name}`;
    }

    return `['${name}']`;
};

export abstract class Error {
    protected static stringifyWithContext(error: Error, indent: number, context: Array<string>): string {
        return error.stringifyWithContext(indent, context);
    }

    public abstract cata<R>(pattern: Pattern<R>): R;

    public stringify(indent: number): string {
        return this.stringifyWithContext(indent, []);
    }

    protected abstract stringifyWithContext(indent: number, context: Array<string>): string;
}

export type Pattern<R> = Cata<{
    Field(name: string, error: Error): R;
    Index(position: number, error: Error): R;
    OneOf(errors: Array<Error>): R;
    Failure(message: string, source: unknown): R;
}>;

/**
 * Something useful
 *
 * @param name opa
 * @param error apa
 */
export const Field: (name: string, error: Error) => Error = cons(class Field extends Error {
    public constructor(
        private readonly field: string,
        private readonly error: Error
    ) {
        super();
    }

    public cata<R>(pattern: Pattern<R>): R {
        if (typeof pattern.Field === 'function') {
            return pattern.Field(this.field, this.error);
        }

        return (pattern._ as () => R)();
    }

    protected stringifyWithContext(indent: number, context: Array<string>): string {
        return Error.stringifyWithContext(this.error, indent, [ ...context, wrapFieldName(this.field) ]);
    }
});

export const Index: (position: number, error: Error) => Error = cons(
    class Index extends Error {
        public constructor(
            private readonly index: number,
            private readonly error: Error
        ) {
            super();
        }

        public cata<R>(pattern: Pattern<R>): R {
            if (typeof pattern.Index === 'function') {
                return pattern.Index(this.index, this.error);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            return Error.stringifyWithContext(this.error, indent, [ ...context, `[${this.index}]` ]);
        }
    }
);

export const OneOf: (errors: Array<Error>) => Error = cons(
    class OneOf extends Error {
        public constructor(private readonly errors: Array<Error>) {
            super();
        }

        public cata<R>(pattern: Pattern<R>): R {
            if (typeof pattern.OneOf === 'function') {
                return pattern.OneOf(this.errors);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            switch (this.errors.length) {
                case 0: {
                    return 'Ran into a Json.Decode.oneOf with no possibilities'
                        + (context.length === 0 ? '!' : ' at _' + context.join(''));
                }

                case 1: {
                    return Error.stringifyWithContext(this.errors[ 0 ], indent, context);
                }

                default: {
                    const starter = context.length === 0
                        ? 'Json.Decode.oneOf'
                        : 'The Json.Decode.oneOf at _' + context.join('');

                    const lines = [
                        `${starter} failed in the following ${this.errors.length} ways`
                    ];

                    for (let index = 0; index < this.errors.length; ++index) {
                        lines.push(
                            `\n(${index + 1}) ` + this.errors[ index ].stringify(indent)
                        );
                    }

                    return lines.join('\n\n');
                }
            }
        }
    }
);

export const Failure: (message: string, source: unknown) => Error = cons(
    class Failure extends Error {
        public constructor(
            private readonly message: string,
            private readonly source: unknown
        ) {
            super();
        }

        public cata<R>(pattern: Pattern<R>): R {
            if (typeof pattern.Failure === 'function') {
                return pattern.Failure(this.message, this.source);
            }

            return (pattern._ as () => R)();
        }

        protected stringifyWithContext(indent: number, context: Array<string>): string {
            const introduction = context.length === 0
                ? 'Problem with the given value:\n\n'
                : 'Problem with the value at _' + context.join('') + ':\n\n';

            return introduction
                + '    ' + JSON.stringify(this.source, null, indent).replace(/\n/g, '\n    ')
                + `\n\n${this.message}`;
        }
    }
);
