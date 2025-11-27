import React, { useState, useEffect } from 'react';
import Giris from './components/Giris';
import Profil from './components/Profil';
import OyunIkiOyuncu from './components/OyunIkiOyuncu';
import OyunAI from './components/OyunAI';
import LiderlikTablosu from './components/LiderlikTablosu';
import FutbolcuGalerisi from './components/FutbolcuGalerisi';
import { getAktifKullanici, getKullanicilar, cikisYap } from './utils/auth';
import './App.css';

function App() {
  const [aktifKullanici, setAktifKullanici] = useState(null);
  const [sayfa, setSayfa] = useState('ana'); // 'ana', 'profil', 'liderlik', 'oyun', 'galeri'
  const [oyunModu, setOyunModu] = useState(null); // 'ai' veya 'ikiOyuncu'
  const [oyuncu1, setOyuncu1] = useState(null);
  const [oyuncu2, setOyuncu2] = useState(null);

  useEffect(() => {
    const kullanici = getAktifKullanici();
    if (kullanici) {
      setAktifKullanici(kullanici);
    }
  }, []);

  const handleGirisBasarili = (kullanici) => {
    setAktifKullanici(kullanici);
    setSayfa('ana');
  };

  const handleCikis = () => {
    cikisYap();
    setAktifKullanici(null);
    setSayfa('ana');
    setOyuncu1(null);
    setOyuncu2(null);
  };

  const handleOyunBaslatAI = () => {
    setOyunModu('ai');
    setSayfa('oyun');
  };

  const handleOyunBaslatIkiOyuncu = () => {
    const kullanicilar = getKullanicilar();
    if (kullanicilar.length < 2) {
      alert('Oyun oynamak için en az 2 kullanıcı olmalı!');
      return;
    }

    // İki farklı kullanıcı seç
    const digerKullanicilar = kullanicilar.filter(k => k.id !== aktifKullanici.id);
    if (digerKullanicilar.length === 0) {
      alert('Başka bir kullanıcı bulunamadı! Lütfen yeni bir kullanıcı oluşturun.');
      return;
    }

    setOyuncu1(aktifKullanici);
    setOyuncu2(digerKullanicilar[0]); // İlk bulunan kullanıcıyı seç
    setOyunModu('ikiOyuncu');
    setSayfa('oyun');
  };

  const handleOyunBitti = () => {
    setSayfa('ana');
    setOyunModu(null);
    setOyuncu1(null);
    setOyuncu2(null);
    // Kullanıcıyı güncelle
    const guncelKullanici = getAktifKullanici();
    if (guncelKullanici) {
      setAktifKullanici(guncelKullanici);
    }
  };

  if (!aktifKullanici) {
    return <Giris onGirisBasarili={handleGirisBasarili} />;
  }

  if (sayfa === 'oyun' && oyunModu === 'ai') {
    return (
      <OyunAI
        oyuncu={aktifKullanici}
        onOyunBitti={handleOyunBitti}
      />
    );
  }

  if (sayfa === 'oyun' && oyunModu === 'ikiOyuncu' && oyuncu1 && oyuncu2) {
    return (
      <OyunIkiOyuncu
        oyuncu1={oyuncu1}
        oyuncu2={oyuncu2}
        onOyunBitti={handleOyunBitti}
      />
    );
  }

  return (
    <div className="App">
      <nav className="ana-nav">
        <div className="nav-sol">
          <h1 className="nav-baslik">⚽ Futbolcu Kartları</h1>
          <span className="nav-kullanici">Hoş geldin, {aktifKullanici.kullaniciAdi}!</span>
        </div>
        <div className="nav-sag">
          <button
            className={`nav-buton ${sayfa === 'ana' ? 'aktif' : ''}`}
            onClick={() => setSayfa('ana')}
          >
            Ana Sayfa
          </button>
          <button
            className={`nav-buton ${sayfa === 'profil' ? 'aktif' : ''}`}
            onClick={() => setSayfa('profil')}
          >
            Profil
          </button>
          <button
            className={`nav-buton ${sayfa === 'liderlik' ? 'aktif' : ''}`}
            onClick={() => setSayfa('liderlik')}
          >
            Liderlik
          </button>
          <button
            className={`nav-buton ${sayfa === 'galeri' ? 'aktif' : ''}`}
            onClick={() => setSayfa('galeri')}
          >
            Futbolcular
          </button>
          <button className="nav-buton cikis" onClick={handleCikis}>
            Çıkış
          </button>
        </div>
      </nav>

      {sayfa === 'ana' && (
        <div className="ana-sayfa">
          <div className="ana-kart">
            <h2 className="ana-baslik">Oyun Modunu Seçin</h2>
            <p className="ana-aciklama">
              Bilgisayara karşı tek başınıza oynayabilir veya başka bir kullanıcı ile eşleşebilirsiniz.
              Her oyuncu sırayla kart seçecek ve güç değeri yüksek olan kazanacak!
            </p>
            <div className="oyun-modlari">
              <button className="oyun-mod-butonu ai-mod" onClick={handleOyunBaslatAI}>
                <div className="mod-ikon">🤖</div>
                <div className="mod-baslik">Bilgisayara Karşı</div>
                <div className="mod-aciklama">Tek başınıza oynayın</div>
              </button>
              <button className="oyun-mod-butonu iki-oyuncu-mod" onClick={handleOyunBaslatIkiOyuncu}>
                <div className="mod-ikon">👥</div>
                <div className="mod-baslik">İki Oyuncu</div>
                <div className="mod-aciklama">Başka bir kullanıcı ile</div>
              </button>
            </div>
          </div>

          <div className="ana-kart">
            <h2 className="ana-baslik">İstatistikleriniz</h2>
            <div className="hizli-istatistik">
              <div className="hizli-istatistik-item">
                <div className="hizli-label">Toplam Oyun</div>
                <div className="hizli-deger">
                  {aktifKullanici.istatistikler?.toplamOyun || 0}
                </div>
              </div>
              <div className="hizli-istatistik-item">
                <div className="hizli-label">Kazanan</div>
                <div className="hizli-deger kazanan">
                  {aktifKullanici.istatistikler?.kazanan || 0}
                </div>
              </div>
              <div className="hizli-istatistik-item">
                <div className="hizli-label">En Yüksek Puan</div>
                <div className="hizli-deger altin">
                  {aktifKullanici.istatistikler?.enYuksekPuan || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sayfa === 'profil' && <Profil onCikis={handleCikis} />}

      {sayfa === 'liderlik' && <LiderlikTablosu />}

      {sayfa === 'galeri' && <FutbolcuGalerisi />}
    </div>
  );
}

export default App;
