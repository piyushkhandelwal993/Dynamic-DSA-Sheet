import fs from "fs";
import crypto from "crypto";

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "true";
    args[key] = value;
  }
  return args;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

const args = parseArgs(process.argv);
const email = normalizeEmail(args.email ?? "");
const machine = (args.machine ?? "").trim().toLowerCase();
const topics = (args.topics ?? "").split(",").map((item) => item.trim()).filter(Boolean);
const planId = (args.plan ?? "manual-topic-pass").trim();
const durationDays = Number(args.days ?? "30");
const privateKeyPath = args["private-key-path"] ?? process.env.DSA_SHEET_LICENSE_PRIVATE_KEY_PATH ?? "";
const privateKeyInline = process.env.DSA_SHEET_LICENSE_PRIVATE_KEY ?? "";

if (!email || !machine || !topics.length || !Number.isFinite(durationDays) || durationDays <= 0) {
  console.error("Usage: node scripts/issue-license.mjs --email user@example.com --machine MACHINEHASH --topics arrays,trees [--plan all-topics-30d] [--days 30] [--private-key-path /path/to/private.pem]");
  process.exit(1);
}

const privateKeyPem = privateKeyInline || (privateKeyPath ? fs.readFileSync(privateKeyPath, "utf-8") : "");
if (!privateKeyPem) {
  console.error("Provide DSA_SHEET_LICENSE_PRIVATE_KEY or --private-key-path / DSA_SHEET_LICENSE_PRIVATE_KEY_PATH.");
  process.exit(1);
}

const issuedAt = new Date().toISOString();
const startsAt = issuedAt;
const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
const claims = {
  version: 1,
  codeId: crypto.randomUUID(),
  email,
  machineHash: machine,
  topicIds: topics,
  planId,
  issuedAt,
  startsAt,
  expiresAt
};

const payloadSegment = base64UrlEncode(JSON.stringify(claims));
const privateKey = crypto.createPrivateKey(privateKeyPem);
const signature = crypto.sign("sha256", Buffer.from(payloadSegment, "utf-8"), privateKey);
const code = `DSA1.${payloadSegment}.${base64UrlEncode(signature)}`;

console.log(JSON.stringify({
  email,
  machine,
  planId,
  topics,
  expiresAt,
  code
}, null, 2));
