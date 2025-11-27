import React from 'react';
import './FutbolcuKarti.css';

const FutbolcuKarti = ({ futbolcu, yuzuk = false, onClick, secilebilir = false }) => {
  if (!futbolcu) {
    return (
      <div className={`futbolcu-karti bos-kart ${secilebilir ? 'secilebilir' : ''}`}>
        <div className="kart-arka">?</div>
      </div>
    );
  }

  return (
    <div 
      className={`futbolcu-karti ${yuzuk ? 'yuzuk' : ''} ${secilebilir ? 'secilebilir' : ''}`}
      onClick={onClick}
    >
      <div className="kart-resim-container">
        <img 
          src={futbolcu.resim} 
          alt={futbolcu.isim}
          className="kart-resim"
          loading="lazy"
          onError={(e) => {
            // Görsel yüklenemezse futbolcu ismine göre avatar oluştur
            const isim = futbolcu.isim.replace(/\s+/g, '+');
            e.target.src = `https://ui-avatars.com/api/?name=${isim}&size=400&background=1e3c72&color=fff&bold=true&font-size=0.6&length=2`;
          }}
        />
      </div>
      <div className="kart-bilgi">
        <h3 className="kart-isim">{futbolcu.isim || 'Bilinmeyen'}</h3>
        <p className="kart-takim">{futbolcu.takım || futbolcu.takim || 'Takım bilgisi yok'}</p>
        <p className="kart-pozisyon">{futbolcu.pozisyon || futbolcu.mevki || futbolcu.basMevki || 'Bilinmeyen'}</p>
        {futbolcu.uyruk && (
          <p className="kart-uyruk">🌍 {futbolcu.uyruk}</p>
        )}
        <div className="kart-guc">
          <span className="guc-label">Güç:</span>
          <span className="guc-degeri">{futbolcu.güç || futbolcu.guc || 50}</span>
        </div>
      </div>
    </div>
  );
};

export default FutbolcuKarti;

