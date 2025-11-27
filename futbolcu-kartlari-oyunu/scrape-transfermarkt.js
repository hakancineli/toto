import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTTP isteği yapan fonksiyon
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.transfermarkt.com.tr/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      // Status code kontrolü
      if (res.statusCode === 403 || res.statusCode === 429) {
        reject(new Error(`HTTP ${res.statusCode}: Rate limit veya erişim engellendi. Daha fazla bekleme gerekebilir.`));
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // HTML içinde 403 hatası var mı kontrol et
        if (data.includes('403') && (data.includes('Forbidden') || data.includes('ERROR'))) {
          reject(new Error('403 Forbidden: Rate limit aşıldı'));
          return;
        }
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Rate limiting için bekleme fonksiyonu
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 403 hatası geldiğinde daha uzun bekleme
const delayOnError = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Futbolcu profil sayfasından detaylı bilgileri çek
async function fetchPlayerDetails(playerUrl) {
  try {
    await delay(2000 + Math.random() * 1000); // 2-3 saniye arası rastgele bekle (rate limit için)
    
    const fullUrl = playerUrl.startsWith('http') ? playerUrl : `https://www.transfermarkt.com.tr${playerUrl}`;
    
    const html = await fetchUrl(fullUrl);
    const $ = cheerio.load(html);
    
    // Futbolcu bilgilerini çek
    const playerData = {
      id: null,
      isim: '',
      tamIsim: '',
      dogumTarihi: '',
      yas: null,
      dogumYeri: '',
      boy: '',
      uyruk: '',
      mevki: '',
      basMevki: '',
      yanMevkiler: [],
      ayak: '',
      temsilci: '',
      takım: '',
      lig: '',
      sozlesmeBaslangic: '',
      sozlesmeBitis: '',
      sonSozlesmeUzatma: '',
      piyasaDegeri: '',
      enYuksekPiyasaDegeri: '',
      enYuksekPiyasaDegeriTarihi: '',
      piyasaDegeriSonGuncelleme: '',
      resim: '',
      sosyalMedya: {
        twitter: '',
        instagram: '',
        tiktok: ''
      },
      guc: 50
    };
    
    // İsim - birden fazla yöntem dene
    let nameText = '';
    const nameElement = $('h1.data-header__headline-wrapper').first();
    if (nameElement.length) {
      nameText = nameElement.text().trim();
    } else {
      nameText = $('h1').first().text().trim();
    }
    nameText = nameText.replace(/^#\d+\s*/, '').replace(/\s+/g, ' ').trim();
    playerData.isim = nameText;
    
    // Görsel
    const imgElement = $('img.data-header__profile-image').first();
    if (imgElement.length) {
      playerData.resim = imgElement.attr('src') || imgElement.attr('data-src') || '';
      if (playerData.resim && !playerData.resim.startsWith('http')) {
        playerData.resim = 'https://www.transfermarkt.com.tr' + playerData.resim;
      }
    }
    
    // Detaylı mevki bilgisi
    const basMevkiElement = $('.detail-position__position').first();
    if (basMevkiElement.length) {
      playerData.basMevki = basMevkiElement.text().trim();
    }
    
    // Yan mevkiler
    $('.detail-position__position--secondary').each((i, el) => {
      const yanMevki = $(el).text().trim();
      if (yanMevki && !playerData.yanMevkiler.includes(yanMevki)) {
        playerData.yanMevkiler.push(yanMevki);
      }
    });
    
    // Piyasa değeri bilgileri
    const marketValueWrapper = $('.data-header__market-value-wrapper').first();
    if (marketValueWrapper.length) {
      const marketValueText = marketValueWrapper.text().trim();
      playerData.piyasaDegeri = marketValueText.split('Son güncelleme')[0].trim();
      
      // Son güncelleme tarihi
      const sonGuncellemeMatch = marketValueText.match(/Son güncelleme:\s*([^\n]+)/);
      if (sonGuncellemeMatch) {
        playerData.piyasaDegeriSonGuncelleme = sonGuncellemeMatch[1].trim();
      }
    }
    
    // En yüksek piyasa değeri
    $('table').each((i, table) => {
      const rows = $(table).find('tr');
      rows.each((j, row) => {
        const label = $(row).find('td').first().text().trim();
        if (label.includes('En yüksek piyasa değeri')) {
          const valueCell = $(row).find('td').last();
          const valueText = valueCell.text().trim();
          const parts = valueText.split(/\s+/);
          if (parts.length >= 2) {
            playerData.enYuksekPiyasaDegeri = parts[0] + ' ' + parts[1];
            if (parts.length >= 3) {
              playerData.enYuksekPiyasaDegeriTarihi = parts.slice(2).join(' ');
            }
          }
        }
      });
    });
    
    // Tablo verilerini çek - daha kapsamlı arama
    $('table').each((i, table) => {
      const rows = $(table).find('tr');
      rows.each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const label = $(cells[0]).text().trim();
          const lastCell = $(cells[cells.length - 1]);
          let value = lastCell.text().trim();
          
          // Label'ı normalize et (boşlukları temizle, küçük harfe çevir)
          const normalizedLabel = label.toLowerCase().replace(/\s+/g, ' ');
          
          if (normalizedLabel.includes('anavatandaki') || normalizedLabel.includes('tam isim') || normalizedLabel.includes('full name')) {
            playerData.tamIsim = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('doğum tarihi') || normalizedLabel.includes('doğum tarihi/yaş') || normalizedLabel.includes('date of birth')) {
            playerData.dogumTarihi = value.replace(/\s+/g, ' ').trim();
            const ageMatch = value.match(/\((\d+)\)/);
            if (ageMatch) {
              playerData.yas = parseInt(ageMatch[1]);
            }
          } else if (normalizedLabel.includes('doğum yeri') || normalizedLabel.includes('place of birth')) {
            playerData.dogumYeri = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('boy') || normalizedLabel.includes('height')) {
            playerData.boy = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('uyruk') || normalizedLabel.includes('nationality') || normalizedLabel.includes('citizenship')) {
            playerData.uyruk = value.split('\n')[0].trim().split(' ')[0]; // İlk kelimeyi al
          } else if (normalizedLabel.includes('mevki') || normalizedLabel.includes('position')) {
            // Mevki formatı: "Defans - Sağ Bek" gibi olabilir
            const mevkiParts = value.split('-');
            if (mevkiParts.length > 1) {
              playerData.mevki = mevkiParts[0].trim() + ' - ' + mevkiParts[1].trim();
              playerData.basMevki = mevkiParts[1].trim(); // Sadece mevki kısmı
            } else {
              playerData.mevki = value.trim();
              if (!playerData.basMevki) {
                playerData.basMevki = value.trim();
              }
            }
          } else if (normalizedLabel.includes('ayak') || normalizedLabel.includes('foot')) {
            playerData.ayak = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('temsilci') || normalizedLabel.includes('agent')) {
            playerData.temsilci = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('güncel kulüp') || normalizedLabel.includes('kulüp') || normalizedLabel.includes('current club') || normalizedLabel.includes('club')) {
            // Önce link içindeki metni dene
            const clubLink = lastCell.find('a').first();
            if (clubLink.length) {
              const clubText = clubLink.text().trim();
              if (clubText && clubText !== '' && clubText.length > 1) {
                playerData.takım = clubText;
              }
            }
            // Eğer hala takım yoksa, value'dan al
            if (!playerData.takım || playerData.takım.trim() === '') {
              const cleanValue = value.replace(/\s+/g, ' ').trim();
              // Çok kısa veya anlamsız değerleri atla
              if (cleanValue && cleanValue.length > 1 && !cleanValue.includes('Takım bilgisi') && !cleanValue.includes('No team')) {
                playerData.takım = cleanValue;
              }
            }
          } else if (normalizedLabel.includes('sözleşme tarihi') || normalizedLabel.includes('contract start')) {
            playerData.sozlesmeBaslangic = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('sözleşme sonu') || normalizedLabel.includes('contract end') || normalizedLabel.includes('contract expires')) {
            playerData.sozlesmeBitis = value.replace(/\s+/g, ' ').trim();
          } else if (normalizedLabel.includes('son sözleşme uzatma') || normalizedLabel.includes('last contract extension')) {
            playerData.sonSozlesmeUzatma = value.replace(/\s+/g, ' ').trim();
          }
        }
      });
    });
    
    // Takım bilgisini alternatif yollardan çek - daha kapsamlı arama
    if (!playerData.takım || playerData.takım.trim() === '') {
      // Önce data-header'dan çek
      const clubElement = $('.data-header__club-name a, .data-header__club-name').first();
      if (clubElement.length) {
        const clubText = clubElement.text().trim();
        if (clubText && clubText !== '' && clubText.length > 1) {
          playerData.takım = clubText;
        }
      }
      
      // Hala yoksa, başka yerlerden dene
      if (!playerData.takım || playerData.takım.trim() === '') {
        // Farklı selector'lar dene
        const altSelectors = [
          'a[href*="/startseite/verein/"]',
          'a[href*="/verein/"]',
          '.data-header__club-name',
          '[itemprop="affiliation"]',
          '.info-table__content a[href*="verein"]'
        ];
        
        for (const selector of altSelectors) {
          const altClubElement = $(selector).first();
          if (altClubElement.length) {
            const altClubText = altClubElement.text().trim();
            if (altClubText && altClubText !== '' && altClubText.length > 1) {
              playerData.takım = altClubText;
              break;
            }
          }
        }
      }
    }
    
    // Lig bilgisi - daha kapsamlı arama
    if (!playerData.lig || playerData.lig.trim() === '') {
      const ligSelectors = [
        '.data-header__club-name + span',
        '.data-header__club-name ~ span',
        '.data-header__club-name + div',
        '[itemprop="league"]'
      ];
      
      for (const selector of ligSelectors) {
        const ligElement = $(selector).first();
        if (ligElement.length) {
          const ligText = ligElement.text().trim();
          if (ligText && ligText !== '' && ligText.length > 1) {
            playerData.lig = ligText;
            break;
          }
        }
      }
    }
    
    // Eğer takım hala yoksa ama lig varsa, lig'i takım olarak kullan
    if ((!playerData.takım || playerData.takım.trim() === '') && playerData.lig && playerData.lig.trim() !== '') {
      playerData.takım = playerData.lig;
    }
    
    // Mevki bilgisini iyileştir - eğer basMevki varsa ama mevki yoksa
    if ((!playerData.mevki || playerData.mevki.trim() === '') && playerData.basMevki && playerData.basMevki.trim() !== '') {
      playerData.mevki = playerData.basMevki;
    }
    
    // Piyasa değerine göre güç hesapla
    const valueText = playerData.piyasaDegeri.toLowerCase();
    if (valueText.includes('mil')) {
      const numMatch = valueText.match(/([\d,]+)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1].replace(',', '.'));
        playerData.guc = Math.min(95, Math.max(50, Math.round(50 + (value * 5))));
      }
    } else if (valueText.includes('bin')) {
      const numMatch = valueText.match(/([\d,]+)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1].replace(',', '.'));
        playerData.guc = Math.min(75, Math.max(50, Math.round(50 + (value / 100))));
      }
    }
    
    // Sosyal medya linklerini çek
    $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !playerData.sosyalMedya.twitter) {
        playerData.sosyalMedya.twitter = href;
      }
    });
    $('a[href*="instagram.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !playerData.sosyalMedya.instagram) {
        playerData.sosyalMedya.instagram = href;
      }
    });
    $('a[href*="tiktok.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !playerData.sosyalMedya.tiktok) {
        playerData.sosyalMedya.tiktok = href;
      }
    });
    
    return playerData;
  } catch (error) {
    console.error(`Error fetching player ${playerUrl}:`, error.message);
    return null;
  }
}

// Sayfadan futbolcu linklerini topla
async function fetchPlayerLinks(pageUrl) {
  try {
    await delay(500 + Math.random() * 500);
    const html = await fetchUrl(pageUrl);
    const $ = cheerio.load(html);
    
    const playerLinks = [];
    
    // Tablo içindeki futbolcu linklerini bul
    $('table.items tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/profil/spieler/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && !playerLinks.includes(href)) {
          playerLinks.push(href);
        }
      }
    });
    
    // Alternatif: sayfadaki tüm profil linklerini bul
    if (playerLinks.length === 0) {
      $('a[href*="/profil/spieler/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !playerLinks.includes(href)) {
          playerLinks.push(href);
        }
      });
    }
    
    return [...new Set(playerLinks)];
  } catch (error) {
    console.error(`Error fetching player links from ${pageUrl}:`, error.message);
    return [];
  }
}

// Takım listesini çek
async function fetchTeamLinks(leagueUrl) {
  try {
    await delay(500 + Math.random() * 500);
    const html = await fetchUrl(leagueUrl);
    const $ = cheerio.load(html);
    
    const teamLinks = [];
    
    // Takım linklerini bul - daha spesifik selector kullan
    $('table.items tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/startseite/verein/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      }
    });
    
    // Alternatif: direkt link arama
    if (teamLinks.length === 0) {
      $('a[href*="/startseite/verein/"]').each((i, el) => {
        const href = $(el).attr('href');
        // Sadece takım sayfası linklerini al (kadro, transfer gibi değil)
        if (href && href.includes('/startseite/verein/') && !href.includes('/kader/') && !href.includes('/transfers/')) {
          if (!teamLinks.includes(href)) {
            teamLinks.push(href);
          }
        }
      });
    }
    
    return [...new Set(teamLinks)];
  } catch (error) {
    console.error(`Error fetching team links from ${leagueUrl}:`, error.message);
    return [];
  }
}

// Takım kadrosundan oyuncu linklerini çek
async function fetchPlayerLinksFromSquad(teamUrl) {
  try {
    await delay(500 + Math.random() * 500);
    // Takım kadro sayfası URL'i - göreceli URL ise tam URL yap
    let squadUrl = teamUrl;
    if (squadUrl.includes('/startseite/')) {
      squadUrl = squadUrl.replace('/startseite/', '/kader/');
    } else if (!squadUrl.includes('/kader/')) {
      // Eğer zaten kader değilse ekle
      const vereinMatch = squadUrl.match(/\/verein\/(\d+)/);
      if (vereinMatch) {
        const teamId = vereinMatch[1];
        const teamName = squadUrl.split('/').filter(p => p && p !== 'startseite' && p !== 'verein' && p !== teamId)[0];
        if (teamName) {
          squadUrl = `/${teamName}/kader/verein/${teamId}`;
        }
      }
    }
    
    // Göreceli URL ise tam URL yap
    if (!squadUrl.startsWith('http')) {
      squadUrl = `https://www.transfermarkt.com.tr${squadUrl}`;
    }
    
    const html = await fetchUrl(squadUrl);
    const $ = cheerio.load(html);
    
    const playerLinks = [];
    
    // Kadro tablosundan oyuncu linklerini bul
    $('table.items tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/profil/spieler/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && !playerLinks.includes(href)) {
          playerLinks.push(href);
        }
      }
    });
    
    return [...new Set(playerLinks)];
  } catch (error) {
    console.error(`Error fetching player links from squad ${teamUrl}:`, error.message);
    return [];
  }
}

// Turnuva sayfasından takım linklerini çek (UEFA Avrupa Ligi gibi)
async function fetchTeamLinksFromTournament(tournamentUrl) {
  try {
    await delay(500 + Math.random() * 500);
    const html = await fetchUrl(tournamentUrl);
    const $ = cheerio.load(html);
    
    const teamLinks = [];
    
    // Takım linklerini bul - tablo içinden
    $('table.items tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/spielplan/verein/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && href.includes('/spielplan/verein/') && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      }
    });
    
    // Alternatif: direkt link arama
    if (teamLinks.length === 0) {
      $('a[href*="/spielplan/verein/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/spielplan/verein/') && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      });
    }
    
    // Alternatif 2: startseite linklerini de dene
    if (teamLinks.length === 0) {
      $('a[href*="/startseite/verein/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/startseite/verein/') && !href.includes('/transfers/') && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      });
    }
    
    return [...new Set(teamLinks)];
  } catch (error) {
    console.error(`Error fetching team links from tournament ${tournamentUrl}:`, error.message);
    return [];
  }
}

// Takım kadro sayfasından oyuncu linklerini çek
async function fetchPlayerLinksFromTeamSquad(teamUrl) {
  try {
    await delay(500 + Math.random() * 500);
    
    // Takım URL'ini kadro sayfasına çevir
    let squadUrl = teamUrl;
    
    // Eğer spielplan linki ise startseite'e çevir, sonra kadro sayfasına
    if (squadUrl.includes('/spielplan/verein/')) {
      squadUrl = squadUrl.replace('/spielplan/verein/', '/startseite/verein/');
    }
    
    // startseite linkini kadro sayfasına çevir
    if (squadUrl.includes('/startseite/verein/')) {
      // Sezon ID'yi koru veya ekle
      if (!squadUrl.includes('saison_id')) {
        squadUrl = squadUrl.replace(/\/startseite\/verein\/(\d+)/, `/startseite/verein/$1/saison_id/2025`);
      }
      // Kadro sayfasına çevir
      squadUrl = squadUrl.replace('/startseite/verein/', '/kader/verein/');
    } else if (!squadUrl.includes('/kader/')) {
      // Direkt takım adı ve ID'yi çıkar
      const vereinMatch = squadUrl.match(/\/verein\/(\d+)/);
      const teamNameMatch = squadUrl.match(/\/([^\/]+)\//);
      if (vereinMatch && teamNameMatch) {
        const teamId = vereinMatch[1];
        const teamName = teamNameMatch[1];
        squadUrl = `/${teamName}/kader/verein/${teamId}/saison_id/2025`;
      }
    }
    
    // Göreceli URL ise tam URL yap
    if (!squadUrl.startsWith('http')) {
      squadUrl = `https://www.transfermarkt.com.tr${squadUrl}`;
    }
    
    const html = await fetchUrl(squadUrl);
    const $ = cheerio.load(html);
    
    const playerLinks = [];
    
    // Kadro tablosundan oyuncu linklerini bul
    $('table.items tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/profil/spieler/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && !playerLinks.includes(href)) {
          playerLinks.push(href);
        }
      }
    });
    
    // Alternatif: sayfadaki tüm oyuncu linklerini bul
    if (playerLinks.length === 0) {
      $('a[href*="/profil/spieler/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !playerLinks.includes(href)) {
          playerLinks.push(href);
        }
      });
    }
    
    return [...new Set(playerLinks)];
  } catch (error) {
    console.error(`Error fetching player links from team squad ${teamUrl}:`, error.message);
    return [];
  }
}

// Taranacak sayfa URL'lerini döndür - TURNUVALAR VE LİGLER
function getPageUrls() {
  const pageUrls = [];
  
  // UEFA Avrupa Ligi
  pageUrls.push({
    type: 'tournament',
    url: 'https://www.transfermarkt.com.tr/europa-league/gesamtspielplan/pokalwettbewerb/EL',
    isim: 'UEFA Avrupa Ligi'
  });
  
  // UEFA Champions League
  pageUrls.push({
    type: 'tournament',
    url: 'https://www.transfermarkt.com.tr/champions-league/gesamtspielplan/pokalwettbewerb/CL',
    isim: 'UEFA Champions League'
  });
  
  // 1. ligler (piyasa değeri sayfalarından)
  const ligler = [
    { kod: 'GB1', isim: 'Premier League' },
    { kod: 'ES1', isim: 'La Liga' },
    { kod: 'IT1', isim: 'Serie A' },
    { kod: 'L1', isim: 'Bundesliga' },
    { kod: 'FR1', isim: 'Ligue 1' },
    { kod: 'TR1', isim: 'Süper Lig' },
    { kod: 'NL1', isim: 'Eredivisie' },
    { kod: 'PO1', isim: 'Primeira Liga' },
  ];
  
  // Her lig için piyasa değeri sayfası
  ligler.forEach(lig => {
    pageUrls.push({
      type: 'league',
      url: `https://www.transfermarkt.com.tr/wettbewerb/${lig.kod}/marktwerte/wettbewerb/${lig.kod}`,
      lig: lig
    });
  });
  
  return pageUrls;
}

// Farklı sayfalardan futbolcu linklerini topla - TURNUVALAR VE LİGLER
async function collectAllPlayerLinks() {
  const allLinks = new Set();
  
  // Tüm sayfaları al (turnuvalar ve ligler)
  const pages = getPageUrls();
  
  console.log(`📋 ${pages.length} kaynak taranacak...\n`);
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    try {
      if (page.type === 'tournament') {
        // Turnuva sayfasından takım linklerini çek
        console.log(`[${i + 1}/${pages.length}] ${page.isim} - Takımlar taranıyor...`);
        const teamLinks = await fetchTeamLinksFromTournament(page.url);
        console.log(`  📋 ${teamLinks.length} takım bulundu`);
        
        // Her takımın kadrosundan oyuncu linklerini çek
        for (let j = 0; j < teamLinks.length; j++) {
          const teamLink = teamLinks[j];
          try {
            const playerLinks = await fetchPlayerLinksFromTeamSquad(teamLink);
            playerLinks.forEach(link => allLinks.add(link));
            
            if (playerLinks.length > 0) {
              // Takım adını çıkar
              const teamName = teamLink.split('/').find(part => part && part !== 'spielplan' && part !== 'startseite' && part !== 'verein');
              console.log(`    ✅ Takım ${j + 1}/${teamLinks.length} (${teamName || 'Bilinmeyen'}): ${playerLinks.length} oyuncu (Toplam: ${allLinks.size})`);
            }
          } catch (error) {
            console.error(`    ❌ Takım oyuncuları çekilemedi: ${error.message}`);
          }
        }
        
        console.log(`  ✅ ${page.isim} tamamlandı: ${allLinks.size} toplam oyuncu\n`);
      } else if (page.type === 'league') {
        // Lig sayfasından direkt oyuncu linklerini çek (piyasa değeri sayfası)
        console.log(`[${i + 1}/${pages.length}] ${page.lig.isim} - Oyuncular taranıyor...`);
        
        // Her sayfayı tara (her lig için 20 sayfa)
        for (let pageNum = 1; pageNum <= 20; pageNum++) {
          const pageUrl = pageNum === 1 ? page.url : `${page.url}?page=${pageNum}`;
          try {
            const playerLinks = await fetchPlayerLinks(pageUrl);
            playerLinks.forEach(link => allLinks.add(link));
            if (playerLinks.length > 0) {
              console.log(`  📄 Sayfa ${pageNum}: ${playerLinks.length} oyuncu (Toplam: ${allLinks.size})`);
            }
          } catch (error) {
            // Sayfa bulunamazsa dur
            if (pageNum > 1) break;
          }
        }
        
        console.log(`  ✅ ${page.lig.isim} tamamlandı: ${allLinks.size} toplam oyuncu\n`);
      }
    } catch (error) {
      console.error(`  ❌ ${page.isim || page.lig?.isim || 'Kaynak'} taranırken hata: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Tarama tamamlandı: ${allLinks.size} benzersiz futbolcu linki toplandı\n`);
  return Array.from(allLinks);
}

// Ana fonksiyon
async function main() {
  console.log('🚀 Transfermarkt kapsamlı scraping başlıyor...\n');
  
  // Tüm futbolcu linklerini topla
  const allPlayerLinks = await collectAllPlayerLinks();
  console.log(`\n📊 Toplam ${allPlayerLinks.length} benzersiz futbolcu linki bulundu\n`);
  
  if (allPlayerLinks.length === 0) {
    console.log('❌ Futbolcu linki bulunamadı.');
    return;
  }
  
  // Mevcut verileri yükle (varsa)
  const existingDataPath = join(__dirname, 'src/data/transfermarkt-futbolcular.json');
  let existingPlayers = [];
  let existingIds = new Set();
  
  if (fs.existsSync(existingDataPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf-8'));
      existingPlayers = existingData;
      existingData.forEach(p => {
        if (p.isim) {
          existingIds.add(p.isim.toLowerCase());
        }
      });
      console.log(`📂 Mevcut ${existingPlayers.length} futbolcu verisi yüklendi\n`);
    } catch (error) {
      console.log('⚠️  Mevcut veri dosyası okunamadı, sıfırdan başlanıyor\n');
    }
  }
  
  // Her futbolcunun detaylarını çek
  const players = [...existingPlayers];
  let yeniEklenen = 0;
  let hataSayisi = 0;
  let atlanan = 0;
  
  for (let i = 0; i < allPlayerLinks.length; i++) {
    const link = allPlayerLinks[i];
    
    // Link'ten ID çıkar
    const linkParts = link.split('/');
    const spielerIndex = linkParts.findIndex(p => p === 'spieler');
    let playerId = null;
    if (spielerIndex !== -1 && linkParts[spielerIndex + 1]) {
      playerId = linkParts[spielerIndex + 1];
    }
    
    // Zaten var mı kontrol et (ID veya isim ile)
    let zatenVar = false;
    if (playerId) {
      zatenVar = existingPlayers.some(p => {
        if (p.resim && p.resim.includes(`/${playerId}-`)) return true;
        return false;
      });
    }
    
    if (zatenVar) {
      atlanan++;
      if (atlanan % 100 === 0) {
        console.log(`  ⏭️  ${atlanan} futbolcu atlandı (zaten mevcut)`);
      }
      continue;
    }
    
    try {
      const playerData = await fetchPlayerDetails(link);
      if (playerData && playerData.isim && !playerData.isim.includes('403') && !playerData.isim.includes('ERROR')) {
        playerData.id = players.length + 1;
        players.push(playerData);
        existingIds.add(playerData.isim.toLowerCase());
        yeniEklenen++;
        console.log(`[${i + 1}/${allPlayerLinks.length}] ✅ ${playerData.isim} - ${playerData.takım || playerData.lig || 'Takım yok'} (Yeni: ${yeniEklenen})`);
        
        // Her 25 futbolcuda bir kaydet (güvenlik için)
        if (yeniEklenen % 25 === 0) {
          const outputPath = join(__dirname, 'src/data/transfermarkt-futbolcular.json');
          fs.writeFileSync(outputPath, JSON.stringify(players, null, 2), 'utf-8');
          console.log(`  💾 Ara kayıt yapıldı (${players.length} futbolcu)\n`);
        }
      } else {
        hataSayisi++;
        if (hataSayisi % 50 === 0) {
          console.log(`  ⚠️  ${hataSayisi} hata oluştu\n`);
        }
      }
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('429') || error.message.includes('Rate limit')) {
        hataSayisi++;
        console.log(`[${i + 1}/${allPlayerLinks.length}] ⚠️  Rate limit - 30 saniye bekleniyor...`);
        await delayOnError(30000); // 30 saniye bekle
      } else {
        hataSayisi++;
        if (hataSayisi % 50 === 0) {
          console.log(`  ⚠️  ${hataSayisi} hata oluştu: ${error.message}\n`);
        }
      }
    }
  }
  
  // Final kayıt
  const outputPath = join(__dirname, 'src/data/transfermarkt-futbolcular.json');
  fs.writeFileSync(outputPath, JSON.stringify(players, null, 2), 'utf-8');
  
  console.log(`\n✅ Toplam ${players.length} futbolcu verisi kaydedildi`);
  console.log(`   📈 Yeni eklenen: ${yeniEklenen}`);
  console.log(`   ⏭️  Atlanan: ${atlanan || 0}`);
  console.log(`   ❌ Hatalar: ${hataSayisi || 0}`);
  console.log(`   📁 Dosya: ${outputPath}\n`);
  
  if (players.length > 0) {
    console.log('📋 Örnek veri:');
    console.log(JSON.stringify(players[0], null, 2));
  }
}

main().catch(console.error);
