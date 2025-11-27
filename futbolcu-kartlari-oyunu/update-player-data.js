import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';

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
        'Referer': 'https://www.transfermarkt.com.tr/'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Futbolcu verisini güncelle
async function updatePlayerData(player) {
  if (!player.isim || player.isim === 'Bilinmeyen') return player;
  
  // Eğer takım ve mevki zaten varsa, güncelleme yapma
  if (player.takım && player.takım.trim() !== '' && 
      (player.mevki || player.basMevki) && 
      player.tamIsim && player.tamIsim.trim() !== '') {
    return player;
  }
  
  try {
    // Profil URL'ini oluştur (isimden)
    const isimSlug = player.isim.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Alternatif: resim URL'inden ID çıkar
    let playerId = null;
    if (player.resim) {
      const idMatch = player.resim.match(/\/(\d+)-/);
      if (idMatch) {
        playerId = idMatch[1];
      }
    }
    
    if (!playerId) {
      console.log(`⚠️  ${player.isim}: ID bulunamadı, atlanıyor`);
      return player;
    }
    
    const profileUrl = `https://www.transfermarkt.com.tr/spieler/profil/spieler/${playerId}`;
    
    await delay(1000 + Math.random() * 500);
    console.log(`🔄 Güncelleniyor: ${player.isim} (${player.id}/${316})`);
    
    const html = await fetchUrl(profileUrl);
    const $ = cheerio.load(html);
    
    // Takım bilgisini güncelle - daha kapsamlı arama
    if (!player.takım || player.takım.trim() === '') {
      const clubSelectors = [
        '.data-header__club-name a',
        '.data-header__club-name',
        'a[href*="/startseite/verein/"]',
        'a[href*="/verein/"]',
        '[itemprop="affiliation"]',
        '.info-table__content a[href*="verein"]'
      ];
      
      for (const selector of clubSelectors) {
        const clubElement = $(selector).first();
        if (clubElement.length) {
          const clubText = clubElement.text().trim();
          if (clubText && clubText !== '' && clubText.length > 1) {
            player.takım = clubText;
            break;
          }
        }
      }
      
      // Tablo içinden de dene
      if (!player.takım || player.takım.trim() === '') {
        $('table').each((i, table) => {
          const rows = $(table).find('tr');
          rows.each((j, row) => {
            const label = $(row).find('td').first().text().trim().toLowerCase();
            if (label.includes('güncel kulüp') || label.includes('kulüp') || label.includes('current club')) {
              const valueCell = $(row).find('td').last();
              const clubLink = valueCell.find('a').first();
              if (clubLink.length) {
                const clubText = clubLink.text().trim();
                if (clubText && clubText !== '' && clubText.length > 1) {
                  player.takım = clubText;
                  return false;
                }
              }
            }
          });
        });
      }
    }
    
    // Lig bilgisini güncelle - daha kapsamlı arama
    if (!player.lig || player.lig.trim() === '') {
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
            player.lig = ligText;
            break;
          }
        }
      }
    }
    
    // Mevki bilgisini güncelle
    if (!player.basMevki || player.basMevki.trim() === '') {
      const basMevkiElement = $('.detail-position__position').first();
      if (basMevkiElement.length) {
        player.basMevki = basMevkiElement.text().trim();
      }
    }
    
    if (!player.mevki || player.mevki.trim() === '') {
      if (player.basMevki) {
        player.mevki = player.basMevki;
      }
    }
    
    // Tam isim güncelle
    if (!player.tamIsim || player.tamIsim.trim() === '') {
      $('table').each((i, table) => {
        const rows = $(table).find('tr');
        rows.each((j, row) => {
          const label = $(row).find('td').first().text().trim().toLowerCase();
          if (label.includes('anavatandaki') || label.includes('tam isim')) {
            const value = $(row).find('td').last().text().trim();
            if (value && value !== '') {
              player.tamIsim = value;
              return false;
            }
          }
        });
      });
    }
    
    // Takım yoksa lig'i kullan
    if ((!player.takım || player.takım.trim() === '') && player.lig && player.lig.trim() !== '') {
      player.takım = player.lig;
    }
    
    console.log(`  ✅ ${player.isim}: Takım=${player.takım || 'YOK'}, Mevki=${player.basMevki || player.mevki || 'YOK'}`);
    
  } catch (error) {
    console.error(`  ❌ ${player.isim} güncellenirken hata:`, error.message);
  }
  
  return player;
}

async function main() {
  console.log('🔄 Futbolcu verileri güncelleniyor...\n');
  
  const dataPath = join(__dirname, 'src/data/transfermarkt-futbolcular.json');
  const players = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log(`📊 ${players.length} futbolcu verisi yüklendi\n`);
  
  let updated = 0;
  for (let i = 0; i < players.length; i++) {
    const updatedPlayer = await updatePlayerData(players[i]);
    players[i] = updatedPlayer;
    
    if (updatedPlayer.takım && updatedPlayer.takım.trim() !== '' && 
        (updatedPlayer.mevki || updatedPlayer.basMevki)) {
      updated++;
    }
    
    // Her 10 futbolcuda bir kaydet
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(dataPath, JSON.stringify(players, null, 2), 'utf-8');
      console.log(`💾 Ara kayıt yapıldı (${i + 1}/${players.length})\n`);
    }
  }
  
  // Final kayıt
  fs.writeFileSync(dataPath, JSON.stringify(players, null, 2), 'utf-8');
  
  console.log(`\n✅ Güncelleme tamamlandı!`);
  console.log(`   📈 ${updated}/${players.length} futbolcuda takım ve mevki bilgisi var`);
}

main().catch(console.error);

