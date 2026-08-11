import fs from "fs";
import path from "path";
import crypto from "crypto";
import { LicenseClaims } from "../types";
import { resolveBaseDir } from "./paths";
import { serializeLicenseCode } from "./licensing";

export interface LicensePlan {
  id: string;
  name: string;
  topicIds: string[];
  durationDays: number;
  priceInr?: number;
}

export interface PaymentConfirmationInput {
  provider: string;
  paymentId: string;
  orderId?: string;
  amountInr: number;
  email: string;
  machineHash: string;
  planId: string;
  metadata?: Record<string, string>;
}

export interface IssuedLicenseRecord {
  codeId: string;
  paymentId: string;
  email: string;
  machineHash: string;
  planId: string;
  topicIds: string[];
  code: string;
  issuedAt: string;
  startsAt: string;
  expiresAt: string;
  status: "active" | "replaced";
  replacedByCodeId?: string;
}

export interface PaymentRecord {
  id: string;
  provider: string;
  paymentId: string;
  orderId?: string;
  amountInr: number;
  email: string;
  machineHash: string;
  planId: string;
  confirmedAt: string;
  metadata: Record<string, string>;
}

export interface EmailOutboxRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  delivery: "outbox" | "resend";
}

export interface MachineResetRecord {
  id: string;
  previousCodeId: string;
  newCodeId: string;
  email: string;
  previousMachineHash: string;
  newMachineHash: string;
  resetAt: string;
  reason: string;
}

export interface LicenseBackendStore {
  schemaVersion: 1;
  payments: PaymentRecord[];
  licenses: IssuedLicenseRecord[];
  emails: EmailOutboxRecord[];
  resets: MachineResetRecord[];
}

export interface PaymentConfirmationResult {
  payment: PaymentRecord;
  license: IssuedLicenseRecord;
  emailDelivery: "outbox" | "resend";
}

export interface MachineResetResult {
  previousLicense: IssuedLicenseRecord;
  replacementLicense: IssuedLicenseRecord;
  emailDelivery: "outbox" | "resend";
}

export interface CheckoutSessionInput {
  provider: "razorpay" | "cashfree";
  email: string;
  machineHash: string;
  planId: string;
  customerName?: string;
  customerPhone?: string;
  successRedirectUrl?: string;
}

export interface CheckoutSessionResult {
  provider: "razorpay" | "cashfree";
  paymentLinkId: string;
  paymentUrl: string;
  referenceId: string;
  expiresAt?: string;
}

const STORE_SCHEMA_VERSION = 1;

function getServerHome(): string {
  return process.env.DSA_SHEET_LICENSE_SERVER_HOME?.trim()
    ? path.resolve(process.env.DSA_SHEET_LICENSE_SERVER_HOME)
    : path.join(resolveBaseDir(), "license-server");
}

function getStorePath(): string {
  return path.join(getServerHome(), "store.json");
}

function getEmailOutboxDir(): string {
  return path.join(getServerHome(), "email-outbox");
}

function ensureBackendStructure(): void {
  fs.mkdirSync(getServerHome(), { recursive: true });
  fs.mkdirSync(getEmailOutboxDir(), { recursive: true });
}

function writeJson(targetPath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getPrivateKeyPem(): string {
  const inline = process.env.DSA_SHEET_LICENSE_PRIVATE_KEY?.trim();
  if (inline) {
    return inline;
  }
  const filePath = process.env.DSA_SHEET_LICENSE_PRIVATE_KEY_PATH?.trim();
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  throw new Error("License private key is not configured. Set DSA_SHEET_LICENSE_PRIVATE_KEY or DSA_SHEET_LICENSE_PRIVATE_KEY_PATH.");
}

function createInitialBackendStore(): LicenseBackendStore {
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    payments: [],
    licenses: [],
    emails: [],
    resets: []
  };
}

export function getLicenseBackendStore(): LicenseBackendStore {
  ensureBackendStructure();
  const saved = readJson<LicenseBackendStore>(getStorePath());
  return saved ?? createInitialBackendStore();
}

function saveLicenseBackendStore(store: LicenseBackendStore): void {
  ensureBackendStructure();
  writeJson(getStorePath(), store);
}

function parseConfiguredPlans(): LicensePlan[] {
  const raw = process.env.DSA_SHEET_LICENSE_PLANS_JSON?.trim();
  if (!raw) {
    return [
      { id: "trees-30d", name: "Trees 30 days", topicIds: ["trees"], durationDays: 30, priceInr: 199 },
      { id: "graphs-30d", name: "Graphs 30 days", topicIds: ["graphs"], durationDays: 30, priceInr: 249 },
      { id: "all-topics-30d", name: "All topics 30 days", topicIds: ["strings", "two-pointers", "sliding-window", "prefix-suffix", "bit-manipulation", "linked-list", "stack", "queue", "recursion", "binary-search", "binary-search-trees", "trees", "graphs", "dp", "programming-mathematics"], durationDays: 30, priceInr: 999 }
    ];
  }
  const plans = JSON.parse(raw) as LicensePlan[];
  if (!Array.isArray(plans) || !plans.every((plan) => plan.id && Array.isArray(plan.topicIds) && plan.topicIds.length && plan.durationDays > 0)) {
    throw new Error("DSA_SHEET_LICENSE_PLANS_JSON is invalid.");
  }
  return plans;
}

export function listLicensePlans(): LicensePlan[] {
  return parseConfiguredPlans();
}

function resolvePlan(planId: string): LicensePlan {
  const plan = listLicensePlans().find((item) => item.id === planId);
  if (!plan) {
    throw new Error(`Unknown license plan: ${planId}`);
  }
  return plan;
}

function publicBaseUrl(): string {
  return process.env.DSA_SHEET_LICENSE_PUBLIC_BASE_URL?.trim() || "http://127.0.0.1:8787";
}

function normalizePhone(value?: string): string | undefined {
  const digits = value?.replace(/[^\d]/g, "");
  return digits ? digits.slice(-10) : undefined;
}

function checkoutMetadata(email: string, machineHash: string, plan: LicensePlan): Record<string, string> {
  return {
    email,
    machineHash,
    planId: plan.id,
    topicIds: plan.topicIds.join(",")
  };
}

export async function createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
  const email = normalizeEmail(input.email);
  const machineHash = input.machineHash.trim().toLowerCase();
  if (!email || !machineHash) {
    throw new Error("Email and machine hash are required.");
  }
  const plan = resolvePlan(input.planId);
  const metadata = checkoutMetadata(email, machineHash, plan);
  const customerPhone = normalizePhone(input.customerPhone);
  const customerName = input.customerName?.trim() || "DSA Sheet Learner";

  if (input.provider === "razorpay") {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.");
    }
    const referenceId = `dsa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 40);
    const expireBy = Math.floor(Date.now() / 1000) + plan.durationDays * 24 * 60 * 60;
    const response = await fetch("https://api.razorpay.com/v1/payment_links/", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        upi_link: true,
        amount: Math.round((plan.priceInr ?? 0) * 100),
        currency: "INR",
        accept_partial: false,
        expire_by: expireBy,
        reference_id: referenceId,
        description: `${plan.name} for ${email}`,
        customer: {
          name: customerName,
          contact: customerPhone,
          email
        },
        notify: {
          email: false,
          sms: false
        },
        reminder_enable: true,
        notes: metadata,
        callback_url: input.successRedirectUrl || `${publicBaseUrl()}/payment/complete`,
        callback_method: "get"
      })
    });
    if (!response.ok) {
      throw new Error(`Razorpay payment link creation failed with status ${response.status}.`);
    }
    const payload = await response.json() as Record<string, unknown>;
    return {
      provider: "razorpay",
      paymentLinkId: String(payload.id ?? ""),
      paymentUrl: String(payload.short_url ?? payload.shortUrl ?? ""),
      referenceId,
      expiresAt: typeof payload.expire_by === "number" ? new Date(Number(payload.expire_by) * 1000).toISOString() : undefined
    };
  }

  const clientId = process.env.CASHFREE_CLIENT_ID?.trim();
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET?.trim();
  const apiVersion = process.env.CASHFREE_API_VERSION?.trim() || "2025-01-01";
  const baseUrl = process.env.CASHFREE_BASE_URL?.trim() || "https://api.cashfree.com/pg/links";
  if (!clientId || !clientSecret) {
    throw new Error("CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET must be configured.");
  }
  const linkId = `dsa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const expiry = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": apiVersion,
      "x-client-id": clientId,
      "x-client-secret": clientSecret
    },
    body: JSON.stringify({
      customer_details: {
        customer_name: customerName,
        customer_phone: customerPhone ?? "9999999999",
        customer_email: email
      },
      link_amount: plan.priceInr ?? 0,
      link_currency: "INR",
      link_purpose: `${plan.name} for ${email}`,
      link_id: linkId,
      link_expiry_time: expiry,
      link_auto_reminders: true,
      link_notify: {
        send_email: false,
        send_sms: false
      },
      link_notes: metadata,
      link_meta: {
        notify_url: `${publicBaseUrl()}/api/webhooks/cashfree/payment-link`,
        return_url: input.successRedirectUrl || `${publicBaseUrl()}/payment/complete`,
        upi_intent: true
      }
    })
  });
  if (!response.ok) {
    throw new Error(`Cashfree payment link creation failed with status ${response.status}.`);
  }
  const payload = await response.json() as Record<string, unknown>;
  return {
    provider: "cashfree",
    paymentLinkId: String(payload.link_id ?? payload.cf_link_id ?? ""),
    paymentUrl: String(payload.link_url ?? ""),
    referenceId: linkId,
    expiresAt: typeof payload.link_expiry_time === "string" ? payload.link_expiry_time : undefined
  };
}

function buildClaims(email: string, machineHash: string, plan: LicensePlan): LicenseClaims {
  const issuedAt = new Date().toISOString();
  return {
    version: 1,
    codeId: crypto.randomUUID(),
    email,
    machineHash,
    topicIds: plan.topicIds,
    planId: plan.id,
    issuedAt,
    startsAt: issuedAt,
    expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString()
  };
}

function renderLicenseEmail(record: IssuedLicenseRecord, plan: LicensePlan): { subject: string; body: string } {
  return {
    subject: `Your DSA Sheet unlock code for ${plan.name}`,
    body: [
      `Hi,`,
      ``,
      `Your payment was confirmed for ${plan.name}.`,
      `Unlocked topics: ${plan.topicIds.join(", ")}`,
      `Valid until: ${new Date(record.expiresAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}`,
      ``,
      `Unlock code:`,
      `${record.code}`,
      ``,
      `Open DSA Sheet Desktop -> Profile -> Topic Unlocks, then paste this code using the same purchase email on the bound machine.`,
      ``,
      `Machine binding: ${record.machineHash.slice(0, 12).toUpperCase()}`,
      ``,
      `If you changed devices, contact support for a machine reset.`
    ].join("\n")
  };
}

async function deliverEmail(to: string, subject: string, body: string): Promise<"outbox" | "resend"> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.DSA_SHEET_FROM_EMAIL?.trim();
  if (resendApiKey && fromEmail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text: body
      })
    });
    if (!response.ok) {
      throw new Error(`Resend email failed with status ${response.status}.`);
    }
    return "resend";
  }

  const emailRecord = {
    to,
    subject,
    body,
    generatedAt: new Date().toISOString()
  };
  const filePath = path.join(getEmailOutboxDir(), `${Date.now()}-${to.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`);
  writeJson(filePath, emailRecord);
  return "outbox";
}

export async function confirmPaymentAndIssueLicense(input: PaymentConfirmationInput): Promise<PaymentConfirmationResult> {
  const email = normalizeEmail(input.email);
  const machineHash = input.machineHash.trim().toLowerCase();
  if (!email || !machineHash) {
    throw new Error("Email and machine hash are required.");
  }

  const store = getLicenseBackendStore();
  const existing = store.payments.find((payment) => payment.provider === input.provider && payment.paymentId === input.paymentId);
  if (existing) {
    const existingLicense = store.licenses.find((license) => license.paymentId === existing.id && license.status === "active");
    if (!existingLicense) {
      throw new Error("Payment already exists but no active license was found.");
    }
    return {
      payment: existing,
      license: existingLicense,
      emailDelivery: "outbox"
    };
  }

  const plan = resolvePlan(input.planId);
  const claims = buildClaims(email, machineHash, plan);
  const code = serializeLicenseCode(claims, getPrivateKeyPem());
  const payment: PaymentRecord = {
    id: crypto.randomUUID(),
    provider: input.provider,
    paymentId: input.paymentId,
    orderId: input.orderId,
    amountInr: input.amountInr,
    email,
    machineHash,
    planId: plan.id,
    confirmedAt: new Date().toISOString(),
    metadata: input.metadata ?? {}
  };
  const license: IssuedLicenseRecord = {
    codeId: claims.codeId,
    paymentId: payment.id,
    email,
    machineHash,
    planId: plan.id,
    topicIds: claims.topicIds,
    code,
    issuedAt: claims.issuedAt,
    startsAt: claims.startsAt,
    expiresAt: claims.expiresAt,
    status: "active"
  };
  const { subject, body } = renderLicenseEmail(license, plan);
  const delivery = await deliverEmail(email, subject, body);

  store.payments.push(payment);
  store.licenses.push(license);
  store.emails.push({
    id: crypto.randomUUID(),
    to: email,
    subject,
    body,
    sentAt: new Date().toISOString(),
    delivery
  });
  saveLicenseBackendStore(store);

  return {
    payment,
    license,
    emailDelivery: delivery
  };
}

export async function resetMachineAndReissueCode(input: {
  email: string;
  newMachineHash: string;
  codeId?: string;
  reason?: string;
}): Promise<MachineResetResult> {
  const email = normalizeEmail(input.email);
  const newMachineHash = input.newMachineHash.trim().toLowerCase();
  const store = getLicenseBackendStore();
  const previousLicense = input.codeId
    ? store.licenses.find((license) => license.codeId === input.codeId && license.email === email && license.status === "active")
    : [...store.licenses].reverse().find((license) => license.email === email && license.status === "active");

  if (!previousLicense) {
    throw new Error("No active license found for this email.");
  }
  const plan = resolvePlan(previousLicense.planId);
  const claims = buildClaims(email, newMachineHash, plan);
  const code = serializeLicenseCode(claims, getPrivateKeyPem());

  previousLicense.status = "replaced";
  previousLicense.replacedByCodeId = claims.codeId;

  const replacementLicense: IssuedLicenseRecord = {
    codeId: claims.codeId,
    paymentId: previousLicense.paymentId,
    email,
    machineHash: newMachineHash,
    planId: previousLicense.planId,
    topicIds: [...previousLicense.topicIds],
    code,
    issuedAt: claims.issuedAt,
    startsAt: claims.startsAt,
    expiresAt: claims.expiresAt,
    status: "active"
  };

  const { subject, body } = renderLicenseEmail(replacementLicense, plan);
  const delivery = await deliverEmail(email, subject, body);

  store.licenses.push(replacementLicense);
  store.resets.push({
    id: crypto.randomUUID(),
    previousCodeId: previousLicense.codeId,
    newCodeId: replacementLicense.codeId,
    email,
    previousMachineHash: previousLicense.machineHash,
    newMachineHash,
    resetAt: new Date().toISOString(),
    reason: input.reason?.trim() || "user-requested-device-change"
  });
  store.emails.push({
    id: crypto.randomUUID(),
    to: email,
    subject,
    body,
    sentAt: new Date().toISOString(),
    delivery
  });
  saveLicenseBackendStore(store);

  return {
    previousLicense,
    replacementLicense,
    emailDelivery: delivery
  };
}

export function lookupLicensesByEmail(email: string): IssuedLicenseRecord[] {
  const normalized = normalizeEmail(email);
  return getLicenseBackendStore().licenses.filter((license) => license.email === normalized);
}
