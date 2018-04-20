import test from 'ava';

import {
    Record
} from '../src/Record';

test('Record.isRecord()', t => {
    t.false(Record.isRecord(null));
    t.false(Record.isRecord(undefined));
    t.false(Record.isRecord(''));
    t.false(Record.isRecord(0));
    t.false(Record.isRecord(false));
    t.false(Record.isRecord(false));
    t.false(Record.isRecord([]));
    t.false(Record.isRecord({}));
    t.true(Record.isRecord(Record.of({})));
});

test('Record.of() & Record.prototype.toObject()', t => {
    t.deepEqual(Record.of({}).toObject(), {});
    t.deepEqual(Record.of({ foo: 0 }).toObject(), { foo: 0 });
    t.deepEqual(Record.of({ foo: 'str' }).toObject(), { foo: 'str' });
    t.deepEqual(Record.of({ foo: true }).toObject(), { foo: true });
    t.deepEqual(
        Record.of({
            foo: {
                bar: 0
            },
            baz: [ 1, 2 ]
        }).toObject(),
        {
            foo: {
                bar: 0
            },
            baz: [ 1, 2 ]
        }
    );

    const object = {
        foo: {
            bar: 'str'
        },
        baz: [ 1, 2 ]
    };
    const record = Record.of(object);

    t.deepEqual(
        record.toObject(),
        {
            foo: {
                bar: 'str'
            },
            baz: [ 1, 2 ]
        }
    );
    t.not(record.toObject(), object);
    t.deepEqual(
        object,
        {
            foo: {
                bar: 'str'
            },
            baz: [ 1, 2 ]
        },
        'Object hasn\'t been mutated'
    );
});

test('Record.toObject()', t => {
    t.deepEqual(
        Record.toObject(Record.of({})),
        {}
    );
    t.deepEqual(
        Record.toObject({}),
        {}
    );

    t.deepEqual(
        Record.toObject(Record.of({ foo: 0 })),
        { foo: 0 }
    );
    t.deepEqual(
        Record.toObject({ foo: 0 }),
        { foo: 0 }
    );

    t.deepEqual(
        Record.toObject(Record.of({ foo: 'str' })),
        { foo: 'str' }
    );
    t.deepEqual(
        Record.toObject({ foo: 'str' }),
        { foo: 'str' }
    );

    t.deepEqual(
        Record.toObject(Record.of({ foo: true })),
        { foo: true }
    );
    t.deepEqual(
        Record.toObject({ foo: true }),
        { foo: true }
    );

    t.deepEqual(
        Record.toObject(Record.of({ foo: { bar: 0 }, baz: [ 1, 2 ]})),
        { foo: { bar: 0 }, baz: [ 1, 2 ]}
    );
    t.deepEqual(
        Record.toObject({ foo: { bar: 0 }, baz: [ 1, 2 ]}),
        { foo: { bar: 0 }, baz: [ 1, 2 ]}
    );

    const object = { foo: { bar: 0 }, baz: [ 1, 2 ]};
    const record = Record.of(object);

    t.deepEqual(
        Record.toObject(object),
        { foo: { bar: 0 }, baz: [ 1, 2 ]}
    );
    t.is(Record.toObject(object), object);
    t.deepEqual(
        object,
        { foo: { bar: 0 }, baz: [ 1, 2 ]},
        'Object hasn\'t been mutated'
    );

    t.deepEqual(
        Record.toObject(record),
        { foo: { bar: 0 }, baz: [ 1, 2 ]}
    );
    t.not(Record.toObject(record), object);
    t.deepEqual(
        record,
        Record.of({ foo: { bar: 0 }, baz: [ 1, 2 ]}),
        'Record hasn\'t been mutated'
    );
});

test('Record.prototype.get()', t => {
    const nested = Record.of({
        foo: false,
        bar: 1
    });
    const record = Record.of({
        foo: 0,
        bar: 'str',
        baz: nested
    });

    t.is(record.get('foo'), 0);
    t.is(record.get('baz'), nested);
    t.deepEqual(
        record.get('baz'),
        Record.of({
            foo: false,
            bar: 1
        })
    );
    t.is(record.get('baz').get('foo'), false);
    t.deepEqual(
        record,
        Record.of({
            foo: 0,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
});

test('Record.prototype.set()', t => {
    const nested = Record.of({
        foo: false,
        bar: 1
    });
    const record = Record.of({
        foo: 0,
        bar: 'str',
        baz: nested
    });

    const result1 = record.set('foo', 1);

    t.deepEqual(
        result1,
        Record.of({
            foo: 1,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
    t.not(result1, record);
    t.is(result1.get('baz'), nested);

    const result2 = record.set('baz', Record.of({
        foo: true,
        bar: 2
    }));

    t.deepEqual(
        result2,
        Record.of({
            foo: 0,
            bar: 'str',
            baz: Record.of({
                foo: true,
                bar: 2
            })
        })
    );
    t.not(result2, record);
    t.not(result2.get('baz'), nested);
    t.deepEqual(
        nested,
        Record.of({
            foo: false,
            bar: 1
        })
    );

    const result3 = record.set('foo', 0);

    t.deepEqual(
        result3,
        Record.of({
            foo: 0,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
    t.is(result3, record);
});

test('Record.prototype.update()', t => {
    const nested = Record.of({
        foo: false,
        bar: 1
    });
    const record = Record.of({
        foo: 2,
        bar: 'str',
        baz: nested
    });

    const result1 = record.update('foo', a => a * 2);

    t.deepEqual(
        result1,
        Record.of({
            foo: 4,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
    t.not(result1, record);
    t.is(result1.get('baz'), nested);

    const result2 = record.update('baz', a => Record.of({
        foo: !a.get('foo'),
        bar: a.get('bar') + 3
    }));

    t.deepEqual(
        result2,
        Record.of({
            foo: 2,
            bar: 'str',
            baz: Record.of({
                foo: true,
                bar: 4
            })
        })
    );
    t.not(result2, record);
    t.not(result2.get('baz'), nested);
    t.deepEqual(
        nested,
        Record.of({
            foo: false,
            bar: 1
        })
    );

    const result3 = record.update('baz', a => a.update('foo', b => !b).set('bar', 4));

    t.deepEqual(
        result3,
        Record.of({
            foo: 2,
            bar: 'str',
            baz: Record.of({
                foo: true,
                bar: 4
            })
        })
    );
    t.not(result3, record);
    t.not(result3.get('baz'), nested);
    t.deepEqual(
        nested,
        Record.of({
            foo: false,
            bar: 1
        })
    );
});

test('Record.prototype.assign()', t => {
    const nested = Record.of({
        foo: false,
        bar: 1
    });
    const record = Record.of({
        foo: 2,
        bar: 'str',
        baz: nested
    });

    const result1 = record.assign({});

    t.deepEqual(
        result1,
        Record.of({
            foo: 2,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
    t.is(result1, record);

    const result2 = record.assign({
        foo: 0,
        baz: record.get('baz').assign({
            foo: true
        })
    });

    t.deepEqual(
        result2,
        Record.of({
            foo: 0,
            bar: 'str',
            baz: Record.of({
                foo: true,
                bar: 1
            })
        })
    );
    t.deepEqual(
        record,
        Record.of({
            foo: 2,
            bar: 'str',
            baz: Record.of({
                foo: false,
                bar: 1
            })
        })
    );
    t.deepEqual(
        nested,
        Record.of({
            foo: false,
            bar: 1
        })
    );
});
