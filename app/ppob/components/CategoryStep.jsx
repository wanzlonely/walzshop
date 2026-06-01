import { CATEGORIES } from './constants';

export function CategoryStep({ onSelect }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="font-semibold text-gray-700 mb-4">Pilih Layanan</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <span className="text-3xl mb-2">{cat.icon}</span>
            <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700 text-center">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
