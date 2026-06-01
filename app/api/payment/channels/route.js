import { NextResponse }      from 'next/server';
import { tripayGetChannels } from '@/lib/tripay';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount');

  try {
    const data = await tripayGetChannels(amount ? Number(amount) : null);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Payment Channels] Error:', err);
    return NextResponse.json({ error: 'Gagal mengambil channel pembayaran' }, { status: 500 });
  }
}
