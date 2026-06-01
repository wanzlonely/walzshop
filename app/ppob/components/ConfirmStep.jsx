import { Row } from './ui';
import { rp } from './constants';

export function ConfirmStep({ category, tujuan, serverId, selectedProd, inquiry, loading, onConfirm, onBack }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">←</button>
        <h2 className="font-semibold text-gray-800">Konfirmasi Pembelian</h2>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
        <Row label="Layanan" value={category.label} />
        <Row label="Tujuan"  value={tujuan} />
        {serverId && <Row label="Server ID" value={serverId} />}

        {category.type === 'prabayar' && selectedProd && (
          <>
            <Row label="Produk" value={selectedProd.nama || selectedProd.name} />
            <Row label="Harga"  value={rp(selectedProd.harga || selectedProd.price)} highlight />
          </>
        )}

        {category.type === 'pascabayar' && inquiry && (
          <>
            {inquiry.nama_pelanggan && <Row label="Nama"    value={inquiry.nama_pelanggan} />}
            {inquiry.periode        && <Row label="Periode" value={inquiry.periode} />}
            {inquiry.daya           && <Row label="Daya"    value={inquiry.daya} />}
            <Row label="Tagihan" value={rp(inquiry.tagihan || inquiry.amount || 0)} highlight />
          </>
        )}
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
      >
        {loading ? 'Memproses...' : '✅ Konfirmasi & Bayar'}
      </button>
      <p className="text-xs text-gray-400 text-center">Saldo akan dipotong saat tombol ditekan</p>
    </div>
  );
}
