import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { confirmPaymentAndIssueLicense, getLicenseBackendStore, resetMachineAndReissueCode } from "../services/licenseBackend";

const originalServerHome = process.env.DSA_SHEET_LICENSE_SERVER_HOME;
const originalPrivateKey = process.env.DSA_SHEET_LICENSE_PRIVATE_KEY;
const originalPlans = process.env.DSA_SHEET_LICENSE_PLANS_JSON;

test.after(() => {
  if (originalServerHome === undefined) delete process.env.DSA_SHEET_LICENSE_SERVER_HOME;
  else process.env.DSA_SHEET_LICENSE_SERVER_HOME = originalServerHome;

  if (originalPrivateKey === undefined) delete process.env.DSA_SHEET_LICENSE_PRIVATE_KEY;
  else process.env.DSA_SHEET_LICENSE_PRIVATE_KEY = originalPrivateKey;

  if (originalPlans === undefined) delete process.env.DSA_SHEET_LICENSE_PLANS_JSON;
  else process.env.DSA_SHEET_LICENSE_PLANS_JSON = originalPlans;
});

test("manual payment confirmation issues a license and writes an email outbox record", async () => {
  process.env.DSA_SHEET_LICENSE_SERVER_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-license-backend-"));
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  process.env.DSA_SHEET_LICENSE_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.DSA_SHEET_LICENSE_PLANS_JSON = JSON.stringify([
    { id: "trees-30d", name: "Trees 30 days", topicIds: ["trees"], durationDays: 30, priceInr: 199 }
  ]);

  const result = await confirmPaymentAndIssueLicense({
    provider: "manual",
    paymentId: "pay_001",
    amountInr: 199,
    email: "learner@example.com",
    machineHash: "abc123machine",
    planId: "trees-30d"
  });

  assert.equal(result.license.email, "learner@example.com");
  assert.equal(result.license.topicIds[0], "trees");
  assert.match(result.license.code, /^DSA1\./);

  const store = getLicenseBackendStore();
  assert.equal(store.payments.length, 1);
  assert.equal(store.licenses.length, 1);
  assert.equal(store.emails.length, 1);
});

test("machine reset replaces the previous active license with a new machine-bound code", async () => {
  process.env.DSA_SHEET_LICENSE_SERVER_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-license-reset-"));
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  process.env.DSA_SHEET_LICENSE_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  process.env.DSA_SHEET_LICENSE_PLANS_JSON = JSON.stringify([
    { id: "graphs-30d", name: "Graphs 30 days", topicIds: ["graphs"], durationDays: 30, priceInr: 249 }
  ]);

  const initial = await confirmPaymentAndIssueLicense({
    provider: "manual",
    paymentId: "pay_002",
    amountInr: 249,
    email: "learner@example.com",
    machineHash: "oldmachine",
    planId: "graphs-30d"
  });

  const reset = await resetMachineAndReissueCode({
    email: "learner@example.com",
    newMachineHash: "newmachine",
    reason: "device-upgrade"
  });

  assert.equal(reset.previousLicense.codeId, initial.license.codeId);
  assert.equal(reset.replacementLicense.machineHash, "newmachine");
  assert.notEqual(reset.replacementLicense.codeId, initial.license.codeId);

  const store = getLicenseBackendStore();
  const previous = store.licenses.find((item) => item.codeId === initial.license.codeId);
  const replacement = store.licenses.find((item) => item.codeId === reset.replacementLicense.codeId);
  assert.equal(previous?.status, "replaced");
  assert.equal(replacement?.status, "active");
  assert.equal(store.resets.length, 1);
});
