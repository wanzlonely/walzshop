import crypto from 'crypto';

const TV_BASE       = 'https://api.tokovoucher.net';
const TV_BASE_PASCA = 'https://api.tokovoucher.id';

const MEMBER_CODE = () => process.env.TV_MEMBER_CODE;
const SECRET_KEY  = () => process.env.TV_SECRET_KEY;
const SIG_DEFAULT = () => process.env.TV_SIGNATURE_DEFAULT;

function signTrx(refId) {
  return crypto.createHash('md5')
    .update(`${MEMBER_CODE()}:${SECRET_KEY()}:${refId}`)
    .digest('hex');
}

function signPasca(refId) {
  return crypto.createHash('md5')
    .update(`${refId}:${MEMBER_CODE()}:${SECRET_KEY()}`)
    .digest('hex');
}

export async function tvGetSaldo() {
  const url = `${TV_BASE}/member?member_code=${MEMBER_CODE()}&signature=${SIG_DEFAULT()}`;
  const r = await fetch(url, { cache: 'no-store' });
  return r.json();
}

export async function tvGetProduk(kode) {
  const params = new URLSearchParams({ member_code: MEMBER_CODE(), signature: SIG_DEFAULT(), kode });
  const r = await fetch(`${TV_BASE}/produk/code?${params}`, { cache: 'no-store' });
  return r.json();
}

export async function tvTransaksi(refId, produk, tujuan, serverId = '') {
  const body = {
    ref_id:      refId,
    produk,
    tujuan,
    server_id:   serverId,
    member_code: MEMBER_CODE(),
    signature:   signTrx(refId),
  };
  const r = await fetch(`${TV_BASE}/v1/transaksi`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}

export async function tvStatusTrx(refId) {
  const body = {
    ref_id:      refId,
    member_code: MEMBER_CODE(),
    signature:   signTrx(refId),
  };
  const r = await fetch(`${TV_BASE}/v1/transaksi/status`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}

export async function tvPascabayarInquiry(refId, produk, tujuan, serverId = '') {
  const body = {
    ref_id:      refId,
    produk,
    tujuan,
    server_id:   serverId,
    member_code: MEMBER_CODE(),
    signature:   signPasca(refId),
  };
  const r = await fetch(`${TV_BASE_PASCA}/v1/pascabayar-inq`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}

export function verifyTvWebhook(request, refId) {
  const header   = request.headers.get('x-tokovoucher-authorization') || '';
  const expected = crypto.createHash('md5')
    .update(`${MEMBER_CODE()}:${SECRET_KEY()}:${refId}`)
    .digest('hex');
  return header === expected;
}
