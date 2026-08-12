import http, { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  confirmPaymentAndIssueLicense,
  createCheckoutSession,
  listLicensePlans,
  lookupEmailsByEmail,
  lookupLicensesByEmail,
  lookupPaymentsByEmail,
  lookupResetsByEmail,
  revokeLicense,
  revalidateLicenseSet,
  resendLicenseCode,
  resetMachineAndReissueCode
} from "../services/licenseBackend";

type JsonRecord = Record<string, unknown>;

function json(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", process.env.DSA_SHEET_LICENSE_ALLOWED_ORIGIN?.trim() || "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-DSA-WEBHOOK-SECRET, X-Razorpay-Signature, x-webhook-signature, x-webhook-timestamp");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function html(response: ServerResponse, statusCode: number, markup: string): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.end(markup);
}

function readSitePage(...segments: string[]): string {
  return fs.readFileSync(path.resolve(process.cwd(), "site", ...segments), "utf-8");
}

function parseBearerAuth(request: IncomingMessage): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

function requireAdminToken(request: IncomingMessage): boolean {
  const expected = process.env.DSA_SHEET_LICENSE_ADMIN_TOKEN?.trim();
  if (!expected) {
    throw new Error("DSA_SHEET_LICENSE_ADMIN_TOKEN is not configured.");
  }
  return parseBearerAuth(request) === expected;
}

function requireWebhookSecret(request: IncomingMessage): boolean {
  const expected = process.env.DSA_SHEET_LICENSE_WEBHOOK_SECRET?.trim();
  if (!expected) {
    throw new Error("DSA_SHEET_LICENSE_WEBHOOK_SECRET is not configured.");
  }
  return request.headers["x-dsa-webhook-secret"] === expected;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const body = await readBody(request);
  if (!body.trim()) {
    return {};
  }
  return JSON.parse(body) as JsonRecord;
}

function normalizeWebhookPayment(body: JsonRecord): {
  provider: string;
  paymentId: string;
  orderId?: string;
  amountInr: number;
  email: string;
  machineHash: string;
  planId: string;
  metadata: Record<string, string>;
} {
  const metadata = (body.metadata && typeof body.metadata === "object" ? body.metadata : {}) as Record<string, unknown>;
  const payment = (body.payment && typeof body.payment === "object" ? body.payment : {}) as Record<string, unknown>;
  const email = String(metadata.email ?? body.email ?? payment.email ?? "").trim();
  const machineHash = String(metadata.machineHash ?? body.machineHash ?? "").trim();
  const planId = String(metadata.planId ?? body.planId ?? "").trim();
  const amount = Number(body.amountInr ?? payment.amountInr ?? payment.amount ?? 0);
  const paymentId = String(body.paymentId ?? payment.paymentId ?? payment.id ?? "").trim();
  const orderId = String(body.orderId ?? payment.orderId ?? payment.order_id ?? "").trim() || undefined;
  const provider = String(body.provider ?? "upi").trim();

  if (!email || !machineHash || !planId || !paymentId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Webhook payload is missing email, machineHash, planId, paymentId, or amount.");
  }

  return {
    provider,
    paymentId,
    orderId,
    amountInr: amount,
    email,
    machineHash,
    planId,
    metadata: Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)]))
  };
}

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.setHeader("Access-Control-Allow-Origin", process.env.DSA_SHEET_LICENSE_ALLOWED_ORIGIN?.trim() || "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-DSA-WEBHOOK-SECRET, X-Razorpay-Signature, x-webhook-signature, x-webhook-timestamp");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return json(response, 200, {
      ok: true,
      now: new Date().toISOString(),
      plans: listLicensePlans().length
    });
  }

  if (request.method === "GET" && url.pathname === "/api/plans") {
    return json(response, 200, {
      plans: listLicensePlans()
    });
  }

  if (request.method === "GET" && (url.pathname === "/admin" || url.pathname === "/admin/")) {
    return html(response, 200, readSitePage("admin", "index.html"));
  }

  if (request.method === "GET" && url.pathname === "/payment/complete") {
    return html(response, 200, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Complete</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b1020; color: #f5f7ff; margin: 0; min-height: 100vh; display: grid; place-items: center; }
      .card { width: min(540px, calc(100vw - 32px)); background: rgba(17, 24, 45, 0.96); border: 1px solid rgba(120, 140, 255, 0.22); border-radius: 24px; padding: 28px; box-shadow: 0 24px 80px rgba(0,0,0,0.35); }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { color: #b8bfdc; line-height: 1.6; }
      code { color: #ffffff; background: rgba(80, 96, 180, 0.18); padding: 2px 6px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Payment received</h1>
      <p>If your payment provider has already triggered the success webhook, your unlock code is being emailed now.</p>
      <p>Return to the desktop app and open <code>Profile → Topic Unlocks</code>. Use the same purchase email and paste the received code.</p>
    </div>
  </body>
</html>`);
  }

  if (request.method === "POST" && url.pathname === "/api/checkout/session") {
    const body = await readJsonBody(request);
    const provider = String(body.provider ?? "").trim();
    if (provider !== "razorpay" && provider !== "cashfree") {
      return json(response, 400, { error: "provider must be razorpay or cashfree" });
    }
    const result = await createCheckoutSession({
      provider,
      email: String(body.email ?? ""),
      machineHash: String(body.machineHash ?? ""),
      planId: String(body.planId ?? ""),
      customerName: typeof body.customerName === "string" ? body.customerName : undefined,
      customerPhone: typeof body.customerPhone === "string" ? body.customerPhone : undefined,
      successRedirectUrl: typeof body.successRedirectUrl === "string" ? body.successRedirectUrl : undefined
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/payments/confirm-manual") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const body = await readJsonBody(request);
    const result = await confirmPaymentAndIssueLicense({
      provider: String(body.provider ?? "manual"),
      paymentId: String(body.paymentId ?? crypto.randomUUID()),
      orderId: typeof body.orderId === "string" ? body.orderId : undefined,
      amountInr: Number(body.amountInr ?? 0),
      email: String(body.email ?? ""),
      machineHash: String(body.machineHash ?? ""),
      planId: String(body.planId ?? ""),
      metadata: body.metadata && typeof body.metadata === "object"
        ? Object.fromEntries(Object.entries(body.metadata as JsonRecord).map(([key, value]) => [key, String(value)]))
        : {}
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/payment-success") {
    if (!requireWebhookSecret(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const body = await readJsonBody(request);
    const normalized = normalizeWebhookPayment(body);
    const result = await confirmPaymentAndIssueLicense(normalized);
    return json(response, 200, {
      ok: true,
      paymentId: result.payment.paymentId,
      codeId: result.license.codeId,
      emailDelivery: result.emailDelivery
    });
  }

  if (request.method === "POST" && url.pathname === "/api/license/revalidate") {
    const body = await readJsonBody(request);
    const result = revalidateLicenseSet({
      machineHash: String(body.machineHash ?? ""),
      codeIds: Array.isArray(body.codeIds) ? body.codeIds.map((item) => String(item)) : []
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/razorpay/payment-link") {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
    }
    const rawBody = await readBody(request);
    const received = String(request.headers["x-razorpay-signature"] ?? "");
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (!received || received !== expected) {
      return json(response, 401, { error: "Invalid Razorpay signature" });
    }

    const body = JSON.parse(rawBody) as JsonRecord;
    if (body.event !== "payment_link.paid") {
      return json(response, 200, { ok: true, ignored: true, event: body.event ?? null });
    }

    const paymentLinkEntity = (((body.payload as JsonRecord)?.payment_link as JsonRecord)?.entity ?? {}) as JsonRecord;
    const paymentEntity = (((body.payload as JsonRecord)?.payment as JsonRecord)?.entity ?? {}) as JsonRecord;
    const notes = (paymentLinkEntity.notes && typeof paymentLinkEntity.notes === "object" ? paymentLinkEntity.notes : {}) as JsonRecord;
    const email = String(notes.email ?? ((paymentLinkEntity.customer as JsonRecord | undefined)?.email ?? "")).trim();
    const machineHash = String(notes.machineHash ?? "").trim();
    const planId = String(notes.planId ?? "").trim();
    const paymentId = String(paymentEntity.id ?? "").trim();
    const amountInr = Number(paymentEntity.amount ? Number(paymentEntity.amount) / 100 : paymentLinkEntity.amount ? Number(paymentLinkEntity.amount) / 100 : 0);

    const result = await confirmPaymentAndIssueLicense({
      provider: "razorpay",
      paymentId,
      orderId: String((((body.payload as JsonRecord)?.order as JsonRecord)?.entity as JsonRecord | undefined)?.id ?? ""),
      amountInr,
      email,
      machineHash,
      planId,
      metadata: Object.fromEntries(Object.entries(notes).map(([key, value]) => [key, String(value)]))
    });
    return json(response, 200, { ok: true, codeId: result.license.codeId, emailDelivery: result.emailDelivery });
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/cashfree/payment-link") {
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET?.trim();
    if (!clientSecret) {
      throw new Error("CASHFREE_CLIENT_SECRET is not configured.");
    }
    const rawBody = await readBody(request);
    const timestamp = String(request.headers["x-webhook-timestamp"] ?? "");
    const received = String(request.headers["x-webhook-signature"] ?? "");
    const expected = crypto.createHmac("sha256", clientSecret).update(`${timestamp}${rawBody}`).digest("base64");
    if (!received || received !== expected) {
      return json(response, 401, { error: "Invalid Cashfree signature" });
    }

    const body = JSON.parse(rawBody) as JsonRecord;
    const data = (body.data && typeof body.data === "object" ? body.data : {}) as JsonRecord;
    const payment = (data.payment && typeof data.payment === "object" ? data.payment : {}) as JsonRecord;
    const order = (data.order && typeof data.order === "object" ? data.order : {}) as JsonRecord;
    if (String(payment.payment_status ?? "") !== "SUCCESS") {
      return json(response, 200, { ok: true, ignored: true, paymentStatus: payment.payment_status ?? null });
    }
    const orderTags = (order.order_tags && typeof order.order_tags === "object" ? order.order_tags : {}) as JsonRecord;
    const email = String(orderTags.email ?? "").trim();
    const machineHash = String(orderTags.machineHash ?? "").trim();
    const planId = String(orderTags.planId ?? "").trim();
    const result = await confirmPaymentAndIssueLicense({
      provider: "cashfree",
      paymentId: String(payment.cf_payment_id ?? ""),
      orderId: String(order.order_id ?? ""),
      amountInr: Number(payment.payment_amount ?? order.order_amount ?? 0),
      email,
      machineHash,
      planId,
      metadata: Object.fromEntries(Object.entries(orderTags).map(([key, value]) => [key, String(value)]))
    });
    return json(response, 200, { ok: true, codeId: result.license.codeId, emailDelivery: result.emailDelivery });
  }

  if (request.method === "POST" && url.pathname === "/api/admin/licenses/reset-machine") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const body = await readJsonBody(request);
    const result = await resetMachineAndReissueCode({
      email: String(body.email ?? ""),
      newMachineHash: String(body.newMachineHash ?? ""),
      codeId: typeof body.codeId === "string" ? body.codeId : undefined,
      reason: typeof body.reason === "string" ? body.reason : undefined
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/licenses/resend-code") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const body = await readJsonBody(request);
    const result = await resendLicenseCode({
      email: String(body.email ?? ""),
      codeId: typeof body.codeId === "string" ? body.codeId : undefined
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/licenses/revoke") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const body = await readJsonBody(request);
    const result = revokeLicense({
      email: String(body.email ?? ""),
      codeId: String(body.codeId ?? ""),
      reason: typeof body.reason === "string" ? body.reason : undefined
    });
    return json(response, 200, result);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/licenses") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const email = url.searchParams.get("email");
    if (!email) {
      return json(response, 400, { error: "email query param is required" });
    }
    return json(response, 200, {
      licenses: lookupLicensesByEmail(email)
    });
  }

  if (request.method === "GET" && url.pathname === "/api/admin/customer") {
    if (!requireAdminToken(request)) {
      return json(response, 401, { error: "Unauthorized" });
    }
    const email = url.searchParams.get("email");
    if (!email) {
      return json(response, 400, { error: "email query param is required" });
    }
    return json(response, 200, {
      licenses: lookupLicensesByEmail(email),
      payments: lookupPaymentsByEmail(email),
      emails: lookupEmailsByEmail(email),
      resets: lookupResetsByEmail(email)
    });
  }

  return json(response, 404, {
    error: "Not found"
  });
}

export function createLicenseServer(port = Number(process.env.PORT ?? "8787")) {
  return http.createServer((request, response) => {
    route(request, response).catch((error) => {
      json(response, 500, {
        error: error instanceof Error ? error.message : "Unexpected server error"
      });
    });
  }).listen(port, () => {
    console.log(`DSA Sheet license server listening on http://127.0.0.1:${port}`);
  });
}

if (require.main === module) {
  createLicenseServer();
}
