export function StatusBadge({ status }) {
  const map = {
    sukses:  { color: 'bg-green-100 text-green-700',   label: '✅ Sukses' },
    pending: { color: 'bg-yellow-100 text-yellow-700', label: '⏳ Diproses' },
    gagal:   { color: 'bg-red-100 text-red-700',       label: '❌ Gagal' },
  };
  const s = map[status] || { color: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

export function Row({ label, value, highlight, mono }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-right font-medium ${highlight ? 'text-blue-700 font-bold' : 'text-gray-800'} ${mono ? 'font-mono text-xs break-all' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
