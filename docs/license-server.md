# License Server V1

This is the smallest backend needed to automate:

- payment confirmation
- Razorpay or Cashfree hosted payment-link checkout creation
- signed code issuance
- email delivery
- admin machine reset for device changes

## Start the server

```bash
cd /Users/piyushkhandelwal/Documents/dsa-sheet
npm run license:server
```

For local setup, you can start from the example env file:

```bash
cd /Users/piyushkhandelwal/Documents/dsa-sheet
cp .env.license.example .env.license.local
# edit .env.license.local and update the private key path + tokens
source .env.license.local
npm run license:server
```

By default it listens on:

- `http://127.0.0.1:8787`

## Required environment

Set these before starting:

```bash
export DSA_SHEET_LICENSE_PRIVATE_KEY_PATH=/absolute/path/to/license-private.pem
export DSA_SHEET_LICENSE_ADMIN_TOKEN=change-this-admin-token
export DSA_SHEET_LICENSE_WEBHOOK_SECRET=change-this-webhook-secret
```

Optional:

```bash
export PORT=8787
export DSA_SHEET_LICENSE_SERVER_HOME=/absolute/path/to/license-server-state
export DSA_SHEET_LICENSE_PLANS_JSON='[
  {"id":"trees-30d","name":"Trees 30 days","topicIds":["trees"],"durationDays":30,"priceInr":199},
  {"id":"all-topics-30d","name":"All Topics 30 days","topicIds":["strings","two-pointers","sliding-window","prefix-suffix","bit-manipulation","linked-list","stack","queue","recursion","binary-search","binary-search-trees","trees","graphs","dp","programming-mathematics"],"durationDays":30,"priceInr":999}
]'
```

For real email delivery:

```bash
export RESEND_API_KEY=...
export DSA_SHEET_FROM_EMAIL='DSA Sheet <noreply@yourdomain.com>'
```

If email is not configured, the server writes email payloads to:

- `license-server/email-outbox/`

## Endpoints

### Health

`GET /health`

### Plans

`GET /api/plans`

### Hosted checkout session

`POST /api/checkout/session`

Body:

```json
{
  "provider": "razorpay",
  "email": "learner@example.com",
  "machineHash": "abc123machinehash",
  "planId": "trees-30d",
  "customerName": "Learner Name",
  "customerPhone": "9876543210"
}
```

Response:

```json
{
  "provider": "razorpay",
  "paymentLinkId": "plink_xxx",
  "paymentUrl": "https://rzp.io/...",
  "referenceId": "dsa_..."
}
```

Use this from a hosted form or your own checkout page.

### Manual payment confirmation

Use this when you confirm a UPI payment manually or from an operator dashboard.

`POST /api/payments/confirm-manual`

Headers:

```text
Authorization: Bearer <DSA_SHEET_LICENSE_ADMIN_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "provider": "manual-upi",
  "paymentId": "upi_txn_123",
  "amountInr": 199,
  "email": "learner@example.com",
  "machineHash": "abc123machinehash",
  "planId": "trees-30d"
}
```

### Payment webhook

Use this for Razorpay/Cashfree adapter code after payment success.

`POST /api/webhooks/payment-success`

Headers:

```text
X-DSA-WEBHOOK-SECRET: <DSA_SHEET_LICENSE_WEBHOOK_SECRET>
Content-Type: application/json
```

Body shape:

```json
{
  "provider": "razorpay",
  "paymentId": "pay_xxx",
  "orderId": "order_xxx",
    "amountInr": 999,
    "metadata": {
      "email": "learner@example.com",
      "machineHash": "abc123machinehash",
      "planId": "all-topics-30d"
    }
  }
```

### Razorpay payment-link webhook

`POST /api/webhooks/razorpay/payment-link`

The server verifies `X-Razorpay-Signature` using `RAZORPAY_WEBHOOK_SECRET`, accepts `payment_link.paid`, reads your metadata from `payment_link.entity.notes`, and issues the code automatically.

### Cashfree payment-link webhook

`POST /api/webhooks/cashfree/payment-link`

The server verifies `x-webhook-signature` using the raw body and `CASHFREE_CLIENT_SECRET`, accepts successful payments, reads metadata from `order.order_tags`, and issues the code automatically.

### Admin machine reset

`POST /api/admin/licenses/reset-machine`

Headers:

```text
Authorization: Bearer <DSA_SHEET_LICENSE_ADMIN_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "email": "learner@example.com",
  "newMachineHash": "newmachinehash",
  "reason": "device-upgrade"
}
```

This marks the previous active code as replaced and emails a fresh code for the new machine.

### License lookup

`GET /api/admin/licenses?email=learner@example.com`

Headers:

```text
Authorization: Bearer <DSA_SHEET_LICENSE_ADMIN_TOKEN>
```

## Suggested operator flow

### Manual UPI V1

1. Collect email, machine ID, and selected plan.
2. Receive the UPI payment.
3. Call `POST /api/payments/confirm-manual`.
4. Copy the generated email from outbox, or let Resend send it automatically.
5. User pastes the code into the app.

### Semi-automatic UPI V2

1. Collect email, machine ID, and selected plan on a hosted form.
2. Call `POST /api/checkout/session`.
3. Redirect the user to the returned hosted payment link.
4. Configure your provider webhook:
   - Razorpay → `/api/webhooks/razorpay/payment-link`
   - Cashfree → `/api/webhooks/cashfree/payment-link`
5. Let the backend send the code automatically.

## Hosted form

This repo now includes a simple hosted form at:

- [site/unlock/index.html](/Users/piyushkhandelwal/Documents/dsa-sheet/site/unlock/index.html)

When served statically, pass your backend URL as a query param:

```text
https://your-site/unlock/?backend=https://your-license-server-host
```

## Admin panel

The license backend now serves a small local admin panel at:

- `http://127.0.0.1:8787/admin`

Use it to:

- search licenses by email
- manually confirm a payment and issue a code
- reset a machine and reissue a replacement code
- resend an existing code
- revoke a license code

You will need:

- your backend base URL
- your `DSA_SHEET_LICENSE_ADMIN_TOKEN`

## Revocation behavior

License revocation is now supported end to end:

- Admin can revoke a code from the admin panel.
- The backend marks that code as revoked.
- The desktop app revalidates active local codes against the backend on bootstrap and license refresh.
- If a code is revoked, replaced, missing, or expired on the backend, the desktop app removes that local entitlement on the next successful revalidation.

If the backend is temporarily unreachable, the desktop app keeps the last known local state and records a validation message instead of locking the learner out immediately.
