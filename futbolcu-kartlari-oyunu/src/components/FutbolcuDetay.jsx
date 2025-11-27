import React from 'react';
import './FutbolcuDetay.css';

const FutbolcuDetay = ({ futbolcu, onGeri, favoriler = [], onToggleFavori }) => {
  if (!futbolcu) return null;

  const isFavori = favoriler.includes(futbolcu.id);

  return (
    <div className="futbolcu-detay">
      <div className="detay-header-bar">
        <button className="geri-buton" onClick={onGeri}>← Geri</button>
        {onToggleFavori && (
          <button
            className={`favori-buton ${isFavori ? 'aktif' : ''}`}
            onClick={() => onToggleFavori(futbolcu.id)}
          >
            {isFavori ? '❤️ Favorilerden Çıkar' : '🤍 Favorilere Ekle'}
          </button>
        )}
      </div>
      
      <div className="detay-header">
        <div className="detay-resim-container">
          <img 
            src={futbolcu.resim} 
            alt={futbolcu.isim}
            className="detay-resim"
            onError={(e) => {
              const isim = futbolcu.isim.replace(/\s+/g, '+');
              e.target.src = `https://ui-avatars.com/api/?name=${isim}&size=400&background=1e3c72&color=fff&bold=true`;
            }}
          />
        </div>
        <div className="detay-baslik">
          <h1>{futbolcu.isim}</h1>
          {futbolcu.tamIsim && futbolcu.tamIsim.trim() !== '' && (
            <p className="tam-isim">{futbolcu.tamIsim}</p>
          )}
          <div className="detay-guc">
            <span className="guc-label">Güç:</span>
            <span className="guc-degeri-buyuk">{futbolcu.güç || futbolcu.guc || 50}</span>
          </div>
        </div>
      </div>

      <div className="detay-icerik">
        <div className="detay-sol">
          <h2>Kişisel Bilgiler</h2>
          <div className="bilgi-tablosu">
            {futbolcu.dogumTarihi && futbolcu.dogumTarihi.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Doğum Tarihi/Yaş:</span>
                <span className="bilgi-deger">{futbolcu.dogumTarihi}</span>
              </div>
            )}
            {futbolcu.dogumYeri && futbolcu.dogumYeri.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Doğum Yeri:</span>
                <span className="bilgi-deger">{futbolcu.dogumYeri}</span>
              </div>
            )}
            {futbolcu.boy && futbolcu.boy.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Boy:</span>
                <span className="bilgi-deger">{futbolcu.boy}</span>
              </div>
            )}
            {futbolcu.uyruk && futbolcu.uyruk.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Uyruk:</span>
                <span className="bilgi-deger">🌍 {futbolcu.uyruk}</span>
              </div>
            )}
            {futbolcu.ayak && futbolcu.ayak.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Ayak:</span>
                <span className="bilgi-deger">{futbolcu.ayak}</span>
              </div>
            )}
          </div>

          <h2>Futbol Bilgileri</h2>
          <div className="bilgi-tablosu">
            {futbolcu.basMevki && futbolcu.basMevki.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Baş Mevki:</span>
                <span className="bilgi-deger">{futbolcu.basMevki}</span>
              </div>
            )}
            {futbolcu.mevki && futbolcu.mevki.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Mevki:</span>
                <span className="bilgi-deger">{futbolcu.mevki}</span>
              </div>
            )}
            {futbolcu.yanMevkiler && futbolcu.yanMevkiler.length > 0 && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Yan Mevkiler:</span>
                <span className="bilgi-deger">{futbolcu.yanMevkiler.join(', ')}</span>
              </div>
            )}
            {futbolcu.takım && futbolcu.takım.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Güncel Kulüp:</span>
                <span className="bilgi-deger">{futbolcu.takım}</span>
              </div>
            )}
            {futbolcu.lig && futbolcu.lig.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Lig:</span>
                <span className="bilgi-deger">{futbolcu.lig}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detay-sag">
          <h2>Sözleşme Bilgileri</h2>
          <div className="bilgi-tablosu">
            {futbolcu.sozlesmeBaslangic && futbolcu.sozlesmeBaslangic.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Sözleşme Tarihi:</span>
                <span className="bilgi-deger">{futbolcu.sozlesmeBaslangic}</span>
              </div>
            )}
            {futbolcu.sozlesmeBitis && futbolcu.sozlesmeBitis.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Sözleşme Sonu:</span>
                <span className="bilgi-deger">{futbolcu.sozlesmeBitis}</span>
              </div>
            )}
            {futbolcu.sonSozlesmeUzatma && futbolcu.sonSozlesmeUzatma.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Son Sözleşme Uzatma:</span>
                <span className="bilgi-deger">{futbolcu.sonSozlesmeUzatma}</span>
              </div>
            )}
            {futbolcu.temsilci && futbolcu.temsilci.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Temsilci:</span>
                <span className="bilgi-deger">{futbolcu.temsilci}</span>
              </div>
            )}
          </div>

          <h2>Piyasa Değeri</h2>
          <div className="bilgi-tablosu">
            {futbolcu.piyasaDegeri && futbolcu.piyasaDegeri.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Güncel Piyasa Değeri:</span>
                <span className="bilgi-deger piyasa-degeri">{futbolcu.piyasaDegeri}</span>
              </div>
            )}
            {futbolcu.enYuksekPiyasaDegeri && futbolcu.enYuksekPiyasaDegeri.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">En Yüksek Piyasa Değeri:</span>
                <span className="bilgi-deger">{futbolcu.enYuksekPiyasaDegeri}</span>
                {futbolcu.enYuksekPiyasaDegeriTarihi && (
                  <span className="bilgi-tarih"> ({futbolcu.enYuksekPiyasaDegeriTarihi})</span>
                )}
              </div>
            )}
            {futbolcu.piyasaDegeriSonGuncelleme && futbolcu.piyasaDegeriSonGuncelleme.trim() !== '' && (
              <div className="bilgi-satir">
                <span className="bilgi-label">Son Güncelleme:</span>
                <span className="bilgi-deger">{futbolcu.piyasaDegeriSonGuncelleme}</span>
              </div>
            )}
          </div>

          {futbolcu.sosyalMedya && (futbolcu.sosyalMedya.twitter || futbolcu.sosyalMedya.instagram || futbolcu.sosyalMedya.tiktok) && (
            <>
              <h2>Sosyal Medya</h2>
              <div className="sosyal-medya-linkler">
                {futbolcu.sosyalMedya.twitter && (
                  <a 
                    href={futbolcu.sosyalMedya.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="sosyal-link twitter"
                  >
                    🐦 Twitter/X
                  </a>
                )}
                {futbolcu.sosyalMedya.instagram && (
                  <a 
                    href={futbolcu.sosyalMedya.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="sosyal-link instagram"
                  >
                    📷 Instagram
                  </a>
                )}
                {futbolcu.sosyalMedya.tiktok && (
                  <a 
                    href={futbolcu.sosyalMedya.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="sosyal-link tiktok"
                  >
                    🎵 TikTok
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FutbolcuDetay;

