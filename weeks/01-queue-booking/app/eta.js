// Wait-time estimation. Pure functions, no I/O, so they're easy to test.
//
// Each doctor has a default consultation length set by the clinic. Real
// consultation durations gradually take over from it: the default acts like
// PRIOR_WEIGHT imaginary visits (Bayesian shrinkage toward the default).
// With 0 real visits the estimate is the default; with 30 it's mostly real data.

const PRIOR_WEIGHT = 3;
const MIN_PLAUSIBLE = 2;   // minutes. Shorter usually means a mis-click
const MAX_PLAUSIBLE = 60;  // minutes. Longer usually means staff forgot to press "done"
const MIN_REMAINING_SHARE = 0.25; // an overrunning consultation still has some time left

function estimateConsultMinutes(defaultMinutes, durations) {
  const clean = durations.filter((d) => d >= MIN_PLAUSIBLE && d <= MAX_PLAUSIBLE);
  const sum = clean.reduce((a, b) => a + b, 0);
  return (PRIOR_WEIGHT * defaultMinutes + sum) / (PRIOR_WEIGHT + clean.length);
}

// avg: estimated minutes per consultation
// peopleAhead: patients waiting before this one
// currentElapsed: minutes since the patient currently inside was called (null if nobody is inside)
function estimateWaitMinutes({ avg, peopleAhead, currentElapsed }) {
  const currentRemaining =
    currentElapsed == null ? 0 : Math.max(avg - currentElapsed, avg * MIN_REMAINING_SHARE);
  return currentRemaining + peopleAhead * avg;
}

module.exports = { estimateConsultMinutes, estimateWaitMinutes, PRIOR_WEIGHT, MIN_PLAUSIBLE, MAX_PLAUSIBLE };
