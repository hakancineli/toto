import React, { useState } from 'react';
import { girisYap, kayitOl } from '../utils/auth';
import './Giris.css';

const Giris = ({ onGirisBasarili }) => {
  const [mod, setMod] = useState('giris'); // 'giris' veya 'kayit'
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleGiris = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    if (!kullaniciAdi || !sifre) {
      setHata('Lütfen tüm alanları doldurun!');
      setYukleniyor(false);
      return;
    }

    const sonuc = girisYap(kullaniciAdi, sifre);
    
    if (sonuc.basarili) {
      onGirisBasarili(sonuc.kullanici);
    } else {
      setHata(sonuc.mesaj);
    }
    
    setYukleniyor(false);
  };

  const handleKayit = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    if (!kullaniciAdi || !sifre) {
      setHata('Lütfen tüm alanları doldurun!');
      setYukleniyor(false);
      return;
    }

    if (sifre.length < 3) {
      setHata('Şifre en az 3 karakter olmalıdır!');
      setYukleniyor(false);
      return;
    }

    const sonuc = kayitOl(kullaniciAdi, sifre);
    
    if (sonuc.basarili) {
      onGirisBasarili(sonuc.kullanici);
    } else {
      setHata(sonuc.mesaj);
    }
    
    setYukleniyor(false);
  };

  return (
    <div className="giris-container">
      <div className="giris-kutusu">
        <h2 className="giris-baslik">
          {mod === 'giris' ? '⚽ Giriş Yap' : '📝 Kayıt Ol'}
        </h2>
        
        <div className="giris-sekmeler">
          <button
            className={`giris-sekme ${mod === 'giris' ? 'aktif' : ''}`}
            onClick={() => {
              setMod('giris');
              setHata('');
            }}
          >
            Giriş
          </button>
          <button
            className={`giris-sekme ${mod === 'kayit' ? 'aktif' : ''}`}
            onClick={() => {
              setMod('kayit');
              setHata('');
            }}
          >
            Kayıt
          </button>
        </div>

        <form onSubmit={mod === 'giris' ? handleGiris : handleKayit}>
          <div className="giris-alan">
            <label htmlFor="kullaniciAdi">Kullanıcı Adı</label>
            <input
              id="kullaniciAdi"
              type="text"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              disabled={yukleniyor}
            />
          </div>

          <div className="giris-alan">
            <label htmlFor="sifre">Şifre</label>
            <input
              id="sifre"
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="Şifrenizi girin"
              disabled={yukleniyor}
            />
          </div>

          {hata && <div className="giris-hata">{hata}</div>}

          <button
            type="submit"
            className="giris-butonu"
            disabled={yukleniyor}
          >
            {yukleniyor ? 'Yükleniyor...' : mod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Giris;

