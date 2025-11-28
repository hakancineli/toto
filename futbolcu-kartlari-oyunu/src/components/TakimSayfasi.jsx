import React, { useState, useEffect } from 'react';
import './TakimSayfasi.css';

const TakimSayfasi = ({ takim, onGeri }) => {
  const [oyuncular, setOyuncular] = useState([]);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  useEffect(() => {
    // Takım oyuncularını yükle
    if (takim && takim.oyuncular) {
      setOyuncular(takim.oyuncular);
    }
  }, [takim]);

  if (!takim) {
    return <div className="takim-sayfasi">Takım bulunamadı</div>;
  }

  // Formasyon pozisyonları (4-3-3 örneği)
  const formasyon = {
    kaleci: { x: 50, y: 95 },
    defans: [
      { x: 20, y: 75, pos: 'SLB' },
      { x: 40, y: 75, pos: 'SLMB' },
      { x: 60, y: 75, pos: 'SĞMB' },
      { x: 80, y: 75, pos: 'SĞB' }
    ],
    ortaSaha: [
      { x: 30, y: 50, pos: 'SDO' },
      { x: 50, y: 50, pos: 'MOO' },
      { x: 70, y: 50, pos: 'SĞDO' }
    ],
    forvet: [
      { x: 30, y: 25, pos: 'SLO' },
      { x: 50, y: 25, pos: 'SNT' },
      { x: 70, y: 25, pos: 'SĞO' }
    ]
  };

  // Pozisyona göre oyuncu bul
  const getPlayerByPosition = (position) => {
    return oyuncular.find(p => 
      p.mevki === position || 
      p.basMevki === position ||
      p.pozisyon === position
    );
  };

  return (
    <div className="takim-sayfasi">
      {onGeri && (
        <button className="geri-buton" onClick={onGeri}>
          ← Takımlara Dön
        </button>
      )}
      <div className="takim-header">
        <div className="takim-logo-container">
          <img 
            src={takim.logo || 'https://via.placeholder.com/100'} 
            alt={takim.isim} 
            className="takim-logo"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(takim.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
            }}
          />
          {(takim.yildizSayisi > 0 || takim.yildizlar > 0) && (
            <div className="takim-yildizlar">
              {'⭐'.repeat(Math.min(takim.yildizSayisi || Math.floor((takim.yildizlar || 0) / 20), 5))}
            </div>
          )}
        </div>
        <div className="takim-bilgileri">
          <h1>{takim.isim}</h1>
          <p className="takim-lig">{takim.lig}</p>
          <p className="takim-oyuncu-sayisi">{oyuncular.length} oyuncu</p>
        </div>
      </div>

      <div className="futbol-sahasi">
        <img 
          src="/futbol-sahasi.jpg" 
          alt="Futbol Saha" 
          className="saha-gorseli"
        />

        {/* Kaleci */}
        {formasyon.kaleci && (() => {
          const player = getPlayerByPosition('KL') || oyuncular.find(p => p.mevki?.includes('KL') || p.pozisyon?.includes('KL'));
          if (player) {
            const rating = player.guc || player.güç || player.genelRating || 50;
            return (
              <div
                className="oyuncu-saha"
                style={{ left: `${formasyon.kaleci.x}%`, top: `${formasyon.kaleci.y}%` }}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <img 
                  src={player.resim || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`} 
                  alt={player.isim} 
                  className="oyuncu-resim-saha"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
                  }}
                />
                <div className="oyuncu-rating-saha">{rating}</div>
                {hoveredPlayer?.id === player.id && (
                  <div className="oyuncu-tooltip">
                    <strong>{player.isim}</strong>
                    <div>Güç: {rating}</div>
                    <div>Pozisyon: {player.mevki || player.basMevki || player.pozisyon || 'KL'}</div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Defans */}
        {formasyon.defans.map((pos, index) => {
          const player = getPlayerByPosition(pos.pos) || oyuncular[index + 1];
          if (player) {
            const rating = player.guc || player.güç || player.genelRating || 50;
            return (
              <div
                key={`defans-${index}`}
                className="oyuncu-saha"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <img 
                  src={player.resim || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`} 
                  alt={player.isim} 
                  className="oyuncu-resim-saha"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
                  }}
                />
                <div className="oyuncu-rating-saha">{rating}</div>
                {hoveredPlayer?.id === player.id && (
                  <div className="oyuncu-tooltip">
                    <strong>{player.isim}</strong>
                    <div>Güç: {rating}</div>
                    <div>Pozisyon: {player.mevki || player.basMevki || player.pozisyon || pos.pos}</div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

        {/* Orta Saha */}
        {formasyon.ortaSaha.map((pos, index) => {
          const player = getPlayerByPosition(pos.pos) || oyuncular[index + 5];
          if (player) {
            const rating = player.guc || player.güç || player.genelRating || 50;
            return (
              <div
                key={`orta-${index}`}
                className="oyuncu-saha"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <img 
                  src={player.resim || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`} 
                  alt={player.isim} 
                  className="oyuncu-resim-saha"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
                  }}
                />
                <div className="oyuncu-rating-saha">{rating}</div>
                {hoveredPlayer?.id === player.id && (
                  <div className="oyuncu-tooltip">
                    <strong>{player.isim}</strong>
                    <div>Güç: {rating}</div>
                    <div>Pozisyon: {player.mevki || player.basMevki || player.pozisyon || pos.pos}</div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

        {/* Forvet */}
        {formasyon.forvet.map((pos, index) => {
          const player = getPlayerByPosition(pos.pos) || oyuncular[index + 8];
          if (player) {
            const rating = player.guc || player.güç || player.genelRating || 50;
            return (
              <div
                key={`forvet-${index}`}
                className="oyuncu-saha"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <img 
                  src={player.resim || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`} 
                  alt={player.isim} 
                  className="oyuncu-resim-saha"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.isim)}&size=200&background=1e3c72&color=fff&bold=true`;
                  }}
                />
                <div className="oyuncu-rating-saha">{rating}</div>
                {hoveredPlayer?.id === player.id && (
                  <div className="oyuncu-tooltip">
                    <strong>{player.isim}</strong>
                    <div>Güç: {rating}</div>
                    <div>Pozisyon: {player.mevki || player.basMevki || player.pozisyon || pos.pos}</div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Tüm oyuncular listesi */}
      <div className="oyuncu-listesi">
        <h2>Kadro</h2>
        <div className="oyuncu-grid">
          {oyuncular.map(oyuncu => (
            <div key={oyuncu.id} className="oyuncu-kart">
              <img 
                src={oyuncu.resim || 'https://via.placeholder.com/100'} 
                alt={oyuncu.isim}
                onError={(e) => {
                  const isim = oyuncu.isim.replace(/\s+/g, '+');
                  e.target.src = `https://ui-avatars.com/api/?name=${isim}&size=200&background=1e3c72&color=fff&bold=true&font-size=0.6&length=2`;
                }}
              />
              <div className="oyuncu-bilgi">
                <h4>{oyuncu.isim}</h4>
                <p>{oyuncu.mevki || oyuncu.basMevki}</p>
                <p>Güç: {oyuncu.guc || oyuncu.güç || 50}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakimSayfasi;

