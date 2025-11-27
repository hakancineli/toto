import React from 'react';
import { getLiderlikTablosu } from '../utils/auth';
import './LiderlikTablosu.css';

const LiderlikTablosu = () => {
  const liderler = getLiderlikTablosu();

  if (liderler.length === 0) {
    return (
      <div className="liderlik-container">
        <h2 className="liderlik-baslik">🏆 Liderlik Tablosu</h2>
        <p className="liderlik-bos">Henüz oyun oynanmamış!</p>
      </div>
    );
  }

  return (
    <div className="liderlik-container">
      <h2 className="liderlik-baslik">🏆 Liderlik Tablosu</h2>
      <div className="liderlik-tablo">
        <div className="liderlik-baslik-satir">
          <div className="liderlik-sira">#</div>
          <div className="liderlik-kullanici">Kullanıcı</div>
          <div className="liderlik-istatistik">Oyun</div>
          <div className="liderlik-istatistik">Kazanan</div>
          <div className="liderlik-istatistik">Oran</div>
          <div className="liderlik-istatistik">En Yüksek</div>
        </div>
        {liderler.map((kullanici, index) => {
          const kazanmaOrani = kullanici.istatistikler.toplamOyun > 0
            ? ((kullanici.istatistikler.kazanan / kullanici.istatistikler.toplamOyun) * 100).toFixed(1)
            : 0;

          return (
            <div key={kullanici.id} className={`liderlik-satir ${index < 3 ? 'podyum' : ''}`}>
              <div className="liderlik-sira">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>
              <div className="liderlik-kullanici">{kullanici.kullaniciAdi}</div>
              <div className="liderlik-istatistik">{kullanici.istatistikler.toplamOyun}</div>
              <div className="liderlik-istatistik">{kullanici.istatistikler.kazanan}</div>
              <div className="liderlik-istatistik">{kazanmaOrani}%</div>
              <div className="liderlik-istatistik altin">{kullanici.istatistikler.enYuksekPuan}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiderlikTablosu;

