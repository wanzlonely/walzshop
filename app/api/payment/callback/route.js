import { NextResponse }        from 'next/server';
import { redis, addBalance }   from '@/lib/redis';
import { verifyTripayWebhook } from '@/lib/tripay';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const rawBody   = await request.text();
  const signature = request.headers.get('x-callback-signature') || '';

  if (!verifyTripayWebhook(rawBody, signature)) {
    console.warn('[Tripay CB] Signature tidak valid');
    return new NextResponse('Invalid Signature', { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const { merchant_ref, reference, status, total_amount } = body;

  if (!merchant_ref) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const depositKey = `deposit:tripay:${merchant_ref}`;
  const depData    = await redis.hgetall(depositKey);

  if (depData && depData.status !== 'completed') {
    if (status === 'PAID') {
      const amount = Number(total_amount || depData.amount || 0);
      if (amount > 0 && depData.userId) {
        await addBalance(depData.userId, amount);
      }
      await redis.hset(depositKey, {
        status: 'completed', tripay_reference: reference, completedAt: Date.now(),
      });
      console.log(`[Tripay CB] Deposit PAID — ref: ${merchant_ref}, user: ${depData.userId}, amount: ${amount}`);
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      await redis.hset(depositKey, { status: status.toLowerCase(), completedAt: Date.now() });
      console.log(`[Tripay CB] Deposit ${status} — ref: ${merchant_ref}`);
    }
  }

  return NextResponse.json({ success: true });
}
