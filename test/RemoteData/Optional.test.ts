import test from 'ava';

import Maybe from '../../src/Maybe';
import RemoteData, { NotAsked, Loading, Failure, Succeed } from '../../src/RemoteData/Optional';

test('RemoteData.shape()', t => {
    const _1 /* RemoteData<never, {
        foo: never;
    }> */ = RemoteData.shape({
        foo: NotAsked
    });
    t.deepEqual(_1, NotAsked);

    const _2 /* RemoteData<never, {
        foo: never;
        bar: never;
    }> */ = RemoteData.shape({
        foo: NotAsked,
        bar: Failure('err2')
    });
    t.deepEqual(_2, NotAsked);
});

test('RemoteData.combine()', t => {
    const _1 /* RemoteData<never, never[]> */ = RemoteData.combine([ NotAsked ]);
    t.deepEqual(_1, NotAsked);

    const _2 /* RemoteData<string, never[]> */ = RemoteData.combine([ NotAsked, Failure('2') ]);
    t.deepEqual(_2, NotAsked);
});

test('RemoteData.prototype.isNotAsked()', t => {
    t.true(NotAsked.isNotAsked());
    t.false(Loading.isNotAsked());
    t.false(Failure('err').isNotAsked());
    t.false(Succeed(1).isNotAsked());
});

test('RemoteData.prototype.isLoading()', t => {
    t.false(NotAsked.isLoading());
});

test('RemoteData.prototype.isFailure()', t => {
    t.false(NotAsked.isFailure());
});

test('RemoteData.prototype.isSucceed()', t => {
    t.false(NotAsked.isSucceed());
});

test('RemoteData.prototype.swap()', t => {
    t.deepEqual(NotAsked.swap(), NotAsked);
});

test('RemoteData.prototype.map()', t => {
    const _1 /* RemoteData<never, boolean> */ = NotAsked.map((a: number): boolean => a > 0);
    t.deepEqual(_1, NotAsked);
});

test('RemoteData.prototype.mapFailure()', t => {
    const _1 /* RemoteData<number, never> */ = NotAsked.mapFailure((a: string): number => a.length);
    t.deepEqual(_1, NotAsked);
});

test('RemoteData.prototype.mapBoth()', t => {
    const _1 /* RemoteData<number, boolean> */ = NotAsked.mapBoth(
        (a: string): number => a.length,
        (b: number): boolean => b > 0
    );
    t.deepEqual(_1, NotAsked);
});

test('RemoteData.prototype.chain()', t => {
    const _1 /* RemoteData<never, never> */ = NotAsked.chain(() => NotAsked);
    t.deepEqual(_1, NotAsked);

    const _2 /* RemoteData<string, never> */ = NotAsked.chain(() => Loading);
    t.deepEqual(_2, NotAsked);

    const _3 /* RemoteData<string, never> */ = NotAsked.chain(() => Failure('err'));
    t.deepEqual(_3, NotAsked);

    const _4 /* RemoteData<never, number> */ = NotAsked.chain(() => Succeed(0));
    t.deepEqual(_4, NotAsked);
});

test('RemoteData.prototype.orElse()', t => {
    const _1 /* RemoteData<never, never> */ = NotAsked.orElse(() => NotAsked);
    t.deepEqual(_1, NotAsked);

    const _2 /* RemoteData<string, never> */ = NotAsked.orElse(() => Loading);
    t.deepEqual(_2, Loading);

    const _3 /* RemoteData<string, never> */ = NotAsked.orElse(() => Failure('err'));
    t.deepEqual(_3, Failure('err'));

    const _4 /* RemoteData<never, number> */ = NotAsked.orElse(() => Succeed(0));
    t.deepEqual(_4, Succeed(0));
});

test('RemoteData.prototype.getOrElse()', t => {
    const _1 /* number */ = NotAsked.getOrElse(0);
    t.deepEqual(_1, 0);
});

test('RemoteData.prototype.cata()', t => {
    const _1: RemoteData.Pattern<number, boolean, string> = {
        _: () => '_'
    };
    t.is(NotAsked.cata(_1), '_');
    t.is(Loading.cata(_1), '_');
    t.is(Failure(404).cata(_1), '_');
    t.is(Succeed(true).cata(_1), '_');

    const _2: RemoteData.Pattern<number, boolean, string> = {
        NotAsked: () => 'NotAsked',
        _: () => '_'
    };
    t.is(NotAsked.cata(_2), 'NotAsked');
    t.is(Loading.cata(_2), '_');
    t.is(Failure(404).cata(_2), '_');
    t.is(Succeed(true).cata(_2), '_');

    const _3: RemoteData.Pattern<number, boolean, string> = {
        Loading: () => 'Loading',
        _: () => '_'
    };
    t.is(NotAsked.cata(_3), '_');
    t.is(Loading.cata(_3), 'Loading');
    t.is(Failure(404).cata(_3), '_');
    t.is(Succeed(true).cata(_3), '_');

    const _4: RemoteData.Pattern<number, boolean, string> = {
        Failure: error => `Failure(${error})`,
        _: () => '_'
    };
    t.is(NotAsked.cata(_4), '_');
    t.is(Loading.cata(_4), '_');
    t.is(Failure(404).cata(_4), 'Failure(404)');
    t.is(Succeed(true).cata(_4), '_');

    const _5: RemoteData.Pattern<number, boolean, string> = {
        Succeed: value => `Succeed(${value})`,
        _: () => '_'
    };
    t.is(NotAsked.cata(_5), '_');
    t.is(Loading.cata(_5), '_');
    t.is(Failure(404).cata(_5), '_');
    t.is(Succeed(true).cata(_5), 'Succeed(true)');

    const _6: RemoteData.Pattern<number, boolean, string> = {
        NotAsked: () => 'NotAsked',
        Loading: () => 'Loading',
        Failure: error => `Failure(${error})`,
        Succeed: value => `Succeed(${value})`
    };
    t.is(NotAsked.cata(_6), 'NotAsked');
    t.is(Loading.cata(_6), 'Loading');
    t.is(Failure(404).cata(_6), 'Failure(404)');
    t.is(Succeed(true).cata(_6), 'Succeed(true)');
});

test('RemoteData.prototype.toMaybe()', t => {
    t.deepEqual(NotAsked.toMaybe(), Maybe.Nothing);
});

test('RemoteData.prototype.tap()', t => {
    const handle = (rd: RemoteData<string, number>): string => {
        return rd.map(a => a.toFixed(2)).getOrElse('0.00');
    };

    t.is(
        NotAsked
            .map((a: number) => a * 2)
            .tap(handle)
            .replace('.', ','),

        handle(
            NotAsked.map((a: number) => a * 2)
        ).replace('.', ',')
    );
});
