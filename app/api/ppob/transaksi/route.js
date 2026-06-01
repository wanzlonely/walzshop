import { NextResponse }          from 'next/server';
import { getServerSession }      from 'next-auth/next';
import { authOptions }           from '@/lib/auth';
import { redis, getBalance, deductBalance, addBalance } from '@/lib/redis';
import { tvTransaksi }           from '@/lib/tokovoucher';

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

  const { produk, tujuan, serverId = '', harga, namaProduk = '' } = body;

  if (!produk || !tujuan || !harga) {
    return NextResponse.json({ error: 'Field produk, tujuan, dan harga wajib diisi' }, { status: 400 });
  }

  const hargaNum = Number(harga);
  if (isNaN(hargaNum) || hargaNum <= 0) {
    return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 });
  }

  const saldo = await getBalance(userId);
  if (saldo < hargaNum) {
    return NextResponse.json(
      { error: `Saldo tidak cukup. Saldo Anda: Rp${saldo.toLocaleString('id-ID')}` },
      { status: 400 }
    );
  }

  const refId = `TV-${Date.now()}-${userId.slice(-6).toUpperCase()}`;

  await redis.hset(`ppob:${refId}`, {
    userId, produk, namaProduk, tujuan, serverId,
    harga: hargaNum, status: 'pending', createdAt: Date.now(),
  });

  await deductBalance(userId, hargaNum);

  let tvResult;
  try {
    tvResult = await tvTransaksi(refId, produk, tujuan, serverId);
  } catch (err) {
    await addBalance(userId, hargaNum);
    await redis.hset(`ppob:${refId}`, { status: 'gagal', message: 'Gagal terhubung ke server' });
    console.error('[PPOB Transaksi] TV call error:', err);
    return NextResponse.json({ error: 'Gagal terhubung ke penyedia layanan' }, { status: 502 });
  }

  const tvData   = tvResult?.data || {};
  const tvStatus = tvData.status || 'pending';
  const trxId    = tvData.trx_id || tvData.id || '';
  const sn       = tvData.sn || '';

  await redis.hset(`ppob:${refId}`, {
    trx_id: trxId, sn,
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
    sn,
    message: tvResult?.message || 'Transaksi sedang diproses',
  });
}
