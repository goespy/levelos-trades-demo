import assert from "node:assert/strict";
import test from "node:test";

import { makeSessionToken } from "./session";

test("session tokens are deterministic without exposing the secret", async () => {
  const secret = "portfolio-demo-secret-that-is-long-enough";
  const first = await makeSessionToken("demo-admin", secret);
  const second = await makeSessionToken("demo-admin", secret);

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first.includes(secret), false);
});

test("session tokens change when the signing secret changes", async () => {
  const first = await makeSessionToken("demo-admin", "portfolio-demo-secret-that-is-long-enough");
  const second = await makeSessionToken("demo-admin", "different-portfolio-secret-that-is-long-enough");

  assert.notEqual(first, second);
});
