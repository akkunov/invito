import "reflect-metadata";
import {test} from "node:test";
import assert from "node:assert/strict";
import {generateKeyPair, exportJWK, importJWK, jwtVerify, SignJWT} from "jose";
import {assertSupabaseUserClaims} from "../src/modules/auth/auth.service.js";

const issuer = "https://project-ref.supabase.co/auth/v1";
const subject = "6e1a52fb-9e92-471f-9ae9-252276291ff9";
const sessionId = "6b1b42f7-7100-441b-a155-dc2d4f345a27";

test("Supabase Auth: asymmetric ES256 user JWT, issuer and audience", async () => {
  const {privateKey, publicKey} = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const publicCryptoKey = await importJWK({...jwk, alg: "ES256"}, "ES256");
  const make = async (body: Record<string, unknown>, aud = "authenticated", iss = issuer) =>
    new SignJWT(body).setProtectedHeader({alg: "ES256", kid: "supabase-test-key"})
      .setIssuer(iss).setAudience(aud).setSubject(subject)
      .setIssuedAt().setExpirationTime("1h").sign(privateKey);

  const valid = await make({role:"authenticated",session_id:sessionId,email:"user@example.com"});
  const {payload} = await jwtVerify(valid, publicCryptoKey, {
    issuer,audience:"authenticated",algorithms:["ES256","RS256"],maxTokenAge:"2h",
  });
  assert.doesNotThrow(() => assertSupabaseUserClaims(payload));

  await assert.rejects(jwtVerify(await make({role:"authenticated",session_id:sessionId},"anon"),
    publicCryptoKey,{issuer,audience:"authenticated",algorithms:["ES256","RS256"]}));
  await assert.rejects(jwtVerify(await make({role:"authenticated",session_id:sessionId},"authenticated","https://evil.example/auth/v1"),
    publicCryptoKey,{issuer,audience:"authenticated",algorithms:["ES256","RS256"]}));
  await assert.rejects(jwtVerify(valid+"tampered",publicCryptoKey,{issuer,audience:"authenticated",algorithms:["ES256","RS256"]}));

  for (const bad of [
    {role:"anon",session_id:sessionId},
    {role:"service_role",session_id:sessionId},
    {role:"authenticated"},
    {role:"authenticated",session_id:"not-a-uuid"},
    {role:"authenticated",session_id:sessionId,is_anonymous:true},
    {role:"authenticated",session_id:sessionId,sub:"not-uuid"},
  ]) {
    const claims = {sub:subject, ...bad};
    assert.throws(() => assertSupabaseUserClaims(claims), {message: "INVALID_SUPABASE_SESSION"});
  }

  const {privateKey: hsPrivate} = {privateKey: new TextEncoder().encode("test-only-hs256-secret-32-bytes-1234")};
  const forged = await new SignJWT({role:"authenticated",session_id:sessionId})
    .setProtectedHeader({alg:"HS256"})
    .setIssuer(issuer).setAudience("authenticated").setSubject(subject)
    .setIssuedAt().setExpirationTime("1h").sign(hsPrivate);
  await assert.rejects(jwtVerify(forged, publicCryptoKey, {issuer,audience:"authenticated",algorithms:["ES256","RS256"]}),
    "HS256 must never be accepted by the API");
});
