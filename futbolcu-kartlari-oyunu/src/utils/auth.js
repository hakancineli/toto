// Kullanıcı yönetimi için utility fonksiyonları

export const kayitOl = (kullaniciAdi, sifre) => {
  const kullanicilar = getKullanicilar();
  
  if (kullanicilar.find(u => u.kullaniciAdi === kullaniciAdi)) {
    return { basarili: false, mesaj: 'Bu kullanıcı adı zaten kullanılıyor!' };
  }
  
  const yeniKullanici = {
    id: Date.now().toString(),
    kullaniciAdi,
    sifre, // Gerçek uygulamada hash'lenmeli
    olusturmaTarihi: new Date().toISOString(),
    istatistikler: {
      toplamOyun: 0,
      kazanan: 0,
      kaybeden: 0,
      berabere: 0,
      toplamPuan: 0,
      enYuksekPuan: 0
    }
  };
  
  kullanicilar.push(yeniKullanici);
  localStorage.setItem('futbolcuKartlari_kullanicilar', JSON.stringify(kullanicilar));
  
  return { basarili: true, kullanici: yeniKullanici };
};

export const girisYap = (kullaniciAdi, sifre) => {
  const kullanicilar = getKullanicilar();
  const kullanici = kullanicilar.find(
    u => u.kullaniciAdi === kullaniciAdi && u.sifre === sifre
  );
  
  if (kullanici) {
    localStorage.setItem('futbolcuKartlari_aktifKullanici', JSON.stringify(kullanici));
    return { basarili: true, kullanici };
  }
  
  return { basarili: false, mesaj: 'Kullanıcı adı veya şifre hatalı!' };
};

export const cikisYap = () => {
  localStorage.removeItem('futbolcuKartlari_aktifKullanici');
};

export const getAktifKullanici = () => {
  const aktifKullanici = localStorage.getItem('futbolcuKartlari_aktifKullanici');
  return aktifKullanici ? JSON.parse(aktifKullanici) : null;
};

export const getKullanicilar = () => {
  const kullanicilar = localStorage.getItem('futbolcuKartlari_kullanicilar');
  return kullanicilar ? JSON.parse(kullanicilar) : [];
};

export const kullaniciGuncelle = (kullanici) => {
  const kullanicilar = getKullanicilar();
  const index = kullanicilar.findIndex(u => u.id === kullanici.id);
  
  if (index !== -1) {
    kullanicilar[index] = kullanici;
    localStorage.setItem('futbolcuKartlari_kullanicilar', JSON.stringify(kullanicilar));
    localStorage.setItem('futbolcuKartlari_aktifKullanici', JSON.stringify(kullanici));
    return true;
  }
  
  return false;
};

export const skorKaydet = (oyuncu1Id, oyuncu2Id, oyuncu1Puan, oyuncu2Puan) => {
  const kullanicilar = getKullanicilar();
  const oyuncu1 = kullanicilar.find(u => u.id === oyuncu1Id);
  const oyuncu2 = kullanicilar.find(u => u.id === oyuncu2Id);
  
  if (!oyuncu1 || !oyuncu2) return;
  
  // Oyuncu 1 istatistikleri
  oyuncu1.istatistikler.toplamOyun++;
  oyuncu1.istatistikler.toplamPuan += oyuncu1Puan;
  if (oyuncu1Puan > oyuncu1.istatistikler.enYuksekPuan) {
    oyuncu1.istatistikler.enYuksekPuan = oyuncu1Puan;
  }
  if (oyuncu1Puan > oyuncu2Puan) {
    oyuncu1.istatistikler.kazanan++;
  } else if (oyuncu1Puan < oyuncu2Puan) {
    oyuncu1.istatistikler.kaybeden++;
  } else {
    oyuncu1.istatistikler.berabere++;
  }
  
  // Oyuncu 2 istatistikleri
  oyuncu2.istatistikler.toplamOyun++;
  oyuncu2.istatistikler.toplamPuan += oyuncu2Puan;
  if (oyuncu2Puan > oyuncu2.istatistikler.enYuksekPuan) {
    oyuncu2.istatistikler.enYuksekPuan = oyuncu2Puan;
  }
  if (oyuncu2Puan > oyuncu1Puan) {
    oyuncu2.istatistikler.kazanan++;
  } else if (oyuncu2Puan < oyuncu1Puan) {
    oyuncu2.istatistikler.kaybeden++;
  } else {
    oyuncu2.istatistikler.berabere++;
  }
  
  // Oyun kaydı
  const oyunKaydi = {
    id: Date.now().toString(),
    oyuncu1Id,
    oyuncu2Id,
    oyuncu1Adi: oyuncu1.kullaniciAdi,
    oyuncu2Adi: oyuncu2.kullaniciAdi,
    oyuncu1Puan,
    oyuncu2Puan,
    tarih: new Date().toISOString()
  };
  
  const oyunlar = getOyunlar();
  oyunlar.push(oyunKaydi);
  localStorage.setItem('futbolcuKartlari_oyunlar', JSON.stringify(oyunlar));
  
  // Kullanıcıları güncelle
  kullaniciGuncelle(oyuncu1);
  kullaniciGuncelle(oyuncu2);
  
  return oyunKaydi;
};

export const getOyunlar = () => {
  const oyunlar = localStorage.getItem('futbolcuKartlari_oyunlar');
  return oyunlar ? JSON.parse(oyunlar) : [];
};

export const getLiderlikTablosu = () => {
  const kullanicilar = getKullanicilar();
  return kullanicilar
    .filter(u => u.istatistikler.toplamOyun > 0)
    .sort((a, b) => {
      // Kazanma oranına göre sırala
      const oranA = a.istatistikler.toplamOyun > 0 
        ? a.istatistikler.kazanan / a.istatistikler.toplamOyun 
        : 0;
      const oranB = b.istatistikler.toplamOyun > 0 
        ? b.istatistikler.kazanan / b.istatistikler.toplamOyun 
        : 0;
      return oranB - oranA;
    });
};

