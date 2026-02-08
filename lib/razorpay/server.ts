import 'server-only';

import crypto from 'crypto';
import { getRazorpayKeyId, getRazorpayKeySecret, getRazorpayWebhookSecret } from '@/lib/env';

interface RazorpayErrorResponse {
  error?: {
    code?: string;
    description?: string;
  };
}

interface RazorpayCustomerResponse {
  id: string;
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpaySubscription {
  id: string;
  status: string;
  plan_id: string;
  customer_id: string | null;
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
  ended_at: number | null;
  has_scheduled_changes?: boolean;
  notes?: Record<string, string>;
  short_url?: string;
}

export interface RazorpayWebhookEvent {
  entity: 'event';
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription?: {
      entity: RazorpaySubscription;
    };
  };
  created_at: number;
}

function getAuthHeader(): string {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

async function razorpayRequest<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const url = `https://api.razorpay.com/v1/${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
  });

  const data = (await response.json()) as T & RazorpayErrorResponse;

  if (!response.ok) {
    const errorMsg = data.error?.description || 'Razorpay request failed.';
    console.error(`[Razorpay] ${method} ${path} → ${response.status}: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return data;
}

export async function createRazorpayCustomer(params: {
  userId: string;
  email: string;
}): Promise<RazorpayCustomerResponse> {
  const body = {
    email: params.email,
    fail_existing: 0,
    notes: {
      user_id: params.userId,
    },
  };

  // Razorpay occasionally returns transient SERVER_ERROR on rapid sequential calls.
  try {
    return await razorpayRequest<RazorpayCustomerResponse>('customers', 'POST', body);
  } catch (firstError) {
    const msg = firstError instanceof Error ? firstError.message : '';
    if (msg.includes('server encountered an error') || msg.includes('SERVER_ERROR')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return razorpayRequest<RazorpayCustomerResponse>('customers', 'POST', body);
    }
    throw firstError;
  }
}

/** How long (in seconds) a checkout link stays valid before Razorpay auto-expires it. */
const CHECKOUT_EXPIRY_SECONDS = 30 * 60; // 30 minutes

export async function createRazorpaySubscriptionCheckout(params: {
  planId: string;
  userId: string;
  userEmail: string;
  totalCount: number;
  /** Re-use an existing Razorpay customer ID (e.g. from a reclaimed stale subscription). */
  existingCustomerId?: string;
}): Promise<{ checkoutUrl: string; subscription: RazorpaySubscription }> {
  let customerId = params.existingCustomerId;

  if (!customerId) {
    const customer = await createRazorpayCustomer({
      userId: params.userId,
      email: params.userEmail,
    });
    customerId = customer.id;
  }

  const expireBy = Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SECONDS;

  const subscription = await razorpayRequest<RazorpaySubscription>('subscriptions', 'POST', {
    plan_id: params.planId,
    total_count: params.totalCount,
    quantity: 1,
    customer_notify: 1,
    customer_id: customerId,
    expire_by: expireBy,
    notes: {
      user_id: params.userId,
    },
  });

  // If short_url is missing, retry once (sometimes populated asynchronously)
  if (!subscription.short_url) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetched = await razorpayRequest<RazorpaySubscription>(`subscriptions/${subscription.id}`, 'GET');
    if (fetched.short_url) {
      subscription.short_url = fetched.short_url;
    }
  }

  if (!subscription.short_url) {
    throw new Error('Razorpay did not return a checkout URL.');
  }

  return {
    checkoutUrl: subscription.short_url,
    subscription,
  };
}

export async function fetchRazorpaySubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(`subscriptions/${subscriptionId}`, 'GET');
}

export async function cancelRazorpaySubscriptionAtPeriodEnd(subscriptionId: string): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(`subscriptions/${subscriptionId}/cancel`, 'POST', {
    cancel_at_cycle_end: 1,
  });
}

export async function cancelRazorpaySubscriptionImmediately(subscriptionId: string): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(`subscriptions/${subscriptionId}/cancel`, 'POST', {
    cancel_at_cycle_end: 0,
  });
}

export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string | null): void {
  if (!signatureHeader) {
    throw new Error('Missing Razorpay signature.');
  }

  const webhookSecret = getRazorpayWebhookSecret();
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex');

  const signatureBuffer = Buffer.from(expected, 'utf8');
  const candidateBuffer = Buffer.from(signatureHeader, 'utf8');

  if (signatureBuffer.length !== candidateBuffer.length || !crypto.timingSafeEqual(signatureBuffer, candidateBuffer)) {
    throw new Error('Razorpay signature mismatch.');
  }
}

export function parseRazorpayWebhookEvent(rawBody: string): RazorpayWebhookEvent {
  return JSON.parse(rawBody) as RazorpayWebhookEvent;
}

export function getRazorpayWebhookEventId(rawBody: string, headerEventId: string | null): string {
  if (headerEventId && headerEventId.trim()) {
    return headerEventId.trim();
  }

  return crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

export function unixToIso(unix: number | null | undefined): string | null {
  if (!unix) {
    return null;
  }

  return new Date(unix * 1000).toISOString();
}
