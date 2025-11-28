import React, { useState, useEffect } from 'react';
import TakimSayfasi from './TakimSayfasi';
import './TakimlarListesi.css';

// Sofifa verilerini ES6 import ile yükle
import sofifaTakimlarData from '../data/sofifa-takimlar.json';
import sofifaFutbolcularData from '../data/sofifa-futbolcular.json';

// Verileri güvenli şekilde al
const sofifaTakimlar = Array.isArray(sofifaTakimlarData) ? sofifaTakimlarData : [];
const sofifaFutbolcular = Array.isArray(sofifaFutbolcularData) ? sofifaFutbolcularData : [];

const TakimlarListesi = () => {
  const [takimlar, setTakimlar] = useState([]);
  const [seciliTakim, setSeciliTakim] = useState(null);
  const [arama, setArama] = useState('');
  const [filtreLig, setFiltreLig] = useState('');

  useEffect(() => {
    try {
      // Sofifa verilerini yükle
      const takimVerileri = Array.isArray(sofifaTakimlar) ? sofifaTakimlar : [];
      const oyuncuVerileri = Array.isArray(sofifaFutbolcular) ? sofifaFutbolcular : [];
      
      // Takımlara oyuncularını ekle
      const takimlarOyuncularla = takimVerileri.map(takim => {
        const takimOyuncular = oyuncuVerileri.filter(o => 
          o.takım === takim.isim || o.takim === takim.isim
        );
        return {
          ...takim,
          oyuncular: takimOyuncular
        };
      });
      
      setTakimlar(takimlarOyuncularla);
    } catch (error) {
      console.error('Takım verileri yüklenemedi:', error);
      setTakimlar([]);
    }
  }, []);

  // Filtreleme
  const filtrelenmisTakimlar = takimlar.filter(takim => {
    const aramaMatch = !arama || takim.isim.toLowerCase().includes(arama.toLowerCase());
    const ligMatch = !filtreLig || takim.lig === filtreLig;
    return aramaMatch && ligMatch;
  });

  // Benzersiz ligler
  const ligler = [...new Set(takimlar.map(t => t.lig).filter(Boolean))].sort();

  if (seciliTakim) {
    return <TakimSayfasi takim={seciliTakim} onGeri={() => setSeciliTakim(null)} />;
  }

  return (
    <div className="takimlar-listesi">
      <div className="takimlar-header">
        <h1>🏆 Takımlar</h1>
        <p>Toplam {takimlar.length} takım</p>
      </div>

      <div className="takimlar-filtreler">
        <input
          type="text"
          placeholder="Takım ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="arama-input"
        />
        <select
          value={filtreLig}
          onChange={(e) => setFiltreLig(e.target.value)}
          className="lig-select"
        >
          <option value="">Tüm Ligler</option>
          {ligler.map(lig => (
            <option key={lig} value={lig}>{lig}</option>
          ))}
        </select>
      </div>

      <div className="takimlar-grid">
        {filtrelenmisTakimlar.map(takim => (
          <div
            key={takim.isim}
            className="takim-kart"
            onClick={() => setSeciliTakim(takim)}
          >
            <div className="takim-kart-logo">
              <img 
                src={takim.logo || 'https://via.placeholder.com/100'} 
                alt={takim.isim}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(takim.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
                }}
              />
              {(takim.yildizSayisi > 0 || takim.yildizlar > 0) && (
                <div className="takim-kart-yildizlar">
                  {'⭐'.repeat(Math.min(takim.yildizSayisi || Math.floor((takim.yildizlar || 0) / 20), 5))}
                </div>
              )}
            </div>
            <div className="takim-kart-bilgi">
              <h3>{takim.isim}</h3>
              <p className="takim-kart-lig">{takim.lig}</p>
              <p className="takim-kart-oyuncu">{takim.oyuncuSayisi || takim.oyuncular?.length || 0} oyuncu</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TakimlarListesi;
