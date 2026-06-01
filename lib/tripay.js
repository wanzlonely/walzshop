import crypto from 'crypto';

const isSandbox = () => (process.env.TRIPAY_ENV || 'sandbox') !== 'production';

const TRIPAY_BASE    = () => isSandbox() ? 'https://tripay.co.id/api-sandbox' : 'https://tripay.co.id/api';
const API_KEY        = () => process.env.TRIPAY_API_KEY;
const PRIVATE_KEY    = () => process.env.TRIPAY_PRIVATE_KEY;
const MERCHANT_CODE  = () => process.env.TRIPAY_MERCHANT_CODE;

function generateSignature(merchantRef, amount) {
  return crypto
    .createHmac('sha256', PRIVATE_KEY())
    .update(MERCHANT_CODE() + merchantRef + amount)
    .digest('hex');
}

export async function tripayCreateTransaction({
  merchant_ref,
  amount,
  customer_name,
  customer_email,
  customer_phone = '',
  items,
  payment_method = 'QRISC',
}) {
  const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const returnUrl   = (process.env.NEXT_PUBLIC_BASE_URL || '') + '/ppob';

  const payload = {
    method:        payment_method,
    merchant_ref,
    amount,
    customer_name,
    customer_email,
    customer_phone,
    order_items:   items,
    return_url:    returnUrl,
    expired_time:  expiredTime,
    signature:     generateSignature(merchant_ref, amount),
  };

  const r = await fetch(`${TRIPAY_BASE()}/transaction/create`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${API_KEY()}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  return r.json();
}

export async function tripayGetTransaction(reference) {
  const r = await fetch(`${TRIPAY_BASE()}/transaction/detail?reference=${reference}`, {
    headers: { Authorization: `Bearer ${API_KEY()}` },
    cache:   'no-store',
  });
  return r.json();
}

export async function tripayGetChannels(amount = null) {
  const url = amount
    ? `${TRIPAY_BASE()}/merchant/payment-channel?amount=${amount}`
    : `${TRIPAY_BASE()}/merchant/payment-channel`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY()}` },
    cache:   'no-store',
  });
  return r.json();
}

export function verifyTripayWebhook(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', PRIVATE_KEY())
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}
