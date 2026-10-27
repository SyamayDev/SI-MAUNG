import { test } from "node:test";
import assert from "node:assert/strict";
import { toUserMessage } from "./errors.js";

test("wrong credentials are reported as such", () => {
  assert.equal(toUserMessage({ message: "Invalid login credentials", status: 400 }), "Email atau kata sandi salah.");
});

test("a wrong project key is not mistaken for an expired session", () => {
  const msg = toUserMessage({ message: "Invalid API key", status: 401 });
  assert.match(msg, /kunci API tidak valid/);
  assert.doesNotMatch(msg, /Sesi Anda berakhir/);
});

test("an expired session still asks the user to sign in again", () => {
  assert.equal(toUserMessage({ message: "JWT expired", status: 401 }), "Sesi Anda berakhir. Silakan masuk lagi.");
});

test("network failures and raw database errors get safe messages", () => {
  assert.match(toUserMessage(new TypeError("Failed to fetch")), /Tidak dapat terhubung/);
  assert.equal(toUserMessage({ message: 'relation "public.secret_table" does not exist', code: "42P01" }), "Terjadi kesalahan. Silakan coba lagi.");
});
