import React from 'react';
import { getAktifKullanici, getOyunlar } from '../utils/auth';
import './Profil.css';

const Profil = ({ onCikis, onOyunBaslat }) => {
  const kullanici = getAktifKullanici();
  const oyunlar = getOyunlar();
  const kullaniciOyunlari = oyunlar.filter(
    o => o.oyuncu1Id === kullanici.id || o.oyuncu2Id === kullanici.id
  ).slice(0, 10); // Son 10 oyun

  if (!kullanici) {
    return null;
  }

  const istatistikler = kullanici.istatistikler || {
    toplamOyun: 0,
    kazanan: 0,
    kaybeden: 0,
    berabere: 0,
    toplamPuan: 0,
    enYuksekPuan: 0
  };

  const kazanmaOrani = istatistikler.toplamOyun > 0
    ? ((istatistikler.kazanan / istatistikler.toplamOyun) * 100).toFixed(1)
    : 0;

  return (
    <div className="profil-container">
      <div className="profil-header">
        <h2 className="profil-baslik">👤 Profil</h2>
        <button className="cikis-butonu" onClick={onCikis}>
          Çıkış Yap
        </button>
      </div>

      <div className="profil-bilgileri">
        <div className="profil-kart">
          <h3>Kullanıcı Bilgileri</h3>
          <div className="profil-detay">
            <span className="profil-label">Kullanıcı Adı:</span>
            <span className="profil-deger">{kullanici.kullaniciAdi}</span>
          </div>
          <div className="profil-detay">
            <span className="profil-label">Üyelik Tarihi:</span>
            <span className="profil-deger">
              {new Date(kullanici.olusturmaTarihi).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>

        <div className="profil-kart">
          <h3>📊 İstatistikler</h3>
          <div className="istatistik-grid">
            <div className="istatistik-item">
              <div className="istatistik-label">Toplam Oyun</div>
              <div className="istatistik-deger">{istatistikler.toplamOyun}</div>
            </div>
            <div className="istatistik-item">
              <div className="istatistik-label">Kazanan</div>
              <div className="istatistik-deger kazanan">{istatistikler.kazanan}</div>
            </div>
            <div className="istatistik-item">
              <div className="istatistik-label">Kaybeden</div>
              <div className="istatistik-deger kaybeden">{istatistikler.kaybeden}</div>
            </div>
            <div className="istatistik-item">
              <div className="istatistik-label">Berabere</div>
              <div className="istatistik-deger">{istatistikler.berabere}</div>
            </div>
            <div className="istatistik-item">
              <div className="istatistik-label">Kazanma Oranı</div>
              <div className="istatistik-deger">{kazanmaOrani}%</div>
            </div>
            <div className="istatistik-item">
              <div className="istatistik-label">En Yüksek Puan</div>
              <div className="istatistik-deger altin">{istatistikler.enYuksekPuan}</div>
            </div>
          </div>
        </div>

        {kullaniciOyunlari.length > 0 && (
          <div className="profil-kart">
            <h3>🎮 Son Oyunlar</h3>
            <div className="oyun-listesi">
              {kullaniciOyunlari.map((oyun) => {
                const rakip = oyun.oyuncu1Id === kullanici.id 
                  ? oyun.oyuncu2Adi 
                  : oyun.oyuncu1Adi;
                const kullaniciPuan = oyun.oyuncu1Id === kullanici.id 
                  ? oyun.oyuncu1Puan 
                  : oyun.oyuncu2Puan;
                const rakipPuan = oyun.oyuncu1Id === kullanici.id 
                  ? oyun.oyuncu2Puan 
                  : oyun.oyuncu1Puan;
                const kazandi = kullaniciPuan > rakipPuan;
                const berabere = kullaniciPuan === rakipPuan;

                return (
                  <div key={oyun.id} className="oyun-kaydi">
                    <div className="oyun-rakip">vs {rakip}</div>
                    <div className="oyun-skor">
                      {kullaniciPuan} - {rakipPuan}
                    </div>
                    <div className={`oyun-sonuc ${kazandi ? 'kazandi' : berabere ? 'berabere' : 'kaybetti'}`}>
                      {kazandi ? '🏆 Kazandı' : berabere ? '⚖️ Berabere' : '❌ Kaybetti'}
                    </div>
                    <div className="oyun-tarih">
                      {new Date(oyun.tarih).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profil;

