import React, { useState, useEffect } from 'react';
import FutbolcuKarti from './FutbolcuKarti';
import futbolcular from '../data/futbolcular.json';
import './Oyun.css';

const Oyun = () => {
  const [oyuncu1Destesi, setOyuncu1Destesi] = useState([]);
  const [oyuncu2Destesi, setOyuncu2Destesi] = useState([]);
  const [oyuncu1Kart, setOyuncu1Kart] = useState(null);
  const [oyuncu2Kart, setOyuncu2Kart] = useState(null);
  const [oyuncu1Puan, setOyuncu1Puan] = useState(0);
  const [oyuncu2Puan, setOyuncu2Puan] = useState(0);
  const [oyunDurumu, setOyunDurumu] = useState('hazirlik'); // hazirlik, oynuyor, sonuc
  const [kazanan, setKazanan] = useState(null);
  const [sonucMesaji, setSonucMesaji] = useState('');

  // Deste karıştırma fonksiyonu
  const karistir = (dizi) => {
    const yeniDizi = [...dizi];
    for (let i = yeniDizi.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [yeniDizi[i], yeniDizi[j]] = [yeniDizi[j], yeniDizi[i]];
    }
    return yeniDizi;
  };

  // Oyunu başlat
  const oyunuBaslat = () => {
    const karisikKartlar = karistir([...futbolcular]);
    const yari = Math.ceil(karisikKartlar.length / 2);
    
    setOyuncu1Destesi(karisikKartlar.slice(0, yari));
    setOyuncu2Destesi(karisikKartlar.slice(yari));
    setOyuncu1Kart(null);
    setOyuncu2Kart(null);
    setOyuncu1Puan(0);
    setOyuncu2Puan(0);
    setOyunDurumu('oynuyor');
    setKazanan(null);
    setSonucMesaji('');
  };

  // Kart koy
  const kartKoy = () => {
    if (oyuncu1Destesi.length === 0 || oyuncu2Destesi.length === 0) {
      oyunuBitir();
      return;
    }

    const yeniOyuncu1Kart = oyuncu1Destesi[0];
    const yeniOyuncu2Kart = oyuncu2Destesi[0];

    setOyuncu1Kart(yeniOyuncu1Kart);
    setOyuncu2Kart(yeniOyuncu2Kart);

    // Kartları destelerden çıkar
    setOyuncu1Destesi(oyuncu1Destesi.slice(1));
    setOyuncu2Destesi(oyuncu2Destesi.slice(1));

    // Karşılaştır ve puan ver
    setTimeout(() => {
      if (yeniOyuncu1Kart.güç > yeniOyuncu2Kart.güç) {
        setOyuncu1Puan(prev => prev + 1);
        setSonucMesaji(`${yeniOyuncu1Kart.isim} kazandı! (${yeniOyuncu1Kart.güç} > ${yeniOyuncu2Kart.güç})`);
      } else if (yeniOyuncu2Kart.güç > yeniOyuncu1Kart.güç) {
        setOyuncu2Puan(prev => prev + 1);
        setSonucMesaji(`${yeniOyuncu2Kart.isim} kazandı! (${yeniOyuncu2Kart.güç} > ${yeniOyuncu1Kart.güç})`);
      } else {
        setSonucMesaji('Berabere! Her iki oyuncu da 1 puan aldı.');
        setOyuncu1Puan(prev => prev + 1);
        setOyuncu2Puan(prev => prev + 1);
      }
    }, 500);
  };

  // Oyunu bitir
  const oyunuBitir = () => {
    setOyunDurumu('sonuc');
    setOyuncu1Puan(currentPuan1 => {
      setOyuncu2Puan(currentPuan2 => {
        if (currentPuan1 > currentPuan2) {
          setKazanan('Oyuncu 1');
        } else if (currentPuan2 > currentPuan1) {
          setKazanan('Oyuncu 2');
        } else {
          setKazanan('Berabere');
        }
        return currentPuan2;
      });
      return currentPuan1;
    });
  };

  // Otomatik oyun bitiş kontrolü
  useEffect(() => {
    if (oyunDurumu === 'oynuyor' && oyuncu1Destesi.length === 0 && oyuncu2Destesi.length === 0 && oyuncu1Kart && oyuncu2Kart) {
      const timer = setTimeout(() => {
        setOyuncu1Puan(currentPuan1 => {
          setOyuncu2Puan(currentPuan2 => {
            setOyunDurumu('sonuc');
            if (currentPuan1 > currentPuan2) {
              setKazanan('Oyuncu 1');
            } else if (currentPuan2 > currentPuan1) {
              setKazanan('Oyuncu 2');
            } else {
              setKazanan('Berabere');
            }
            return currentPuan2;
          });
          return currentPuan1;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [oyuncu1Destesi.length, oyuncu2Destesi.length, oyunDurumu, oyuncu1Kart, oyuncu2Kart]);

  return (
    <div className="oyun-container">
      <h1 className="oyun-baslik">⚽ Futbolcu Kartları Oyunu ⚽</h1>
      
      {oyunDurumu === 'hazirlik' && (
        <div className="baslangic-ekrani">
          <p className="aciklama">
            Bu oyunda karşılıklı olarak kart koyacaksınız. Güç değeri yüksek olan kart kazanır!
          </p>
          <button className="basla-butonu" onClick={oyunuBaslat}>
            Oyunu Başlat
          </button>
        </div>
      )}

      {oyunDurumu === 'oynuyor' && (
        <>
          <div className="puan-tablosu">
            <div className="puan-kutusu">
              <h3>Oyuncu 1</h3>
              <div className="puan">Puan: {oyuncu1Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu1Destesi.length}</div>
            </div>
            <div className="puan-kutusu">
              <h3>Oyuncu 2</h3>
              <div className="puan">Puan: {oyuncu2Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu2Destesi.length}</div>
            </div>
          </div>

          <div className="oyun-alani">
            <div className="oyuncu-alani">
              <h3>Oyuncu 1</h3>
              <FutbolcuKarti futbolcu={oyuncu1Kart} />
            </div>

            <div className="orta-alan">
              <div className="vs-badge">VS</div>
              {sonucMesaji && (
                <div className="sonuc-mesaji">{sonucMesaji}</div>
              )}
            </div>

            <div className="oyuncu-alani">
              <h3>Oyuncu 2</h3>
              <FutbolcuKarti futbolcu={oyuncu2Kart} />
            </div>
          </div>

          <div className="oyun-kontrolleri">
            <button 
              className="kart-koy-butonu" 
              onClick={kartKoy}
              disabled={oyuncu1Destesi.length === 0 || oyuncu2Destesi.length === 0}
            >
              Kart Koy
            </button>
            <button className="yeniden-basla-butonu" onClick={oyunuBaslat}>
              Yeniden Başla
            </button>
          </div>
        </>
      )}

      {oyunDurumu === 'sonuc' && (
        <div className="sonuc-ekrani">
          <h2 className="kazanan-baslik">
            {kazanan === 'Berabere' ? '⚖️ Berabere!' : `🏆 ${kazanan} Kazandı!`}
          </h2>
          <div className="final-puanlar">
            <div className="final-puan">
              <h3>Oyuncu 1</h3>
              <div className="final-puan-degeri">{oyuncu1Puan}</div>
            </div>
            <div className="final-puan">
              <h3>Oyuncu 2</h3>
              <div className="final-puan-degeri">{oyuncu2Puan}</div>
            </div>
          </div>
          <button className="yeniden-basla-butonu" onClick={oyunuBaslat}>
            Yeni Oyun
          </button>
        </div>
      )}
    </div>
  );
};

export default Oyun;

