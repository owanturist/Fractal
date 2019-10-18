import test from 'ava';

import Maybe from '../src/Maybe';
import Either from '../src/Either';
import RemoteData, { Loading, Failure, Succeed } from '../src/RemoteData';

test('RemoteData.fromMaybe()', t => {
    const _1 /* RemoteData<string, never> */ = RemoteData.fromMaybe('err', Maybe.Nothing);
    t.deepEqual(_1, Failure('err'));

    const _2 /* RemoteData<string, number> */ = RemoteData.fromMaybe('err', Maybe.Just(0));
    t.deepEqual(_2, Succeed(0));

    const _3: /* cast */ RemoteData<string, number> = RemoteData.fromMaybe('err', Maybe.Nothing);
    t.deepEqual(_3, Failure('err'));
});

test('RemoteData.fromEither()', t => {
    const _1 /* RemoteData<string, never> */ = Either.Left('err').tap(RemoteData.fromEither);
    t.deepEqual(_1, Failure('err'));

    const _2 /* RemoteData<never, number> */ = Either.Right(0).tap(RemoteData.fromEither);
    t.deepEqual(_2, Succeed(0));

    const _3: /* cast */ RemoteData<string, number> = Either.Left('err').tap(RemoteData.fromEither);
    t.deepEqual(_3, Failure('err'));

    const _4: /* cast */ RemoteData<string, number> = Either.Right(0).tap(RemoteData.fromEither);
    t.deepEqual(_4, Succeed(0));
});

test('RemoteData.shape()', t => {
    const _1 /* RemoteData<never, {}> */ = RemoteData.shape({});
    t.deepEqual(_1, Succeed({}));

    const _2 /* RemoteData<string, {
        foo: never;
    }> */ = RemoteData.shape({
        foo: Failure('err')
    });
    t.deepEqual(_2, Failure('err'));

    const _3 /* RemoteData<never, {
        foo: number;
    }> */ = RemoteData.shape({
        foo: Succeed(1)
    });
    t.deepEqual(
        _3,
        Succeed({
            foo: 1
        })
    );

    const _4 /* RemoteData<string, {
        foo: never;
        bar: never;
    }> */ = RemoteData.shape({
        foo: Loading,
        bar: Failure('err2')
    });
    t.deepEqual(_4, Loading);

    const _5 /* RemoteData<string, {
        foo: never;
        bar: number;
    }> */ = RemoteData.shape({
        foo: Failure('err'),
        bar: Succeed(1)
    });
    t.deepEqual(_5, Failure('err'));

    const _6 /* RemoteData<string, {
        foo: number;
        bar: never;
    }> */ = RemoteData.shape({
        foo: Succeed(1),
        bar: Loading
    });
    t.deepEqual(_6, Loading);

    const _7 /* RemoteData<never, {
        foo: string;
        bar: number;
    }> */ = RemoteData.shape({
        foo: Succeed('foo'),
        bar: Succeed(1)
    });
    t.deepEqual(
        _7,
        Succeed({
            foo: 'foo',
            bar: 1
        })
    );

    const _8 /* RemoteData<string, never> */ = RemoteData.shape({
        foo: Loading,
        bar: Succeed(1)
    }).map(obj => obj.foo);
    t.deepEqual(_8, Loading);

    const _9 /* RemoteData<string, number> */ = RemoteData.shape({
        foo: Failure('err'),
        bar: Succeed(1)
    }).map(obj => obj.bar);
    t.deepEqual(_9, Failure('err'));

    const _10 /* RemoteData<never, string> */ = RemoteData.shape({
        foo: Succeed('foo'),
        bar: Succeed(1)
    }).map(obj => obj.foo);
    t.deepEqual(_10, Succeed('foo'));

    const _11 /* RemoteData<never, number> */ = RemoteData.shape({
        foo: Succeed('foo'),
        bar: Succeed(1)
    }).map(obj => obj.bar);
    t.deepEqual(_11, Succeed(1));

    const _12 /* RemoteData<string, {
        foo: string;
        bar: {
            baz: never;
        };
    }> */ = RemoteData.shape({
        foo: Succeed('foo'),
        bar: RemoteData.shape({
            baz: Failure('err')
        })
    });
    t.deepEqual(_12, Failure('err'));

    const _13 /* RemoteData<never, {
        foo: string;
        bar: {
            baz: number;
        };
    }> */ = RemoteData.shape({
        foo: Succeed('foo'),
        bar: RemoteData.shape({
            baz: Succeed(1)
        })
    });
    t.deepEqual(
        _13,
        Succeed({
            foo: 'foo',
            bar: {
                baz: 1
            }
        })
    );
});

test('RemoteData.combine()', t => {
    const _1 /* RemoteData<never, never[]> */ = RemoteData.combine([]);
    t.deepEqual(_1, Succeed([]));

    const _2 /* RemoteData<never, never[]> */ = RemoteData.combine([ Loading ]);
    t.deepEqual(_2, Loading);

    const _3 /* RemoteData<string, never[]> */ = RemoteData.combine([ Failure('1') ]);
    t.deepEqual(_3, Failure('1'));

    const _4 /* RemoteData<never, number[]> */ = RemoteData.combine([ Succeed(1) ]);
    t.deepEqual(_4, Succeed([ 1 ]));

    const _5 /* RemoteData<string, never[]> */ = RemoteData.combine([ Failure('1'), Failure('2') ]);
    t.deepEqual(_5, Failure('1'));

    const _6 /* RemoteData<string, never[]> */ = RemoteData.combine([ Loading, Failure('2') ]);
    t.deepEqual(_6, Loading);

    const _7 /* RemoteData<string, never[]> */ = RemoteData.combine([ Failure('1'), Loading ]);
    t.deepEqual(_7, Failure('1'));

    const _8 /* RemoteData<string, number[]> */ = RemoteData.combine([ Failure('1'), Succeed(2) ]);
    t.deepEqual(_8, Failure('1'));

    const _9 /* RemoteData<string, number[]> */ = RemoteData.combine([ Succeed(1), Failure('2') ]);
    t.deepEqual(_9, Failure('2'));

    const _10 /* RemoteData<never, number[]> */ = RemoteData.combine([ Succeed(1), Succeed(2) ]);
    t.deepEqual(_10, Succeed([ 1, 2 ]));
});

test('RemoteData.prototype.isLoading()', t => {
    t.true(Loading.isLoading());

    t.false(Failure('err').isLoading());

    t.false(Succeed(1).isLoading());
});

test('RemoteData.prototype.isFailure()', t => {
    t.false(Loading.isFailure());

    t.true(Failure('err').isFailure());

    t.false(Succeed(1).isFailure());
});

test('RemoteData.prototype.isSucceed()', t => {
    t.false(Loading.isSucceed());

    t.false(Failure('err').isSucceed());

    t.true(Succeed(1).isSucceed());
});

test('RemoteData.prototype.swap()', t => {
    t.deepEqual(Loading.swap(), Loading);
    t.deepEqual(Failure('err').swap(), Succeed('err'));
    t.deepEqual(Succeed(0).swap(), Failure(0));
});

test('RemoteData.prototype.map()', t => {
    const _1 /* RemoteData<never, boolean> */ = Loading.map((a: number): boolean => a > 0);
    t.deepEqual(_1, Loading);

    const _2 /* RemoteData<string, boolean> */ = Failure('err').map((a: number): boolean => a > 0);
    t.deepEqual(_2, Failure('err'));

    const _3 /* RemoteData<never, boolean> */ = Succeed(1).map(a => a > 0);
    t.deepEqual(_3, Succeed(true));
});

test('RemoteData.prototype.mapFailure()', t => {
    const _1 /* RemoteData<number, never> */ = Loading.mapFailure((a: string): number => a.length);
    t.deepEqual(_1, Loading);

    const _2 /* RemoteData<number, never> */ = Failure('err').mapFailure(a => a.length);
    t.deepEqual(_2, Failure(3));

    const _3 /* RemoteData<number, boolean> */ = Succeed(true).mapFailure((a: string): number => a.length);
    t.deepEqual(_3, Succeed(true));
});

test('RemoteData.prototype.mapBoth()', t => {
    const _1 /* RemoteData<number, boolean> */ = Loading.mapBoth(
        (a: string): number => a.length,
        (b: number): boolean => b > 0
    );
    t.deepEqual(_1, Loading);

    const _2 /* RemoteData<number, boolean> */ = Failure('err').mapBoth(
        a => a.length,
        (b: number): boolean => b > 0
    );
    t.deepEqual(_2, Failure(3));

    const _3 /* RemoteData<number, boolean> */ = Succeed(1).mapBoth(
        (a: string): number => a.length,
        b => b > 0
    );
    t.deepEqual(_3, Succeed(true));
});

test('RemoteData.prototype.chain()', t => {
    const _1 /* RemoteData<never, never> */ = Loading.chain(() => Loading);
    t.deepEqual(_1, Loading);

    const _2 /* RemoteData<string, never> */ = Loading.chain(() => Failure('err'));
    t.deepEqual(_2, Loading);

    const _3 /* RemoteData<never, number> */ = Loading.chain(() => Succeed(0));
    t.deepEqual(_3, Loading);

    const _4 /* RemoteData<string, never> */ = Failure('err').chain(() => Loading);
    t.deepEqual(_4, Failure('err'));

    const _5 /* RemoteData<string, never> */ = Failure('err').chain(() => Failure('message'));
    t.deepEqual(_5, Failure('err'));

    const _6 /* RemoteData<string, number> */ = Failure('err').chain(() => Succeed(0));
    t.deepEqual(_6, Failure('err'));

    const _7 /* RemoteData<never, string> */ = Succeed(-1).chain(a => a > 0 ? Succeed(a.toFixed(2)) : Loading);
    t.deepEqual(_7, Loading);

    const _8 /* RemoteData<string, string> */ = Succeed(-1).chain(a => a > 0 ? Succeed(a.toFixed(2)) : Failure('err'));
    t.deepEqual(_8, Failure('err'));

    const _9 /* RemoteData<string, string> */ = Succeed(1).chain(a => a > 0 ? Succeed(a.toFixed(2)) : Failure('err'));
    t.deepEqual(_9, Succeed('1.00'));
});

test('RemoteData.prototype.orElse()', t => {
    const _1 /* RemoteData<never, never> */ = Loading.orElse(() => Loading);
    t.deepEqual(_1, Loading);

    const _2 /* RemoteData<string, never> */ = Loading.orElse(() => Failure('err'));
    t.deepEqual(_2, Failure('err'));

    const _3 /* RemoteData<never, number> */ = Loading.orElse(() => Succeed(0));
    t.deepEqual(_3, Succeed(0));

    const _4 /* RemoteData<string, never> */ = Failure('err').orElse(() => Loading);
    t.deepEqual(_4, Loading);

    const _5 /* RemoteData<string, never> */ = Failure('err').orElse(() => Failure('message'));
    t.deepEqual(_5, Failure('message'));

    const _6 /* RemoteData<string, number> */ = Failure('err').orElse(() => Succeed(0));
    t.deepEqual(_6, Succeed(0));

    const _7 /* RemoteData<never, number> */ = Succeed(1).orElse(() => Loading);
    t.deepEqual(_7, Succeed(1));

    const _8 /* RemoteData<string, number> */ = Succeed(1).orElse(() => Failure('err'));
    t.deepEqual(_8, Succeed(1));

    const _9 /* RemoteData<never, string> */ = Succeed(1).orElse(() => Succeed(2));
    t.deepEqual(_9, Succeed(1));
});

test('RemoteData.prototype.getOrElse()', t => {
    const _1 /* number */ = Loading.getOrElse(0);
    t.deepEqual(_1, 0);

    const _2 /* number */ = Failure('str').getOrElse(0);
    t.deepEqual(_2, 0);

    const _3 /* number */ = Succeed(1).getOrElse(0);
    t.deepEqual(_3, 1);
});

test('RemoteData.prototype.cata()', t => {
    const _1: RemoteData.Pattern<number, boolean, string> = {
        _: () => '_'
    };
    t.is(Loading.cata(_1), '_');
    t.is(Failure(404).cata(_1), '_');
    t.is(Succeed(true).cata(_1), '_');

    const _2: RemoteData.Pattern<number, boolean, string> = {
        Loading: () => 'Loading',
        _: () => '_'
    };
    t.is(Loading.cata(_2), 'Loading');
    t.is(Failure(404).cata(_2), '_');
    t.is(Succeed(true).cata(_2), '_');

    const _3: RemoteData.Pattern<number, boolean, string> = {
        Failure: error => `Failure(${error})`,
        _: () => '_'
    };
    t.is(Loading.cata(_3), '_');
    t.is(Failure(404).cata(_3), 'Failure(404)');
    t.is(Succeed(true).cata(_3), '_');

    const _4: RemoteData.Pattern<number, boolean, string> = {
        Succeed: value => `Succeed(${value})`,
        _: () => '_'
    };
    t.is(Loading.cata(_4), '_');
    t.is(Failure(404).cata(_4), '_');
    t.is(Succeed(true).cata(_4), 'Succeed(true)');

    const _5: RemoteData.Pattern<number, boolean, string> = {
        Loading: () => 'Loading',
        Failure: error => `Failure(${error})`,
        Succeed: value => `Succeed(${value})`
    };
    t.is(Loading.cata(_5), 'Loading');
    t.is(Failure(404).cata(_5), 'Failure(404)');
    t.is(Succeed(true).cata(_5), 'Succeed(true)');
});

test('RemoteData.prototype.toMaybe()', t => {
    t.deepEqual(Loading.toMaybe(), Maybe.Nothing);
    t.deepEqual(Failure('err').toMaybe(), Maybe.Nothing);
    t.deepEqual(Succeed(0).toMaybe(), Maybe.Just(0));
});

test('RemoteData.prototype.tap()', t => {
    const handle = (rd: RemoteData<string, number>): string => {
        return rd.map(a => a.toFixed(2)).getOrElse('0.00');
    };

    t.is(
        Loading
            .map((a: number) => a * 2)
            .tap(handle)
            .replace('.', ','),

        handle(
            Loading.map((a: number) => a * 2)
        ).replace('.', ',')
    );

    t.is(
        Failure('err')
            .map((a: number) => a * 2)
            .tap(handle)
            .replace('.', ','),

        handle(
            Failure('err').map((a: number) => a * 2)
        ).replace('.', ',')
    );

    t.is(
        Succeed(20)
            .map((a: number) => a * 2)
            .tap(handle)
            .replace('.', ','),

        handle(
            Succeed(20).map((a: number) => a * 2)
        ).replace('.', ',')
    );
});
