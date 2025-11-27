import React, { useState, useEffect } from 'react';
import FutbolcuKarti from './FutbolcuKarti';
import futbolcular from '../data/futbolcular.json';
import transfermarktFutbolcular from '../data/transfermarkt-futbolcular.json';
import './Oyun.css';

const OyunAI = ({ oyuncu, onOyunBitti }) => {
  const [oyuncuDestesi, setOyuncuDestesi] = useState([]);
  const [aiDestesi, setAiDestesi] = useState([]);
  const [oyuncuSecilenKart, setOyuncuSecilenKart] = useState(null);
  const [oyuncuKart, setOyuncuKart] = useState(null);
  const [aiKart, setAiKart] = useState(null);
  const [oyuncuPuan, setOyuncuPuan] = useState(0);
  const [aiPuan, setAiPuan] = useState(0);
  const [oyunDurumu, setOyunDurumu] = useState('hazirlik'); // hazirlik, kartSecimi, oynuyor, sonuc
  const [kazanan, setKazanan] = useState(null);
  const [sonucMesaji, setSonucMesaji] = useState('');
  const [aiDusunuyor, setAiDusunuyor] = useState(false);

  // Deste karıştırma fonksiyonu
  const karistir = (dizi) => {
    const yeniDizi = [...dizi];
    for (let i = yeniDizi.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [yeniDizi[i], yeniDizi[j]] = [yeniDizi[j], yeniDizi[i]];
    }
    return yeniDizi;
  };

  // AI kart seçimi - en yüksek güçlü kartı seçer
  const aiKartSec = () => {
    if (aiDestesi.length === 0) return null;
    
    // En yüksek güçlü kartı seç
    const enYuksekKart = aiDestesi.reduce((enIyi, kart) => {
      return kart.güç > enIyi.güç ? kart : enIyi;
    }, aiDestesi[0]);
    
    return enYuksekKart;
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
    
    setOyuncuDestesi(kullanilacakKartlar.slice(0, yari));
    setAiDestesi(kullanilacakKartlar.slice(yari));
    setOyuncuSecilenKart(null);
    setOyuncuKart(null);
    setAiKart(null);
    setOyuncuPuan(0);
    setAiPuan(0);
    setOyunDurumu('kartSecimi');
    setKazanan(null);
    setSonucMesaji('');
  };

  // Oyuncu kart seçti
  const oyuncuKartSec = (kart) => {
    setOyuncuSecilenKart(kart);
    setOyunDurumu('oynuyor');
    setAiDusunuyor(true);

    // AI kart seçiyor (1-2 saniye bekle)
    setTimeout(() => {
      const aiSecilenKart = aiKartSec();
      if (aiSecilenKart) {
        karsilastir(kart, aiSecilenKart);
      }
    }, 1500);
  };

  // Kartları karşılaştır
  const karsilastir = (oyuncuKarti, aiKarti) => {
    setOyuncuKart(oyuncuKarti);
    setAiKart(aiKarti);
    setAiDusunuyor(false);

    // Kartları destelerden çıkar
    setOyuncuDestesi(prev => prev.filter(k => k.id !== oyuncuKarti.id));
    setAiDestesi(prev => prev.filter(k => k.id !== aiKarti.id));

    // Karşılaştır ve puan ver
    setTimeout(() => {
      if (oyuncuKarti.güç > aiKarti.güç) {
        setOyuncuPuan(prev => prev + 1);
        setSonucMesaji(`${oyuncuKarti.isim} kazandı! (${oyuncuKarti.güç} > ${aiKarti.güç})`);
      } else if (aiKarti.güç > oyuncuKarti.güç) {
        setAiPuan(prev => prev + 1);
        setSonucMesaji(`${aiKarti.isim} kazandı! (${aiKarti.güç} > ${oyuncuKarti.güç})`);
      } else {
        setSonucMesaji('Berabere! Her iki oyuncu da 1 puan aldı.');
        setOyuncuPuan(prev => prev + 1);
        setAiPuan(prev => prev + 1);
      }

      // Oyun bitti mi kontrol et
      setTimeout(() => {
        setOyuncuDestesi(prev => {
          setAiDestesi(prevAi => {
            if (prev.length <= 0 || prevAi.length <= 0) {
              setTimeout(() => {
                oyunuBitir();
              }, 2000);
            } else {
              setOyunDurumu('kartSecimi');
              setSonucMesaji('');
            }
            return prevAi;
          });
          return prev;
        });
      }, 5000); // Sonuç gösterim süresi 5 saniye
    }, 1000);
  };

  // Oyunu bitir
  const oyunuBitir = () => {
    setOyunDurumu('sonuc');
    setOyuncuPuan(currentPuan1 => {
      setAiPuan(currentPuan2 => {
        let kazananAdi = 'Berabere';
        if (currentPuan1 > currentPuan2) {
          kazananAdi = oyuncu.kullaniciAdi;
        } else if (currentPuan2 > currentPuan1) {
          kazananAdi = 'Bilgisayar';
        }
        setKazanan(kazananAdi);
        
        if (onOyunBitti) {
          setTimeout(() => {
            onOyunBitti();
          }, 5000);
        }
        return currentPuan2;
      });
      return currentPuan1;
    });
  };

  // Oyun bitiş kontrolü
  useEffect(() => {
    if (oyunDurumu === 'oynuyor' && oyuncuDestesi.length === 0 && aiDestesi.length === 0 && oyuncuKart && aiKart) {
      setTimeout(() => {
        oyunuBitir();
      }, 2000);
    }
  }, [oyuncuDestesi.length, aiDestesi.length, oyunDurumu, oyuncuKart, aiKart]);

  return (
    <div className="oyun-container">
      <h1 className="oyun-baslik">⚽ Futbolcu Kartları Oyunu ⚽</h1>
      
      {oyunDurumu === 'hazirlik' && (
        <div className="baslangic-ekrani">
          <p className="aciklama">
            {oyuncu.kullaniciAdi} vs Bilgisayar
            <br />
            Kartınızı seçin, bilgisayar otomatik olarak kartını seçecek. Güç değeri yüksek olan kart kazanır!
          </p>
          <button className="basla-butonu" onClick={oyunuBaslat}>
            Oyunu Başlat
          </button>
        </div>
      )}

      {oyunDurumu === 'kartSecimi' && (
        <>
          <div className="puan-tablosu">
            <div className="puan-kutusu aktif-oyuncu">
              <h3>{oyuncu.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncuPuan}</div>
              <div className="deste-sayisi">Kalan: {oyuncuDestesi.length}</div>
            </div>
            <div className="puan-kutusu">
              <h3>🤖 Bilgisayar</h3>
              <div className="puan">Puan: {aiPuan}</div>
              <div className="deste-sayisi">Kalan: {aiDestesi.length}</div>
            </div>
          </div>

          <div className="kart-secim-alani">
            <h2 className="kart-secim-baslik">
              {oyuncu.kullaniciAdi} - Kart Seçiniz
            </h2>
            <div className="kart-listesi">
              {oyuncuDestesi.map((kart) => (
                <div key={kart.id} onClick={() => oyuncuKartSec(kart)}>
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
              <h3>{oyuncu.kullaniciAdi}</h3>
              <div className="puan">Puan: {oyuncuPuan}</div>
              <div className="deste-sayisi">Kalan: {oyuncuDestesi.length}</div>
            </div>
            <div className="puan-kutusu">
              <h3>🤖 Bilgisayar</h3>
              <div className="puan">Puan: {aiPuan}</div>
              <div className="deste-sayisi">Kalan: {aiDestesi.length}</div>
            </div>
          </div>

          <div className="oyun-alani">
            <div className="oyuncu-alani">
              <h3>{oyuncu.kullaniciAdi}</h3>
              <FutbolcuKarti futbolcu={oyuncuKart} />
            </div>

            <div className="orta-alan">
              <div className="vs-badge">VS</div>
              {aiDusunuyor && (
                <div className="ai-dusunuyor">🤖 Bilgisayar düşünüyor...</div>
              )}
              {sonucMesaji && !aiDusunuyor && (
                <div className="sonuc-mesaji">{sonucMesaji}</div>
              )}
            </div>

            <div className="oyuncu-alani">
              <h3>🤖 Bilgisayar</h3>
              <FutbolcuKarti futbolcu={aiKart} />
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
              <h3>{oyuncu.kullaniciAdi}</h3>
              <div className="final-puan-degeri">{oyuncuPuan}</div>
            </div>
            <div className="final-puan">
              <h3>🤖 Bilgisayar</h3>
              <div className="final-puan-degeri">{aiPuan}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OyunAI;

