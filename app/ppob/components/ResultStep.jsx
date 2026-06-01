import { StatusBadge, Row } from './ui';

export function ResultStep({ result, polling, onReset }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">
          {result.status === 'sukses' ? '✅' : result.status === 'gagal' ? '❌' : '⏳'}
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {result.status === 'sukses'
            ? 'Transaksi Berhasil!'
            : result.status === 'gagal'
            ? 'Transaksi Gagal'
            : 'Sedang Diproses...'}
        </h2>
        {polling && (
          <p className="text-sm text-yellow-600 mt-1 animate-pulse">🔄 Mengecek status otomatis...</p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
        <Row label="ID Transaksi" value={result.refId} mono />
        <Row label="Status"       value={<StatusBadge status={result.status} />} />
        {result.sn      && <Row label="Serial Number / Token" value={result.sn} highlight mono />}
        {result.message && <Row label="Pesan" value={result.message} />}
      </div>

      {result.status === 'sukses' && result.sn && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 mb-1">Serial Number / Token</p>
          <p className="text-2xl font-bold text-green-700 tracking-widest">{result.sn}</p>
          <button
            onClick={() => navigator.clipboard.writeText(result.sn)}
            className="mt-2 text-xs text-green-500 underline"
          >
            Salin
          </button>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        Transaksi Lain
      </button>
    </div>
  );
}
