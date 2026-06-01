import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/auth';
import { redis, getBalance, deductBalance, addBalance } from '@/lib/redis';
import { tvPascabayarInquiry, tvTransaksi } from '@/lib/tokovoucher';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
  }
  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const { produk, tujuan, serverId = '', harga, confirm = false } = body;

  if (!produk || !tujuan) {
    return NextResponse.json({ error: 'Field produk dan tujuan wajib diisi' }, { status: 400 });
  }

  if (!confirm) {
    const refId = `INQ-${Date.now()}-${userId.slice(-4)}`;
    try {
      const result = await tvPascabayarInquiry(refId, produk, tujuan, serverId);
      return NextResponse.json({ success: true, data: result?.data || result });
    } catch (err) {
      console.error('[Pascabayar Inquiry] Error:', err);
      return NextResponse.json({ error: 'Gagal melakukan inquiry tagihan' }, { status: 502 });
    }
  }

  if (!harga || Number(harga) <= 0) {
    return NextResponse.json({ error: 'Harga tidak valid untuk pembayaran' }, { status: 400 });
  }

  const hargaNum = Number(harga);
  const saldo    = await getBalance(userId);

  if (saldo < hargaNum) {
    return NextResponse.json(
      { error: `Saldo tidak cukup. Saldo Anda: Rp${saldo.toLocaleString('id-ID')}` },
      { status: 400 }
    );
  }

  const refId = `PASCA-${Date.now()}-${userId.slice(-6).toUpperCase()}`;

  await redis.hset(`ppob:${refId}`, {
    userId, produk, tujuan, serverId,
    harga: hargaNum, jenis: 'pascabayar', status: 'pending', createdAt: Date.now(),
  });

  await deductBalance(userId, hargaNum);

  let tvResult;
  try {
    tvResult = await tvTransaksi(refId, produk, tujuan, serverId);
  } catch (err) {
    await addBalance(userId, hargaNum);
    await redis.hset(`ppob:${refId}`, { status: 'gagal', message: 'Gagal terhubung ke server' });
    return NextResponse.json({ error: 'Gagal memproses pembayaran tagihan' }, { status: 502 });
  }

  const tvData   = tvResult?.data || {};
  const tvStatus = tvData.status || 'pending';

  await redis.hset(`ppob:${refId}`, {
    trx_id:  tvData.trx_id || '',
    sn:      tvData.sn     || '',
    status:  tvStatus === 'sukses' ? 'sukses' : 'pending',
    message: tvResult?.message || '',
  });

  if (tvStatus === 'gagal') {
    await addBalance(userId, hargaNum);
    await redis.hset(`ppob:${refId}`, { status: 'gagal' });
  }

  return NextResponse.json({
    success: true,
    refId,
    status:  tvStatus === 'sukses' ? 'sukses' : 'pending',
    message: tvResult?.message || 'Pembayaran sedang diproses',
  });
}
