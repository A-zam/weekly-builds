const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateConsultMinutes, estimateWaitMinutes } = require('../eta');

test('with no history the estimate equals the default', () => {
  assert.equal(estimateConsultMinutes(15, []), 15);
});

test('real durations pull the estimate away from the default', () => {
  const est = estimateConsultMinutes(15, Array(30).fill(10));
  assert.ok(est > 10 && est < 11, `expected ~10.5, got ${est}`);
});

test('implausible durations (mis-clicks, forgotten "done") are ignored', () => {
  assert.equal(estimateConsultMinutes(15, [0.5, 1, 95, 240]), 15);
});

test('wait = remaining time of current visit + people ahead × avg', () => {
  assert.equal(estimateWaitMinutes({ avg: 10, peopleAhead: 3, currentElapsed: 4 }), 6 + 30);
});

test('nobody inside and nobody ahead means no wait', () => {
  assert.equal(estimateWaitMinutes({ avg: 10, peopleAhead: 0, currentElapsed: null }), 0);
});

test('an overrunning visit still counts a little remaining time', () => {
  assert.equal(estimateWaitMinutes({ avg: 10, peopleAhead: 0, currentElapsed: 25 }), 2.5);
});
