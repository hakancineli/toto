import React, { useState, useEffect, useMemo } from 'react';
import FutbolcuKarti from './FutbolcuKarti';
import FutbolcuDetay from './FutbolcuDetay';
import transfermarktFutbolcular from '../data/transfermarkt-futbolcular.json';
import './FutbolcuGalerisi.css';

const FutbolcuGalerisi = () => {
  const [futbolcular, setFutbolcular] = useState([]);
  const [seciliFutbolcu, setSeciliFutbolcu] = useState(null);
  const [arama, setArama] = useState('');
  const [filtreTakim, setFiltreTakim] = useState('');
  const [filtreMevki, setFiltreMevki] = useState('');
  const [filtreUyruk, setFiltreUyruk] = useState('');
  const [siralama, setSiralama] = useState('guc-desc'); // guc-desc, guc-asc, isim-asc, isim-desc
  const [favoriler, setFavoriler] = useState([]);
  const [karsilastirma, setKarsilastirma] = useState([]); // Karşılaştırma için seçili futbolcular

  useEffect(() => {
    // Transfermarkt verilerini yükle
    try {
      const veriler = transfermarktFutbolcular || [];
      setFutbolcular(veriler);
    } catch (error) {
      console.error('Futbolcu verileri yüklenemedi:', error);
    }

    // Favorileri localStorage'dan yükle
    const kaydedilmisFavoriler = localStorage.getItem('favoriler');
    if (kaydedilmisFavoriler) {
      setFavoriler(JSON.parse(kaydedilmisFavoriler));
    }
  }, []);

  // Filtreleme ve sıralama
  const filtrelenmisVeSiralanmis = useMemo(() => {
    let filtrelenmis = [...futbolcular];
    
    // Arama
    if (arama) {
      filtrelenmis = filtrelenmis.filter(f => 
        f.isim?.toLowerCase().includes(arama.toLowerCase()) ||
        f.tamIsim?.toLowerCase().includes(arama.toLowerCase()) ||
        f.takım?.toLowerCase().includes(arama.toLowerCase())
      );
    }
    
    // Takım filtresi
    if (filtreTakim) {
      filtrelenmis = filtrelenmis.filter(f => 
        f.takım?.toLowerCase().includes(filtreTakim.toLowerCase())
      );
    }
    
    // Mevki filtresi
    if (filtreMevki) {
      filtrelenmis = filtrelenmis.filter(f => 
        f.basMevki?.toLowerCase().includes(filtreMevki.toLowerCase()) ||
        f.mevki?.toLowerCase().includes(filtreMevki.toLowerCase())
      );
    }
    
    // Uyruk filtresi
    if (filtreUyruk) {
      filtrelenmis = filtrelenmis.filter(f => 
        f.uyruk?.toLowerCase().includes(filtreUyruk.toLowerCase())
      );
    }
    
    // Sıralama
    filtrelenmis.sort((a, b) => {
      switch (siralama) {
        case 'guc-desc':
          return (b.güç || b.guc || 0) - (a.güç || a.guc || 0);
        case 'guc-asc':
          return (a.güç || a.guc || 0) - (b.güç || b.guc || 0);
        case 'isim-asc':
          return (a.isim || '').localeCompare(b.isim || '');
        case 'isim-desc':
          return (b.isim || '').localeCompare(a.isim || '');
        default:
          return 0;
      }
    });
    
    return filtrelenmis;
  }, [futbolcular, arama, filtreTakim, filtreMevki, filtreUyruk, siralama]);

  // Favori ekle/çıkar
  const toggleFavori = (futbolcuId) => {
    const yeniFavoriler = favoriler.includes(futbolcuId)
      ? favoriler.filter(id => id !== futbolcuId)
      : [...favoriler, futbolcuId];
    
    setFavoriler(yeniFavoriler);
    localStorage.setItem('favoriler', JSON.stringify(yeniFavoriler));
  };

  // Karşılaştırma için futbolcu ekle/çıkar
  const toggleKarsilastirma = (futbolcuId) => {
    if (karsilastirma.includes(futbolcuId)) {
      setKarsilastirma(karsilastirma.filter(id => id !== futbolcuId));
    } else if (karsilastirma.length < 2) {
      setKarsilastirma([...karsilastirma, futbolcuId]);
    } else {
      alert('En fazla 2 futbolcu karşılaştırabilirsiniz!');
    }
  };

  // Benzersiz değerler için helper
  const getUniqueValues = (key) => {
    return [...new Set(futbolcular.map(f => f[key]).filter(Boolean))].sort();
  };

  if (seciliFutbolcu) {
    return (
      <FutbolcuDetay 
        futbolcu={seciliFutbolcu} 
        onGeri={() => setSeciliFutbolcu(null)}
        favoriler={favoriler}
        onToggleFavori={toggleFavori}
      />
    );
  }

  if (karsilastirma.length === 2) {
    const futbolcu1 = futbolcular.find(f => f.id === karsilastirma[0]);
    const futbolcu2 = futbolcular.find(f => f.id === karsilastirma[1]);
    
    return (
      <div className="karsilastirma-sayfasi">
        <button className="geri-buton" onClick={() => setKarsilastirma([])}>← Geri</button>
        <h1>Futbolcu Karşılaştırması</h1>
        <div className="karsilastirma-grid">
          <div className="karsilastirma-kart">
            <FutbolcuKarti futbolcu={futbolcu1} />
            <div className="karsilastirma-detay">
              <h3>{futbolcu1?.isim}</h3>
              <div className="karsilastirma-ozellikler">
                <div className="ozellik-item">
                  <span className="ozellik-label">Güç:</span>
                  <span className="ozellik-deger">{futbolcu1?.güç || futbolcu1?.guc || 50}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Takım:</span>
                  <span className="ozellik-deger">{futbolcu1?.takım || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Mevki:</span>
                  <span className="ozellik-deger">{futbolcu1?.basMevki || futbolcu1?.mevki || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Uyruk:</span>
                  <span className="ozellik-deger">{futbolcu1?.uyruk || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Yaş:</span>
                  <span className="ozellik-deger">{futbolcu1?.yas || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Piyasa Değeri:</span>
                  <span className="ozellik-deger">{futbolcu1?.piyasaDegeri || 'Yok'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="karsilastirma-vs">VS</div>
          
          <div className="karsilastirma-kart">
            <FutbolcuKarti futbolcu={futbolcu2} />
            <div className="karsilastirma-detay">
              <h3>{futbolcu2?.isim}</h3>
              <div className="karsilastirma-ozellikler">
                <div className="ozellik-item">
                  <span className="ozellik-label">Güç:</span>
                  <span className="ozellik-deger">{futbolcu2?.güç || futbolcu2?.guc || 50}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Takım:</span>
                  <span className="ozellik-deger">{futbolcu2?.takım || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Mevki:</span>
                  <span className="ozellik-deger">{futbolcu2?.basMevki || futbolcu2?.mevki || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Uyruk:</span>
                  <span className="ozellik-deger">{futbolcu2?.uyruk || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Yaş:</span>
                  <span className="ozellik-deger">{futbolcu2?.yas || 'Yok'}</span>
                </div>
                <div className="ozellik-item">
                  <span className="ozellik-label">Piyasa Değeri:</span>
                  <span className="ozellik-deger">{futbolcu2?.piyasaDegeri || 'Yok'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="futbolcu-galerisi">
      <div className="galeri-header">
        <h1>⚽ Futbolcu Galerisi</h1>
        <p>Toplam {futbolcular.length} futbolcu</p>
      </div>

      <div className="galeri-kontroller">
        <div className="galeri-filtreler">
          <input
            type="text"
            placeholder="🔍 Futbolcu ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="arama-input"
          />
          <select
            value={filtreTakim}
            onChange={(e) => setFiltreTakim(e.target.value)}
            className="filtre-select"
          >
            <option value="">Tüm Takımlar</option>
            {getUniqueValues('takım').map(takim => (
              <option key={takim} value={takim}>{takim}</option>
            ))}
          </select>
          <select
            value={filtreMevki}
            onChange={(e) => setFiltreMevki(e.target.value)}
            className="filtre-select"
          >
            <option value="">Tüm Mevkiler</option>
            {getUniqueValues('basMevki').map(mevki => (
              <option key={mevki} value={mevki}>{mevki}</option>
            ))}
          </select>
          <select
            value={filtreUyruk}
            onChange={(e) => setFiltreUyruk(e.target.value)}
            className="filtre-select"
          >
            <option value="">Tüm Ülkeler</option>
            {getUniqueValues('uyruk').map(uyruk => (
              <option key={uyruk} value={uyruk}>{uyruk}</option>
            ))}
          </select>
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value)}
            className="filtre-select"
          >
            <option value="guc-desc">Güç (Yüksek → Düşük)</option>
            <option value="guc-asc">Güç (Düşük → Yüksek)</option>
            <option value="isim-asc">İsim (A → Z)</option>
            <option value="isim-desc">İsim (Z → A)</option>
          </select>
        </div>
        
        {karsilastirma.length > 0 && (
          <div className="karsilastirma-banner">
            <span>{karsilastirma.length}/2 futbolcu seçildi</span>
            <button onClick={() => setKarsilastirma([])}>Temizle</button>
          </div>
        )}
      </div>

      <div className="galeri-istatistik">
        <span>{filtrelenmisVeSiralanmis.length} futbolcu bulundu</span>
      </div>

      <div className="futbolcu-grid">
        {filtrelenmisVeSiralanmis.map(futbolcu => (
          <div key={futbolcu.id} className="futbolcu-kart-wrapper">
            <div 
              className="futbolcu-kart-overlay"
              onClick={() => setSeciliFutbolcu(futbolcu)}
            >
              <FutbolcuKarti futbolcu={futbolcu} secilebilir={true} />
            </div>
            <div className="kart-aksiyonlar">
              <button
                className={`aksiyon-buton favori ${favoriler.includes(futbolcu.id) ? 'aktif' : ''}`}
                onClick={() => toggleFavori(futbolcu.id)}
                title="Favorilere ekle"
              >
                {favoriler.includes(futbolcu.id) ? '❤️' : '🤍'}
              </button>
              <button
                className={`aksiyon-buton karsilastir ${karsilastirma.includes(futbolcu.id) ? 'aktif' : ''}`}
                onClick={() => toggleKarsilastirma(futbolcu.id)}
                title="Karşılaştır"
                disabled={karsilastirma.length === 2 && !karsilastirma.includes(futbolcu.id)}
              >
                ⚖️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FutbolcuGalerisi;

