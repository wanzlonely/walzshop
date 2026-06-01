import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/auth';
import { redis }            from '@/lib/redis';
import { tvStatusTrx }      from '@/lib/tokovoucher';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const refId = searchParams.get('refId');

  if (!refId) {
    return NextResponse.json({ error: 'Parameter refId diperlukan' }, { status: 400 });
  }

  const stored = await redis.hgetall(`ppob:${refId}`);

  if (!stored || !stored.userId) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  if (stored.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (stored.status === 'pending') {
    try {
      const tvResult = await tvStatusTrx(refId);
      const tvStatus = tvResult?.data?.status;
      const sn       = tvResult?.data?.sn || '';
      const trxId    = tvResult?.data?.trx_id || stored.trx_id || '';

      if (tvStatus === 'sukses') {
        await redis.hset(`ppob:${refId}`, { status: 'sukses', sn, trx_id: trxId });
        stored.status = 'sukses';
        stored.sn     = sn;
      } else if (tvStatus === 'gagal') {
        stored.status = 'gagal';
      }
    } catch (err) {
      console.warn('[PPOB Status] Gagal cek TV:', err.message);
    }
  }

  return NextResponse.json({
    refId,
    status:      stored.status,
    produk:      stored.produk,
    namaProduk:  stored.namaProduk || '',
    tujuan:      stored.tujuan,
    harga:       stored.harga,
    sn:          stored.sn || null,
    trx_id:      stored.trx_id || null,
    message:     stored.message || '',
    createdAt:   stored.createdAt,
    completedAt: stored.completedAt || null,
  });
}
