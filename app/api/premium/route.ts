import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SQUARE_API_VERSION = '2026-07-15';
const FOUNDER_DISPLAY_PRICE_USD = 'US$9.99';
const FOUNDER_CURRENCY = 'CAD';
const FOUNDER_END_EXCLUSIVE = Date.parse('2026-09-01T07:00:00.000Z');
const FOUNDER_END_LABEL = 'August 31, 2026';
const ATTEMPT_PURCHASE_WINDOW_MS = 30 * 60 * 1000;
const ATTEMPT_RECOVERY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ENTITLEMENT_COOKIE = 'ev_founder_entitlement';
const ENTITLEMENT_STORAGE_KEY = 'ev-premium-entitlement';
const PENDING_ATTEMPT_STORAGE_KEY = 'ev-premium-pending-attempt';

type SquareEnvironment = 'sandbox' | 'production';

type PurchaseAttemptPayload = {
  kind: 'purchase-attempt';
  version: 1;
  attemptId: string;
  createdAt: number;
  amount: number;
  currency: 'CAD';
};

type FounderEntitlementPayload = {
  kind: 'entitlement';
  version: 1;
  provider: 'square';
  paymentId: string;
  amount: number;
  currency: 'CAD';
  purchasedAt: string;
  entitlement: 'founder-premium';
  founder: true;
};

type SignedPayload = PurchaseAttemptPayload | FounderEntitlementPayload;

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquarePayment = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  location_id?: string;
  reference_id?: string;
  amount_money?: SquareMoney;
  total_money?: SquareMoney;
  receipt_url?: string;
};

type SquareError = {
  code?: string;
  category?: string;
  detail?: string;
  field?: string;
};

type SquarePaymentResponse = {
  payment?: SquarePayment;
  errors?: SquareError[];
};

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('Pragma', 'no-cache');
  return NextResponse.json(body, { ...init, headers });
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function getEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT?.toLowerCase() === 'production' ? 'production' : 'sandbox';
}

function getSquarePublicConfig() {
  const applicationId = process.env.SQUARE_APPLICATION_ID || process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
  const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';
  return { applicationId, locationId, environment: getEnvironment() };
}

function getFounderAmount() {
  return parsePositiveInteger(process.env.EVERLASTING_FOUNDER_CAD_CENTS);
}

function founderIsAvailable(at = Date.now()) {
  return at < FOUNDER_END_EXCLUSIVE;
}

function formatCad(cents: number | null) {
  if (!cents) return null;
  return `CA$${(cents / 100).toFixed(2)} CAD`;
}

function getEntitlementSecret() {
  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret || secret.length < 24) return null;
  return secret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(prefix: 'EVA1' | 'EVF1', payload: SignedPayload) {
  const secret = getEntitlementSecret();
  if (!secret) throw new Error('Entitlement signing is not configured.');
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(`${prefix}.${encoded}`).digest('base64url');
  return `${prefix}.${encoded}.${signature}`;
}

function verifyPayload<T extends SignedPayload>(token: string, prefix: 'EVA1' | 'EVF1'): T | null {
  const secret = getEntitlementSecret();
  if (!secret || typeof token !== 'string') return null;
  const pieces = token.trim().split('.');
  if (pieces.length !== 3 || pieces[0] !== prefix) return null;
  const [, encoded, receivedSignature] = pieces;
  const expectedSignature = createHmac('sha256', secret).update(`${prefix}.${encoded}`).digest('base64url');
  if (!safeEqual(expectedSignature, receivedSignature)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function verifyAttempt(token: string, maxAgeMs: number) {
  const payload = verifyPayload<PurchaseAttemptPayload>(token, 'EVA1');
  if (!payload) return null;
  if (payload.kind !== 'purchase-attempt' || payload.version !== 1) return null;
  if (!/^[0-9a-f-]{36}$/i.test(payload.attemptId)) return null;
  if (!Number.isSafeInteger(payload.amount) || payload.amount <= 0 || payload.currency !== FOUNDER_CURRENCY) return null;
  if (!Number.isFinite(payload.createdAt) || payload.createdAt > Date.now() + 60_000) return null;
  if (Date.now() - payload.createdAt > maxAgeMs) return null;
  return payload;
}

function verifyEntitlement(token: string) {
  const payload = verifyPayload<FounderEntitlementPayload>(token, 'EVF1');
  if (!payload) return null;
  if (payload.kind !== 'entitlement' || payload.version !== 1) return null;
  if (payload.provider !== 'square' || payload.entitlement !== 'founder-premium' || payload.founder !== true) return null;
  if (!payload.paymentId || payload.currency !== FOUNDER_CURRENCY || !Number.isSafeInteger(payload.amount) || payload.amount <= 0) return null;
  if (!payload.purchasedAt || Number.isNaN(Date.parse(payload.purchasedAt))) return null;
  return payload;
}

function parseCookies(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const result = new Map<string, string>();
  cookieHeader.split(';').forEach((pair) => {
    const separator = pair.indexOf('=');
    if (separator < 0) return;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!key) return;
    try {
      result.set(key, decodeURIComponent(value));
    } catch {
      result.set(key, value);
    }
  });
  return result;
}

function withEntitlementCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ENTITLEMENT_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 10
  });
  return response;
}

function getSquareApiBase() {
  return getEnvironment() === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
}

function squareHeaders() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) return null;
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Square-Version': SQUARE_API_VERSION
  };
}

function checkoutConfiguration() {
  const amount = getFounderAmount();
  const { applicationId, locationId, environment } = getSquarePublicConfig();
  const hasSigning = Boolean(getEntitlementSecret());
  const hasAccessToken = Boolean(process.env.SQUARE_ACCESS_TOKEN);
  return {
    displayPriceUsd: FOUNDER_DISPLAY_PRICE_USD,
    chargeCadCents: amount,
    chargePriceCad: formatCad(amount),
    chargeCurrency: FOUNDER_CURRENCY,
    founderEndsAt: new Date(FOUNDER_END_EXCLUSIVE).toISOString(),
    founderEndsLabel: FOUNDER_END_LABEL,
    founderAvailable: founderIsAvailable(),
    applicationId,
    locationId,
    environment,
    checkoutReady: Boolean(amount && applicationId && locationId && hasSigning && hasAccessToken),
    entitlementStorageKey: ENTITLEMENT_STORAGE_KEY,
    pendingAttemptStorageKey: PENDING_ATTEMPT_STORAGE_KEY
  };
}

function isMatchingCompletedFounderPayment(payment: SquarePayment, attempt: PurchaseAttemptPayload, expectedLocationId: string) {
  return Boolean(
    payment.id &&
    payment.status === 'COMPLETED' &&
    payment.reference_id === attempt.attemptId &&
    payment.location_id === expectedLocationId &&
    payment.amount_money?.amount === attempt.amount &&
    payment.amount_money?.currency === attempt.currency
  );
}

function issueEntitlement(payment: SquarePayment, attempt: PurchaseAttemptPayload) {
  if (!payment.id) throw new Error('Missing payment identifier.');
  const payload: FounderEntitlementPayload = {
    kind: 'entitlement',
    version: 1,
    provider: 'square',
    paymentId: payment.id,
    amount: attempt.amount,
    currency: FOUNDER_CURRENCY,
    purchasedAt: payment.created_at || new Date().toISOString(),
    entitlement: 'founder-premium',
    founder: true
  };
  const token = signPayload('EVF1', payload);
  return { token, payload };
}

function publicEntitlement(payload: FounderEntitlementPayload) {
  return {
    entitlement: payload.entitlement,
    founder: payload.founder,
    provider: payload.provider,
    purchasedAt: payload.purchasedAt,
    amount: payload.amount,
    currency: payload.currency
  };
}

function humanSquareError(errors: SquareError[] | undefined) {
  const code = errors?.[0]?.code || 'PAYMENT_ERROR';
  const declinedCodes = new Set([
    'CARD_DECLINED',
    'CARD_EXPIRED',
    'CVV_FAILURE',
    'ADDRESS_VERIFICATION_FAILURE',
    'INSUFFICIENT_FUNDS',
    'GENERIC_DECLINE',
    'CARD_NOT_SUPPORTED',
    'CARD_DECLINED_VERIFICATION_REQUIRED',
    'PAN_FAILURE',
    'EXPIRATION_FAILURE',
    'VERIFY_CVV_FAILURE',
    'VERIFY_AVS_FAILURE'
  ]);
  if (declinedCodes.has(code)) {
    return { code, message: 'Your card was not approved. Check the details or try another card.', confirmedNotCharged: true };
  }
  if (code === 'CARD_TOKEN_EXPIRED' || code === 'INVALID_CARD') {
    return { code, message: 'The secure card session expired. Please enter the card again.', confirmedNotCharged: true };
  }
  return { code, message: 'Square returned an unexpected payment response. Check the payment status before trying again.', confirmedNotCharged: false };
}

async function createSquarePayment(sourceId: string, attempt: PurchaseAttemptPayload) {
  const headers = squareHeaders();
  const { locationId } = getSquarePublicConfig();
  if (!headers || !locationId) throw new Error('Square is not configured.');
  const response = await fetch(`${getSquareApiBase()}/v2/payments`, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: attempt.attemptId,
      amount_money: { amount: attempt.amount, currency: attempt.currency },
      autocomplete: true,
      location_id: locationId,
      reference_id: attempt.attemptId,
      note: 'Everlasting Voyage Founding Member'
    })
  });
  const data = (await response.json().catch(() => ({}))) as SquarePaymentResponse;
  return { response, data };
}

async function findPaymentForAttempt(attempt: PurchaseAttemptPayload) {
  const headers = squareHeaders();
  const { locationId } = getSquarePublicConfig();
  if (!headers || !locationId) throw new Error('Square is not configured.');

  const beginTime = new Date(Math.max(0, attempt.createdAt - 2 * 60 * 1000)).toISOString();
  let cursor = '';
  for (let page = 0; page < 3; page += 1) {
    const query = new URLSearchParams({
      begin_time: beginTime,
      sort_order: 'DESC',
      location_id: locationId,
      total: String(attempt.amount),
      limit: '100'
    });
    if (cursor) query.set('cursor', cursor);
    const response = await fetch(`${getSquareApiBase()}/v2/payments?${query.toString()}`, {
      headers,
      cache: 'no-store'
    });
    const data = (await response.json().catch(() => ({}))) as { payments?: SquarePayment[]; cursor?: string; errors?: SquareError[] };
    if (!response.ok) throw new Error(data.errors?.[0]?.detail || 'Square payment recovery failed.');
    const match = data.payments?.find((payment) => payment.reference_id === attempt.attemptId);
    if (match) return match;
    cursor = data.cursor || '';
    if (!cursor) break;
  }
  return null;
}

function webhookSignatureIsValid(rawBody: string, signature: string, notificationUrl: string, signatureKey: string) {
  const expected = createHmac('sha256', signatureKey).update(notificationUrl + rawBody).digest('base64');
  return safeEqual(expected, signature);
}

async function handleWebhook(request: Request, rawBody: string) {
  const signature = request.headers.get('x-square-hmacsha256-signature') || '';
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || '';
  if (!signatureKey || !notificationUrl) {
    return noStoreJson({ ok: false, error: 'Webhook verification is not configured.' }, { status: 503 });
  }
  if (!signature || !webhookSignatureIsValid(rawBody, signature, notificationUrl, signatureKey)) {
    return noStoreJson({ ok: false, error: 'Invalid webhook signature.' }, { status: 403 });
  }
  try {
    const event = JSON.parse(rawBody) as { event_id?: string; type?: string; data?: { object?: { payment?: SquarePayment } } };
    const supported = event.type === 'payment.created' || event.type === 'payment.updated';
    return noStoreJson({ ok: true, accepted: supported, eventId: event.event_id || null });
  } catch {
    return noStoreJson({ ok: false, error: 'Invalid webhook body.' }, { status: 400 });
  }
}

export async function GET() {
  return noStoreJson(checkoutConfiguration());
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const url = new URL(request.url);
  if (url.searchParams.get('webhook') === 'square') return handleWebhook(request, rawBody);

  let body: Record<string, unknown>;
  try {
    body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return noStoreJson({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'validate' || action === 'restore') {
    const suppliedToken = typeof body.token === 'string' ? body.token.trim() : '';
    const cookieToken = parseCookies(request).get(ENTITLEMENT_COOKIE) || '';
    const suppliedEntitlement = suppliedToken ? verifyEntitlement(suppliedToken) : null;
    const cookieEntitlement = action === 'validate' && cookieToken ? verifyEntitlement(cookieToken) : null;
    const entitlement = suppliedEntitlement || cookieEntitlement;
    const token = suppliedEntitlement ? suppliedToken : cookieEntitlement ? cookieToken : '';
    if (!entitlement || !token) {
      return noStoreJson({ ok: true, valid: false });
    }
    const response = noStoreJson({
      ok: true,
      valid: true,
      entitlementToken: token,
      entitlement: publicEntitlement(entitlement)
    });
    return withEntitlementCookie(response, token);
  }

  if (action === 'begin-purchase') {
    const amount = getFounderAmount();
    const config = checkoutConfiguration();
    if (!config.founderAvailable) {
      return noStoreJson({ ok: false, code: 'FOUNDER_ENDED', error: 'Founding Member access has ended.' }, { status: 410 });
    }
    if (!config.checkoutReady || !amount) {
      return noStoreJson({ ok: false, code: 'CHECKOUT_NOT_READY', error: 'Founder checkout is not configured yet.' }, { status: 503 });
    }
    const attempt: PurchaseAttemptPayload = {
      kind: 'purchase-attempt',
      version: 1,
      attemptId: randomUUID(),
      createdAt: Date.now(),
      amount,
      currency: FOUNDER_CURRENCY
    };
    return noStoreJson({
      ok: true,
      attemptToken: signPayload('EVA1', attempt),
      chargePriceCad: formatCad(amount),
      displayPriceUsd: FOUNDER_DISPLAY_PRICE_USD
    });
  }

  if (action === 'purchase') {
    const sourceId = typeof body.sourceId === 'string' ? body.sourceId.trim() : '';
    const attemptToken = typeof body.attemptToken === 'string' ? body.attemptToken.trim() : '';
    if (!sourceId || sourceId.length > 1024) {
      return noStoreJson({ ok: false, code: 'INVALID_SOURCE', error: 'The secure card token is missing or invalid.' }, { status: 400 });
    }
    const attempt = verifyAttempt(attemptToken, ATTEMPT_PURCHASE_WINDOW_MS);
    if (!attempt) {
      return noStoreJson({ ok: false, code: 'ATTEMPT_EXPIRED', error: 'This checkout session expired. Please reopen checkout and try again.' }, { status: 400 });
    }
    const currentAmount = getFounderAmount();
    if (!currentAmount || attempt.amount !== currentAmount || attempt.currency !== FOUNDER_CURRENCY) {
      return noStoreJson({ ok: false, code: 'PRICE_CHANGED', error: 'The Founder price changed before payment. Please reopen checkout.' }, { status: 409 });
    }
    if (attempt.createdAt >= FOUNDER_END_EXCLUSIVE) {
      return noStoreJson({ ok: false, code: 'FOUNDER_ENDED', error: 'Founding Member access has ended.' }, { status: 410 });
    }

    try {
      const { response, data } = await createSquarePayment(sourceId, attempt);
      if (!response.ok || !data.payment) {
        const mapped = humanSquareError(data.errors);
        if (mapped.confirmedNotCharged) {
          return noStoreJson({ ok: false, ...mapped }, { status: 402 });
        }
        return noStoreJson({
          ok: false,
          code: mapped.code,
          status: 'unknown',
          recoverable: true,
          confirmedNotCharged: false,
          error: mapped.message
        }, { status: response.status >= 500 ? 502 : 409 });
      }
      const { locationId } = getSquarePublicConfig();
      const payment = data.payment;
      if (payment.status === 'COMPLETED' && isMatchingCompletedFounderPayment(payment, attempt, locationId)) {
        const issued = issueEntitlement(payment, attempt);
        const success = noStoreJson({
          ok: true,
          status: 'completed',
          entitlementToken: issued.token,
          entitlement: publicEntitlement(issued.payload),
          receiptUrl: payment.receipt_url || null
        });
        return withEntitlementCookie(success, issued.token);
      }
      if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
        return noStoreJson({
          ok: false,
          status: payment.status.toLowerCase(),
          confirmedNotCharged: true,
          error: 'The payment was not completed. You can safely try again.'
        }, { status: 402 });
      }
      return noStoreJson({
        ok: false,
        status: 'unknown',
        recoverable: true,
        error: 'We could not confirm the final payment state yet. Check this payment before trying again.'
      }, { status: 202 });
    } catch {
      return noStoreJson({
        ok: false,
        status: 'unknown',
        recoverable: true,
        error: 'We could not confirm the payment response. Check this payment before trying again.'
      }, { status: 502 });
    }
  }

  if (action === 'recover') {
    const attemptToken = typeof body.attemptToken === 'string' ? body.attemptToken.trim() : '';
    const attempt = verifyAttempt(attemptToken, ATTEMPT_RECOVERY_WINDOW_MS);
    if (!attempt) {
      return noStoreJson({ ok: false, code: 'RECOVERY_EXPIRED', error: 'This recovery session is no longer valid.' }, { status: 400 });
    }
    try {
      const payment = await findPaymentForAttempt(attempt);
      if (!payment) {
        return noStoreJson({
          ok: true,
          recovered: false,
          status: 'not-found',
          message: 'No completed Square payment is visible for this attempt yet. If you just paid, wait a few seconds and check again.'
        });
      }
      const { locationId } = getSquarePublicConfig();
      if (payment.status === 'COMPLETED' && isMatchingCompletedFounderPayment(payment, attempt, locationId)) {
        const issued = issueEntitlement(payment, attempt);
        const response = noStoreJson({
          ok: true,
          recovered: true,
          status: 'completed',
          entitlementToken: issued.token,
          entitlement: publicEntitlement(issued.payload),
          receiptUrl: payment.receipt_url || null
        });
        return withEntitlementCookie(response, issued.token);
      }
      if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
        return noStoreJson({
          ok: true,
          recovered: false,
          status: payment.status.toLowerCase(),
          confirmedNotCharged: true,
          message: 'Square confirms this payment was not completed.'
        });
      }
      return noStoreJson({
        ok: true,
        recovered: false,
        status: payment.status?.toLowerCase() || 'pending',
        message: 'Square has the payment, but it is not completed yet. Check again before making another payment.'
      });
    } catch {
      return noStoreJson({
        ok: false,
        recovered: false,
        status: 'unknown',
        error: 'Payment recovery is temporarily unavailable. Do not submit another payment until the status is confirmed.'
      }, { status: 502 });
    }
  }

  return noStoreJson({ ok: false, error: 'Unsupported action.' }, { status: 400 });
}
