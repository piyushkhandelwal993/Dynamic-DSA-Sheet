import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { activateLicenseCode, getDesktopLicenseStatus, getMachineFingerprint, serializeLicenseCode } from "../services/licensing";

const originalBaseDir = process.env.DSA_SHEET_HOME;
const originalPublicKey = process.env.DSA_SHEET_LICENSE_PUBLIC_KEY;

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;

  if (originalPublicKey === undefined) delete process.env.DSA_SHEET_LICENSE_PUBLIC_KEY;
  else process.env.DSA_SHEET_LICENSE_PUBLIC_KEY = originalPublicKey;
});

test("machine-bound license activation unlocks the requested topics", () => {
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
  assert.equal(result.status.topicAccess.trees.access, "unlocked");
  assert.equal(result.status.topicAccess.graphs.access, "unlocked");
  assert.equal(result.status.topicAccess.arrays.access, "free");
  assert.equal(getDesktopLicenseStatus().activeLicenses.length, 1);
});

test("license activation rejects a code issued for another machine", () => {
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
