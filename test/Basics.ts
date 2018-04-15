import test from 'ava';

import {
    Order,
    LT,
    EQ,
    GT,
    compare
} from '../src/Basics';

test('Basics.Order.prototype.isLT', t => {
    t.true(LT.isLT());
    t.false(EQ.isLT());
    t.false(GT.isLT());
});

test('Basics.Order.prototype.isEQ', t => {
    t.false(LT.isEQ());
    t.true(EQ.isEQ());
    t.false(GT.isEQ());
});

test('Basics.Order.prototype.isGT', t => {
    t.false(LT.isGT());
    t.false(EQ.isGT());
    t.true(GT.isGT());
});

test('Basics.Order.prototype.cata()', t => {
    const pattern: Order.Pattern<number> = {
        LT: () => -1,
        EQ: () => 0,
        GT: () => 1
    };

    t.is(LT.cata(pattern), -1);
    t.is(EQ.cata(pattern), 0);
    t.is(GT.cata(pattern), 1);
});

test('Basics.compare()', t => {
    t.deepEqual(compare(0, 1), LT);
    t.deepEqual(compare(0, 0), EQ);
    t.deepEqual(compare(1, 0), GT);

    t.deepEqual(compare('a', 'b'), LT);
    t.deepEqual(compare('a', 'a'), EQ);
    t.deepEqual(compare('b', 'a'), GT);
});
