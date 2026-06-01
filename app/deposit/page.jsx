'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter }  from 'next/navigation';

const NOMINAL_PRESETS = [10000, 20000, 50000, 100000, 200000, 500000];
const rp = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

function Row({ label, value, highlight, mono }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium text-right ${highlight ? 'text-blue-700 font-bold' : 'text-gray-800'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function DepositPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [amount,    setAmount]    = useState('');
  const [channels,  setChannels]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadingCh, setLoadingCh] = useState(false);
  const [error,     setError]     = useState('');
  const [result,    setResult]    = useState(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login?callbackUrl=/deposit');
  }, [authStatus, router]);

  useEffect(() => {
    const num = Number(amount);
    if (num >= 10000) {
      const t = setTimeout(() => fetchChannels(num), 600);
      return () => clearTimeout(t);
    }
  }, [amount]);

  const fetchChannels = async (nominal) => {
    setLoadingCh(true);
    setSelected(null);
    try {
      const res  = await fetch(`/api/payment/channels?amount=${nominal}`);
      const data = await res.json();
      setChannels(data?.data || []);
    } catch {
      setChannels([]);
    } finally {
      setLoadingCh(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || Number(amount) < 10000) return setError('Minimal deposit Rp10.000');
    if (!selected) return setError('Pilih metode pembayaran terlebih dahulu');
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/payment/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: Number(amount), payment_method: selected.code }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Gagal membuat transaksi');
      setResult(data);
    } catch {
      setError('Gagal terhubung ke server pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💰 Top Up Saldo</h1>
          <p className="text-sm text-gray-500 mt-1">Isi saldo untuk bertransaksi PPOB</p>
        </div>

        {!result ? (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <h2 className="font-semibold text-gray-700">Pilih Nominal</h2>
              <div className="grid grid-cols-3 gap-2">
                {NOMINAL_PRESETS.map(n => (
                  <button
                    key={n}
                    onClick={() => setAmount(String(n))}
                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      amount === String(n)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {rp(n)}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Atau masukkan nominal lain</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="10000"
                    min={10000}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {(loadingCh || channels.length > 0) && (
              <div className="bg-white rounded-2xl shadow p-5 space-y-3">
                <h2 className="font-semibold text-gray-700">Metode Pembayaran</h2>
                {loadingCh ? (
                  <div className="py-4 text-center text-sm text-gray-400">Memuat metode pembayaran...</div>
                ) : (
                  <div className="space-y-2">
                    {channels.map(ch => (
                      <button
                        key={ch.code}
                        onClick={() => setSelected(ch)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          selected?.code === ch.code
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {ch.icon_url && (
                            <img src={ch.icon_url} alt={ch.name} className="h-8 w-auto object-contain" />
                          )}
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">{ch.name}</div>
                            {ch.fee_customer && (
                              <div className="text-xs text-gray-400">Biaya: {rp(ch.fee_customer)}</div>
                            )}
                          </div>
                        </div>
                        {selected?.code === ch.code && <span className="text-blue-500 text-lg">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={loading || !amount || !selected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Membuat transaksi...' : `Lanjutkan Pembayaran ${amount ? rp(amount) : ''}`}
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🧾</div>
              <h2 className="text-lg font-bold text-gray-800">Selesaikan Pembayaran</h2>
              <p className="text-sm text-gray-500">Saldo akan otomatis ditambahkan setelah pembayaran terkonfirmasi</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <Row label="Nominal"    value={rp(result.amount)} highlight />
              <Row label="Ref ID"     value={result.merchantRef} mono />
              <Row label="Kadaluarsa" value={result.expiredTime ? new Date(result.expiredTime * 1000).toLocaleString('id-ID') : '-'} />
            </div>

            {result.qrString && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Scan QR untuk membayar</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(result.qrString)}&size=200x200`}
                  alt="QR Code"
                  className="mx-auto rounded-lg"
                />
              </div>
            )}

            {result.payCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 mb-1">Kode Bayar</p>
                <p className="text-2xl font-bold text-blue-700 tracking-widest">{result.payCode}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(result.payCode)}
                  className="text-xs text-blue-400 underline mt-1"
                >
                  Salin
                </button>
              </div>
            )}

            {result.checkoutUrl && (
              <a
                href={result.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Bayar Sekarang →
              </a>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full text-gray-500 text-sm underline"
            >
              Buat Transaksi Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
