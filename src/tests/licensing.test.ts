import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import {
  activateLicenseCode,
  getDesktopLicenseStatus,
  getMachineFingerprint,
  revalidateDesktopLicenses,
  serializeLicenseCode
} from "../services/licensing";

const originalBaseDir = process.env.DSA_SHEET_HOME;
const originalPublicKey = process.env.DSA_SHEET_LICENSE_PUBLIC_KEY;
const originalBackendUrl = process.env.DSA_SHEET_UNLOCK_BACKEND_URL;
const originalFetch = global.fetch;

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;

  if (originalPublicKey === undefined) delete process.env.DSA_SHEET_LICENSE_PUBLIC_KEY;
  else process.env.DSA_SHEET_LICENSE_PUBLIC_KEY = originalPublicKey;

  if (originalBackendUrl === undefined) delete process.env.DSA_SHEET_UNLOCK_BACKEND_URL;
  else process.env.DSA_SHEET_UNLOCK_BACKEND_URL = originalBackendUrl;

  global.fetch = originalFetch;
});

test("machine-bound license activation unlocks the requested topics", { concurrency: false }, () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-license-test-"));

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.DSA_SHEET_LICENSE_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();

  const { machineHash } = getMachineFingerprint();
  const code = serializeLicenseCode({
    version: 1,
    codeId: "test-license",
    email: "alice@example.com",
    machineHash,
    topicIds: ["trees", "graphs"],
    planId: "starter-pass",
    issuedAt: new Date("2026-08-09T00:00:00.000Z").toISOString(),
    startsAt: new Date("2026-08-09T00:00:00.000Z").toISOString(),
    expiresAt: new Date("2026-09-09T00:00:00.000Z").toISOString()
  }, privateKey.export({ type: "pkcs8", format: "pem" }).toString());

  const result = activateLicenseCode("alice@example.com", code);
  assert.equal(result.success, true);
  assert.equal(result.status.topicAccess.trees.access, "free");
  assert.equal(result.status.topicAccess.graphs.access, "unlocked");
  assert.equal(result.status.topicAccess.arrays.access, "locked");
  assert.equal(getDesktopLicenseStatus().activeLicenses.length, 1);
});

test("license activation rejects a code issued for another machine", { concurrency: false }, () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-license-machine-test-"));

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.DSA_SHEET_LICENSE_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();

  const code = serializeLicenseCode({
    version: 1,
    codeId: "wrong-machine",
    email: "alice@example.com",
    machineHash: "not-the-current-machine",
    topicIds: ["trees"],
    planId: "starter-pass",
    issuedAt: new Date("2026-08-09T00:00:00.000Z").toISOString(),
    startsAt: new Date("2026-08-09T00:00:00.000Z").toISOString(),
    expiresAt: new Date("2026-09-09T00:00:00.000Z").toISOString()
  }, privateKey.export({ type: "pkcs8", format: "pem" }).toString());

  const result = activateLicenseCode("alice@example.com", code);
  assert.equal(result.success, false);
  assert.match(result.message, /different machine/i);
});

test("desktop revalidation removes revoked licenses after backend confirmation", { concurrency: false }, async () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-license-revalidate-"));
  process.env.DSA_SHEET_UNLOCK_BACKEND_URL = "http://127.0.0.1:8787";

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.DSA_SHEET_LICENSE_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();

  const { machineHash } = getMachineFingerprint();
  const code = serializeLicenseCode({
    version: 1,
    codeId: "revoked-license",
    email: "alice@example.com",
    machineHash,
    topicIds: ["trees"],
    planId: "starter-pass",
    issuedAt: new Date("2026-08-10T00:00:00.000Z").toISOString(),
    startsAt: new Date("2026-08-10T00:00:00.000Z").toISOString(),
    expiresAt: new Date("2026-09-10T00:00:00.000Z").toISOString()
  }, privateKey.export({ type: "pkcs8", format: "pem" }).toString());

  const activated = activateLicenseCode("alice@example.com", code);
  assert.equal(activated.success, true);
  assert.equal(getDesktopLicenseStatus().topicAccess.trees.access, "free");

  global.fetch = async () => new Response(JSON.stringify({
    validatedAt: "2026-08-11T00:00:00.000Z",
    activeCodeIds: [],
    revokedCodeIds: ["revoked-license"],
    replacedCodeIds: [],
    expiredCodeIds: [],
    missingCodeIds: []
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  }) as typeof fetch extends (...args: any[]) => infer R ? Awaited<R> : never;

  const status = await revalidateDesktopLicenses();
  assert.equal(status.topicAccess.trees.access, "free");
  assert.equal(status.activeLicenses.length, 0);
  assert.match(status.lastValidationMessage ?? "", /removed/i);
});
