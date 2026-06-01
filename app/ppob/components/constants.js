export const CATEGORIES = [
  // Pulsa
  { id: 'tsel',      label: 'Telkomsel',        kode: 'TSEL',     icon: '📱', type: 'prabayar',   placeholder: 'Contoh: 081234567890' },
  { id: 'xl',        label: 'XL / AXIS',        kode: 'XL',       icon: '📱', type: 'prabayar',   placeholder: 'Contoh: 087812345678' },
  { id: 'tri',       label: 'Tri (3)',           kode: 'TRI',      icon: '📱', type: 'prabayar',   placeholder: 'Contoh: 089612345678' },
  // Listrik
  { id: 'pln',       label: 'Token Listrik',    kode: 'PLN',      icon: '⚡', type: 'prabayar',   placeholder: 'Contoh: 123456789012' },
  { id: 'plnpasca',  label: 'Tagihan Listrik',  kode: 'PLNPASCH', icon: '🏠', type: 'pascabayar', placeholder: 'Contoh: 123456789012' },
  // Tagihan
  { id: 'bpjs',      label: 'BPJS Kesehatan',   kode: 'BPJS',     icon: '🏥', type: 'pascabayar', placeholder: 'Contoh: 0001234567890' },
  { id: 'pdam',      label: 'PDAM',             kode: 'PDAM',     icon: '💧', type: 'pascabayar', placeholder: 'Contoh: 1234567890' },
  { id: 'indihome',  label: 'IndiHome',         kode: 'INDIHOME', icon: '📡', type: 'pascabayar', placeholder: 'Contoh: 02112345678' },
  // E-Wallet
  { id: 'gopay',     label: 'GoPay',            kode: 'GOPAY',    icon: '💚', type: 'prabayar',   placeholder: 'Contoh: 081234567890' },
  { id: 'ovo',       label: 'OVO',              kode: 'OVO',      icon: '💜', type: 'prabayar',   placeholder: 'Contoh: 081234567890' },
  { id: 'dana',      label: 'DANA',             kode: 'DANA',     icon: '💙', type: 'prabayar',   placeholder: 'Contoh: 081234567890' },
  // Game
  { id: 'mlbb',      label: 'Mobile Legends',   kode: 'MLBB',     icon: '🎮', type: 'prabayar',   placeholder: 'Contoh: 123456789', hasServer: true },
  { id: 'ff',        label: 'Free Fire',        kode: 'FF',       icon: '🔥', type: 'prabayar',   placeholder: 'Contoh: 123456789' },
  { id: 'pubg',      label: 'PUBG Mobile',      kode: 'PUBG',     icon: '🎯', type: 'prabayar',   placeholder: 'Contoh: 123456789' },
  { id: 'steam',     label: 'Steam Wallet',     kode: 'STEAM',    icon: '🎲', type: 'prabayar',   placeholder: 'Contoh: email@steam.com' },
  { id: 'netflix',   label: 'Netflix',          kode: 'NETFLIX',  icon: '🎬', type: 'prabayar',   placeholder: 'Contoh: email@gmail.com' },
  { id: 'token',     label: 'Token & Voucher',  kode: 'TOKEN',    icon: '🎫', type: 'prabayar',   placeholder: 'Contoh: 123456789' },
];

export const rp = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;
