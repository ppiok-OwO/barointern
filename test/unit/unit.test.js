import assert from "node:assert";
import {
  isCustomerGiveUp,
  isSlidingWindowViolated,
  isValidEmail,
} from "../../src/utils/validator.js";

console.log("unit.test.js");

(() => {
  assert.strictEqual(isValidEmail("user@test.com"), true);
  assert.strictEqual(isValidEmail("invalid-email"), false);

  const now = Date.now();
  const tooFast = [now - 900, now - 800, now - 700, now - 600];
  const safe = [now - 2000, now - 1500, now - 1200];

  assert.strictEqual(isSlidingWindowViolated(tooFast), true);
  assert.strictEqual(isSlidingWindowViolated(safe), false);

  const inactive = now - 12000;
  const active = now - 3000;

  assert.strictEqual(isCustomerGiveUp(inactive), true);
  assert.strictEqual(isCustomerGiveUp(active), false);
})();
