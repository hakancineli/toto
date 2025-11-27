import React, { useState, useEffect } from 'react';
import FutbolcuKarti from './FutbolcuKarti';
import futbolcular from '../data/futbolcular.json';
import transfermarktFutbolcular from '../data/transfermarkt-futbolcular.json';
import { skorKaydet } from '../utils/auth';
import './Oyun.css';

const OyunIkiOyuncu = ({ oyuncu1, oyuncu2, onOyunBitti }) => {
  const [oyuncu1Destesi, setOyuncu1Destesi] = useState([]);
  const [oyuncu2Destesi, setOyuncu2Destesi] = useState([]);
  const [oyuncu1SecilenKart, setOyuncu1SecilenKart] = useState(null);
  const [oyuncu2SecilenKart, setOyuncu2SecilenKart] = useState(null);
  const [oyuncu1Kart, setOyuncu1Kart] = useState(null);
  const [oyuncu2Kart, setOyuncu2Kart] = useState(null);
  const [oyuncu1Puan, setOyuncu1Puan] = useState(0);
  const [oyuncu2Puan, setOyuncu2Puan] = useState(0);
  const [oyunDurumu, setOyunDurumu] = useState('hazirlik'); // hazirlik, kartSecimi, oynuyor, sonuc
  const [aktifOyuncu, setAktifOyuncu] = useState(1); // 1 veya 2
  const [kazanan, setKazanan] = useState(null);
  const [sonucMesaji, setSonucMesaji] = useState('');
  const [turSayisi, setTurSayisi] = useState(0);

  // Deste karıştırma fonksiyonu
  const karistir = (dizi) => {
    const yeniDizi = [...dizi];
    for (let i = yeniDizi.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [yeniDizi[i], yeniDizi[j]] = [yeniDizi[j], yeniDizi[i]];
    }
    return yeniDizi;
  };

  // Transfermarkt verilerini oyun formatına dönüştür
  const transfermarktVerileriniDonustur = (tmData) => {
    if (!tmData || tmData.length === 0) return [];
    return tmData.map(player => {
      // Takım bilgisini bul - önce takım, sonra alternatif kaynaklar
      let takim = player.takım || player.takim || '';
      // Eğer takım boşsa veya "Takım bilgisi yok" ise, lig bilgisini kullan
      if ((!takim || takim.trim() === '' || takim === 'Takım bilgisi yok') && player.lig) {
        takim = player.lig;
      }
      if (!takim || takim.trim() === '') {
        takim = 'Takım bilgisi yok';
      }
      
      // Pozisyon bilgisini bul - önce basMevki, sonra mevki, sonra pozisyon
      let pozisyon = player.basMevki || player.mevki || player.pozisyon || '';
      // Eğer mevki "Defans - Sağ Bek" gibi bir format ise, sadece mevki kısmını al
      if (pozisyon && pozisyon.includes(' - ')) {
        pozisyon = pozisyon.split(' - ')[1] || pozisyon.split(' - ')[0];
      }
      if (!pozisyon || pozisyon.trim() === '') {
        // Yan mevkiler varsa ilkini kullan
        if (player.yanMevkiler && player.yanMevkiler.length > 0) {
          pozisyon = player.yanMevkiler[0];
        } else {
          pozisyon = 'Bilinmeyen';
        }
      }
      
      // İsim bilgisini bul
      const isim = player.isim || player.tamIsim || 'Bilinmeyen';
      
      return {
        id: player.id,
        isim: isim,
        takım: takim,
        pozisyon: pozisyon,
        güç: player.guc || player.güç || 50,
        resim: player.resim || `https://ui-avatars.com/api/?name=${encodeURIComponent(isim)}&size=400&background=1e3c72&color=fff&bold=true`
      };
    });
  };

  // Oyunu başlat
  const oyunuBaslat = () => {
    // Transfermarkt verilerini kullan, yoksa eski verileri kullan
    let kullanilacakKartlar = [];
    try {
      const tmKartlar = transfermarktVerileriniDonustur(transfermarktFutbolcular);
      if (tmKartlar.length > 0) {
        // 15 kart rastgele seç
        const karisik = karistir([...tmKartlar]);
        kullanilacakKartlar = karisik.slice(0, 15);
      } else {
        // Fallback: eski veriler
        kullanilacakKartlar = karistir([...futbolcular]).slice(0, 15);
      }
    } catch (error) {
      console.error('Transfermarkt verileri yüklenemedi:', error);
      kullanilacakKartlar = karistir([...futbolcular]).slice(0, 15);
    }
    
    const yari = Math.ceil(kullanilacakKartlar.length / 2);
    
    setOyuncu1Destesi(kullanilacakKartlar.slice(0, yari));
    setOyuncu2Destesi(kullanilacakKartlar.slice(yari));
    setOyuncu1SecilenKart(null);
    setOyuncu2SecilenKart(null);
    setOyuncu1Kart(null);
    setOyuncu2Kart(null);
    setOyuncu1Puan(0);
    setOyuncu2Puan(0);
    setOyunDurumu('kartSecimi');
    setAktifOyuncu(1);
    setKazanan(null);
    setSonucMesaji('');
    setTurSayisi(0);
  };

  // Kart seç
  const kartSec = (kart) => {
    if (aktifOyuncu === 1) {
      setOyuncu1SecilenKart(kart);
      setAktifOyuncu(2);
    } else {
      setOyuncu2SecilenKart(kart);
      // Her iki oyuncu da kart seçti, karşılaştır
      setTimeout(() => {
        karsilastir();
      }, 500);
    }
  };

  // Kartları karşılaştır
  const karsilastir = () => {
    if (!oyuncu1SecilenKart || !oyuncu2SecilenKart) return;

    setOyuncu1Kart(oyuncu1SecilenKart);
    setOyuncu2Kart(oyuncu2SecilenKart);
    setOyunDurumu('oynuyor');

    // Kartları destelerden çıkar
    setOyuncu1Destesi(prev => {
      const yeniDeste = prev.filter(k => k.id !== oyuncu1SecilenKart.id);
      return yeniDeste;
    });
    setOyuncu2Destesi(prev => {
      const yeniDeste = prev.filter(k => k.id !== oyuncu2SecilenKart.id);
      return yeniDeste;
    });

    // Karşılaştır ve puan ver
    setTimeout(() => {
      if (oyuncu1SecilenKart.güç > oyuncu2SecilenKart.güç) {
        setOyuncu1Puan(prev => prev + 1);
        setSonucMesaji(`${oyuncu1SecilenKart.isim} kazandı! (${oyuncu1SecilenKart.güç} > ${oyuncu2SecilenKart.güç})`);
      } else if (oyuncu2SecilenKart.güç > oyuncu1SecilenKart.güç) {
        setOyuncu2Puan(prev => prev + 1);
        setSonucMesaji(`${oyuncu2SecilenKart.isim} kazandı! (${oyuncu2SecilenKart.güç} > ${oyuncu1SecilenKart.güç})`);
      } else {
        setSonucMesaji('Berabere! Her iki oyuncu da 1 puan aldı.');
        setOyuncu1Puan(prev => prev + 1);
        setOyuncu2Puan(prev => prev + 1);
      }

      setTurSayisi(prev => prev + 1);
      
      // Oyun bitti mi kontrol et
      setTimeout(() => {
        setOyuncu1SecilenKart(null);
        setOyuncu2SecilenKart(null);
        setAktifOyuncu(1);
        
        setOyuncu1Destesi(prev => {
          if (prev.length <= 0) {
            setTimeout(() => oyunuBitir(), 1000);
            return prev;
          }
          setOyunDurumu('kartSecimi');
          return prev;
        });
        
        setOyuncu2Destesi(prev => {
          if (prev.length <= 0) {
            setTimeout(() => oyunuBitir(), 1000);
            return prev;
          }
          return prev;
        });
      }, 5000); // Sonuç gösterim süresi 5 saniye
    }, 1000);
  };

  // Oyunu bitir
  const oyunuBitir = () => {
    setOyunDurumu('sonuc');
    setOyuncu1Puan(currentPuan1 => {
      setOyuncu2Puan(currentPuan2 => {
        let kazananAdi = 'Berabere';
        if (currentPuan1 > currentPuan2) {
          kazananAdi = oyuncu1.kullaniciAdi;
        } else if (currentPuan2 > currentPuan1) {
          kazananAdi = oyuncu2.kullaniciAdi;
        }
        setKazanan(kazananAdi);
        
        // Skor kaydet
        if (oyuncu1 && oyuncu2) {
          skorKaydet(oyuncu1.id, oyuncu2.id, currentPuan1, currentPuan2);
        }
        
        if (onOyunBitti) {
          setTimeout(() => {
            onOyunBitti();
          }, 3000);
        }
        
        return currentPuan2;
      });
      return currentPuan1;
    });
  };

  return (
    <div className="oyun-container">
      <h1 className="oyun-baslik">⚽ Futbolcu Kartları Oyunu ⚽</h1>
      
      {oyunDurumu === 'hazirlik' && (
        <div className="baslangic-ekrani">
          <p className="aciklama">
            {oyuncu1.kullaniciAdi} vs {oyuncu2.kullaniciAdi}
            <br />
            Her oyuncu sırayla bir kart seçecek. Güç değeri yüksek olan kart kazanır!
          </p>
          <button className="basla-butonu" onClick={oyunuBaslat}>
            Oyunu Başlat
          </button>
        </div>
      )}

      {oyunDurumu === 'kartSecimi' && (
        <>
          <div className="puan-tablosu">
            <div className={`puan-kutusu ${aktifOyuncu === 1 ? 'aktif-oyuncu' : ''}`}>
              <h3>{oyuncu1.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncu1Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu1Destesi.length}</div>
            </div>
            <div className={`puan-kutusu ${aktifOyuncu === 2 ? 'aktif-oyuncu' : ''}`}>
              <h3>{oyuncu2.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncu2Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu2Destesi.length}</div>
            </div>
          </div>

          <div className="kart-secim-alani">
            <h2 className="kart-secim-baslik">
              {aktifOyuncu === 1 ? oyuncu1.kullaniciAdi : oyuncu2.kullaniciAdi} - Kart Seçiniz
            </h2>
            <div className="kart-listesi">
              {(aktifOyuncu === 1 ? oyuncu1Destesi : oyuncu2Destesi).map((kart) => (
                <div key={kart.id} onClick={() => kartSec(kart)}>
                  <FutbolcuKarti futbolcu={kart} secilebilir={true} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {oyunDurumu === 'oynuyor' && (
        <>
          <div className="puan-tablosu">
            <div className="puan-kutusu">
              <h3>{oyuncu1.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncu1Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu1Destesi.length}</div>
            </div>
            <div className="puan-kutusu">
              <h3>{oyuncu2.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncu2Puan}</div>
              <div className="deste-sayisi">Kalan: {oyuncu2Destesi.length}</div>
            </div>
          </div>

          <div className="oyun-alani">
            <div className="oyuncu-alani">
              <h3>{oyuncu1.kullaniciAdi}</h3>
              <FutbolcuKarti futbolcu={oyuncu1Kart} />
            </div>

            <div className="orta-alan">
              <div className="vs-badge">VS</div>
              {sonucMesaji && (
                <div className="sonuc-mesaji">{sonucMesaji}</div>
              )}
            </div>

            <div className="oyuncu-alani">
              <h3>{oyuncu2.kullaniciAdi}</h3>
              <FutbolcuKarti futbolcu={oyuncu2Kart} />
            </div>
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
              <h3>{oyuncu1.kullaniciAdi}</h3>
              <div className="final-puan-degeri">{oyuncu1Puan}</div>
            </div>
            <div className="final-puan">
              <h3>{oyuncu2.kullaniciAdi}</h3>
              <div className="final-puan-degeri">{oyuncu2Puan}</div>
            </div>
          </div>
          <p className="skor-kaydedildi">Skor kaydedildi! ✅</p>
        </div>
      )}
    </div>
  );
};

export default OyunIkiOyuncu;

