import { NextResponse } from 'next/server';
import { redis, addBalance } from '@/lib/redis';
import { verifyTvWebhook } from '@/lib/tokovoucher';

export async function POST(request) {
  const reqId     = request.headers.get('x-requested-id');
  const tvAuthHdr = request.headers.get('x-tokovoucher-authorization');

  const rawBody = await request.text();
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  if (tvAuthHdr) {
    const { ref_id, status, sn, trx_id, message } = body;

    if (!ref_id) return new NextResponse('OK', { status: 200 });

    if (!verifyTvWebhook(request, ref_id)) {
      console.warn('[TV Webhook] Signature tidak valid untuk ref_id:', ref_id);
      return new NextResponse('Forbidden', { status: 403 });
    }

    const ppobKey = `ppob:${ref_id}`;
    const stored  = await redis.hgetall(ppobKey);

    if (!stored) return new NextResponse('OK', { status: 200 });

    if (status === 'sukses') {
      await redis.hset(ppobKey, {
        status: 'sukses', sn: sn || '',
        trx_id: trx_id || stored.trx_id || '',
        message: message || '', completedAt: Date.now(),
      });
      console.log(`[TV Webhook] PPOB sukses — ref_id: ${ref_id}, SN: ${sn}`);
    } else if (status === 'gagal') {
      if (stored.status !== 'gagal' && stored.userId && stored.harga) {
        await addBalance(stored.userId, Number(stored.harga));
      }
      await redis.hset(ppobKey, { status: 'gagal', message: message || '', completedAt: Date.now() });
      console.log(`[TV Webhook] PPOB gagal — ref_id: ${ref_id}`);
    }

    return new NextResponse('OK', { status: 200 });
  }

  const validId = process.env.RUMAHOTP_WEBHOOK_ID;
  if (validId && reqId !== validId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { category, id } = body;

  if (category === 'callback.deposit') {
    const { diterima } = body;
    const dep = await redis.hgetall(`deposit:${id}`);
    if (dep && dep.status !== 'completed') {
      await addBalance(dep.userId, Number(diterima || 0));
      await redis.hset(`deposit:${id}`, { status: 'completed', completedAt: Date.now() });
    }
    return new NextResponse('OK', { status: 200 });
  }

  if (category === 'callback.number') {
    const { code, text, number } = body;
    await redis.hset(`order:${id}`, { code, text, number, status: 'completed', completedAt: Date.now() });
    const order = await redis.hgetall(`order:${id}`);
    if (order?.userId) {
      await redis.publish(`otp:${order.userId}`, JSON.stringify({ id, code, number, text }));
    }
    return new NextResponse('OK', { status: 200 });
  }

  return new NextResponse('OK', { status: 200 });
}
