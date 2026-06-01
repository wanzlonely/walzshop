import { rp } from './constants';

export function FormStep({
  category,
  tujuan, setTujuan,
  serverId, setServerId,
  produkList,
  selectedProd, setSelectedProd,
  loading,
  onInquiry,
  onNext,
  onBack,
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">←</button>
        <span className="text-xl">{category.icon}</span>
        <h2 className="font-semibold text-gray-800">{category.label}</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nomor / ID Tujuan
        </label>
        <input
          type="text"
          value={tujuan}
          onChange={e => setTujuan(e.target.value)}
          placeholder={category.placeholder}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {category.hasServer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Server ID (jika ada)
          </label>
          <input
            type="text"
            value={serverId}
            onChange={e => setServerId(e.target.value)}
            placeholder="Contoh: 1234"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {category.type === 'pascabayar' && (
        <button
          onClick={onInquiry}
          disabled={loading || !tujuan.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Mengecek tagihan...' : '🔍 Cek Tagihan'}
        </button>
      )}

      {category.type === 'prabayar' && (
        <>
          {loading && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Memuat produk...</p>
            </div>
          )}
          {!loading && produkList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Produk
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {produkList.map((prod, i) => (
                  <button
                    key={prod.kode || i}
                    onClick={() => setSelectedProd(prod)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      selectedProd?.kode === prod.kode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-800">{prod.nama || prod.name}</div>
                    <div className="text-blue-600 font-bold text-sm mt-0.5">{rp(prod.harga || prod.price)}</div>
                    {prod.keterangan && (
                      <div className="text-xs text-gray-400 mt-0.5">{prod.keterangan}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!loading && selectedProd && tujuan.trim() && (
            <button
              onClick={onNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Lanjutkan →
            </button>
          )}
        </>
      )}
    </div>
  );
}
