import { NextResponse } from 'next/server';
import { tvGetProduk } from '@/lib/tokovoucher';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kode = searchParams.get('kode');

  if (!kode) {
    return NextResponse.json(
      { error: 'Parameter ?kode= diperlukan. Contoh: PULSA, PLNPRA, BPJS, FF' },
      { status: 400 }
    );
  }

  try {
    const data = await tvGetProduk(kode.toUpperCase());
    return NextResponse.json(data);
  } catch (err) {
    console.error('[PPOB Produk] Error:', err);
    return NextResponse.json({ error: 'Gagal mengambil produk dari server' }, { status: 500 });
  }
}
