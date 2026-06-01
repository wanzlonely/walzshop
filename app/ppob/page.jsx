'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter }  from 'next/navigation';

import { CategoryStep } from './components/CategoryStep';
import { FormStep }     from './components/FormStep';
import { ConfirmStep }  from './components/ConfirmStep';
import { ResultStep }   from './components/ResultStep';

export default function PPOBPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [step,         setStep]         = useState('category');
  const [activeCategory, setActive]     = useState(null);
  const [tujuan,       setTujuan]       = useState('');
  const [serverId,     setServerId]     = useState('');
  const [produkList,   setProdukList]   = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [inquiry,      setInquiry]      = useState(null);
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [polling,      setPolling]      = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/ppob');
    }
  }, [authStatus, router]);

  const fetchProduk = useCallback(async (kode) => {
    setLoading(true);
    setError('');
    setProdukList([]);
    setSelectedProd(null);
    try {
      const res  = await fetch(`/api/ppob/produk?kode=${kode}`);
      const data = await res.json();
      const list = data?.data || data || [];
      setProdukList(Array.isArray(list) ? list : []);
      if (!Array.isArray(list) || list.length === 0) {
        setError('Tidak ada produk tersedia untuk kategori ini.');
      }
    } catch {
      setError('Gagal memuat produk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectCategory = (cat) => {
    setActive(cat);
    setTujuan('');
    setServerId('');
    setError('');
    setInquiry(null);
    setSelectedProd(null);
    if (cat.type === 'prabayar') fetchProduk(cat.kode);
    setStep('form');
  };

  const handleInquiry = async () => {
    if (!tujuan.trim()) return setError('Masukkan nomor/ID tujuan terlebih dahulu.');
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/ppob/pascabayar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ produk: activeCategory.kode, tujuan }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Gagal cek tagihan');
      setInquiry(data.data);
      setStep('confirm');
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setLoading(true);
    setError('');

    const isPasca  = activeCategory.type === 'pascabayar';
    const harga    = isPasca ? inquiry?.tagihan || inquiry?.amount : selectedProd?.harga;
    const namaProd = isPasca ? `${activeCategory.label} - ${tujuan}` : selectedProd?.nama;
    const endpoint = isPasca ? '/api/ppob/pascabayar' : '/api/ppob/transaksi';

    const payload = isPasca
      ? { produk: activeCategory.kode, tujuan, harga, confirm: true }
      : { produk: selectedProd.kode, tujuan, serverId, harga, namaProduk: namaProd };

    try {
      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Transaksi gagal');

      setResult(data);
      setStep('result');

      if (data.status === 'pending') {
        setPolling(true);
        pollStatus(data.refId);
      }
    } catch {
      setError('Gagal memproses transaksi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async (refId, attempt = 0) => {
    if (attempt > 20) { setPolling(false); return; }
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res  = await fetch(`/api/ppob/status?refId=${refId}`);
      const data = await res.json();
      setResult(prev => ({ ...prev, ...data }));
      if (data.status === 'pending') {
        pollStatus(refId, attempt + 1);
      } else {
        setPolling(false);
      }
    } catch {
      setPolling(false);
    }
  };

  const reset = () => {
    setStep('category');
    setActive(null);
    setTujuan('');
    setServerId('');
    setProdukList([]);
    setSelectedProd(null);
    setInquiry(null);
    setResult(null);
    setError('');
    setPolling(false);
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">💳 Layanan PPOB</h1>
          <p className="text-gray-500 text-sm mt-1">Pulsa, Token Listrik, Tagihan, dan lebih banyak lagi</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {step === 'category' && (
          <CategoryStep onSelect={handleSelectCategory} />
        )}

        {step === 'form' && activeCategory && (
          <FormStep
            category={activeCategory}
            tujuan={tujuan}         setTujuan={setTujuan}
            serverId={serverId}     setServerId={setServerId}
            produkList={produkList}
            selectedProd={selectedProd} setSelectedProd={setSelectedProd}
            loading={loading}
            onInquiry={handleInquiry}
            onNext={() => setStep('confirm')}
            onBack={reset}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            category={activeCategory}
            tujuan={tujuan}
            serverId={serverId}
            selectedProd={selectedProd}
            inquiry={inquiry}
            loading={loading}
            onConfirm={handleBuy}
            onBack={() => setStep('form')}
          />
        )}

        {step === 'result' && result && (
          <ResultStep result={result} polling={polling} onReset={reset} />
        )}
      </div>
    </div>
  );
}
