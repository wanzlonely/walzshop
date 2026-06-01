import { NextResponse }            from 'next/server';
import { getServerSession }        from 'next-auth/next';
import { authOptions }             from '@/lib/auth';
import { redis }                   from '@/lib/redis';
import { tripayCreateTransaction } from '@/lib/tripay';

const MIN_DEPOSIT = 10_000;
const MAX_DEPOSIT = 10_000_000;

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
  }

  const user = session.user;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const { amount, payment_method = 'QRISC' } = body;
  const amountNum = Number(amount);

  if (isNaN(amountNum) || amountNum < MIN_DEPOSIT) {
    return NextResponse.json(
      { error: `Minimal deposit Rp${MIN_DEPOSIT.toLocaleString('id-ID')}` },
      { status: 400 }
    );
  }
  if (amountNum > MAX_DEPOSIT) {
    return NextResponse.json(
      { error: `Maksimal deposit Rp${MAX_DEPOSIT.toLocaleString('id-ID')}` },
      { status: 400 }
    );
  }

  const merchantRef = `DEP-${Date.now()}-${user.id.slice(-6).toUpperCase()}`;

  await redis.hset(`deposit:tripay:${merchantRef}`, {
    userId: user.id, amount: amountNum, payment_method, status: 'pending', createdAt: Date.now(),
  });

  let tripayResult;
  try {
    tripayResult = await tripayCreateTransaction({
      merchant_ref:   merchantRef,
      amount:         amountNum,
      customer_name:  user.name  || 'Pelanggan',
      customer_email: user.email || '',
      payment_method,
      items: [{ name: 'Deposit Saldo', price: amountNum, quantity: 1 }],
    });
  } catch (err) {
    console.error('[Payment Create] Tripay error:', err);
    await redis.del(`deposit:tripay:${merchantRef}`);
    return NextResponse.json({ error: 'Gagal membuat transaksi pembayaran' }, { status: 502 });
  }

  if (!tripayResult?.data) {
    console.error('[Payment Create] Tripay response tidak valid:', tripayResult);
    return NextResponse.json(
      { error: tripayResult?.message || 'Respons tidak valid dari payment gateway' },
      { status: 502 }
    );
  }

  const trData = tripayResult.data;

  await redis.hset(`deposit:tripay:${merchantRef}`, {
    tripay_reference: trData.reference,
    checkout_url:     trData.checkout_url || '',
    pay_url:          trData.pay_url      || '',
    expired_time:     trData.expired_time || '',
  });

  return NextResponse.json({
    success:     true,
    merchantRef,
    reference:   trData.reference,
    checkoutUrl: trData.checkout_url || trData.pay_url,
    amount:      amountNum,
    qrString:    trData.qr_string  || null,
    qrUrl:       trData.qr_url     || null,
    payCode:     trData.pay_code   || null,
    expiredTime: trData.expired_time,
  });
}
