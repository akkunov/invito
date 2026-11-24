import assert from "node:assert/strict";
import {test} from "node:test";
import {authCallbackUrl, authReturnPath} from "../src/features/auth/return-path.ts";

test("OAuth return paths preserve valid draft links and remove arbitrary query parameters", () => {
  const draft = "0ed185da-035a-4bb9-8613-2f5a7ff7816d";
  const path = "/ky/editor?draft=" + draft + "&template=love-story&auth=failed&redirect=https%3A%2F%2Fexample.org";
  const expected = "/ky/editor?template=love-story&draft=" + draft;
  assert.equal(authReturnPath(path, "ky"), expected);
  const callback = new URL(authCallbackUrl("https://eventiq.example", path, "ky"));
  assert.equal(callback.origin, "https://eventiq.example");
  assert.equal(callback.pathname, "/ky/auth/callback");
  assert.equal(callback.searchParams.get("next"), expected);
});

test("OAuth return paths accept only Eventiq customer routes in the requested locale", () => {
  for (const candidate of [
    "https://evil.example/ru/editor",
    "//evil.example",
    "/\\evil.example",
    "/ru/editor%2f..%2fauth",
    "/ky/account",
    "/ru/admin/studio-v2",
    "/ru/auth/callback",
    "/ru/editor?template=%2F%2Fevil.example",
    "/ru/editor?template=abc%0D%0ALocation%3A",
    "/ru/editor\u0000",
  ]) assert.equal(authReturnPath(candidate, "ru"), "/ru/invitations", candidate);
  assert.equal(authReturnPath("/ru/account#guest", "ru"), "/ru/account");
  assert.equal(authReturnPath("/ru/editor?template=shyrdak&draft=bad", "ru"), "/ru/editor?template=shyrdak");
});
