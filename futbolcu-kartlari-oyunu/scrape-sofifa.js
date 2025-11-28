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
        'Referer': 'https://sofifa.com/'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      // Status code kontrolü
      if (res.statusCode === 403 || res.statusCode === 429) {
        reject(new Error(`HTTP ${res.statusCode}: Rate limit veya erişim engellendi.`));
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

// Lig sayfasından lig linklerini çek
async function fetchLeagueLinks() {
  try {
    await delay(3000 + Math.random() * 2000);
    const html = await fetchUrl('https://sofifa.com/leagues');
    const $ = cheerio.load(html);
    
    const leagueLinks = [];
    
    // Hedef ligler ve URL'leri (direkt URL kullanarak)
    const targetLeagues = [
      { name: 'Türkiye Süper Lig', url: '/league/13/turkiye-super-lig' },
      { name: 'Premier League', url: '/league/13/premier-league' },
      { name: 'La Liga', url: '/league/53/spanish-primera-division' },
      { name: 'Serie A', url: '/league/31/italian-serie-a' },
      { name: 'Bundesliga', url: '/league/19/german-bundesliga' },
      { name: 'Ligue 1', url: '/league/16/french-ligue-1' }
    ];
    
    // Alternatif: Sayfadan linkleri bul
    $('table tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/league/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        const leagueName = linkElement.text().trim();
        
        // Hedef liglerden biriyse ekle
        const targetMatch = targetLeagues.find(t => 
          leagueName.includes(t.name) || t.name.includes(leagueName)
        );
        if (targetMatch && href) {
          if (!leagueLinks.find(l => l.href === href)) {
            leagueLinks.push({ href, name: leagueName });
          }
        }
      }
    });
    
    // Eğer sayfadan bulunamazsa direkt URL'leri kullan
    if (leagueLinks.length === 0) {
      targetLeagues.forEach(league => {
        leagueLinks.push({ href: league.url, name: league.name });
      });
    }
    
    return leagueLinks;
  } catch (error) {
    console.error(`Error fetching league links:`, error.message);
    // Hata durumunda direkt URL'leri kullan
    return [
      { name: 'Türkiye Süper Lig', href: '/league/13/turkiye-super-lig' },
      { name: 'Premier League', href: '/league/13/premier-league' },
      { name: 'La Liga', href: '/league/53/spanish-primera-division' },
      { name: 'Serie A', href: '/league/31/italian-serie-a' },
      { name: 'Bundesliga', href: '/league/19/german-bundesliga' },
      { name: 'Ligue 1', href: '/league/16/french-ligue-1' }
    ];
  }
}

// Lig sayfasından takım linklerini çek
async function fetchTeamLinksFromLeague(leagueUrl) {
  try {
    await delay(3000 + Math.random() * 2000);
    const fullUrl = leagueUrl.startsWith('http') ? leagueUrl : `https://sofifa.com${leagueUrl}`;
    const html = await fetchUrl(fullUrl);
    const $ = cheerio.load(html);
    
    const teamLinks = [];
    
    // Takım linklerini bul - farklı selector'lar dene
    $('table tbody tr').each((i, row) => {
      const linkElement = $(row).find('td a[href*="/team/"]').first();
      if (linkElement.length) {
        const href = linkElement.attr('href');
        if (href && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      }
    });
    
    // Alternatif: tüm /team/ linklerini bul
    if (teamLinks.length === 0) {
      $('a[href*="/team/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/team/') && !teamLinks.includes(href)) {
          teamLinks.push(href);
        }
      });
    }
    
    return [...new Set(teamLinks)];
  } catch (error) {
    console.error(`Error fetching team links from ${leagueUrl}:`, error.message);
    return [];
  }
}

// Takım sayfasından oyuncu linklerini ve bilgilerini çek
async function fetchPlayersFromTeam(teamUrl) {
  try {
    await delay(3000 + Math.random() * 2000);
    const fullUrl = teamUrl.startsWith('http') ? teamUrl : `https://sofifa.com${teamUrl}`;
    const html = await fetchUrl(fullUrl);
    const $ = cheerio.load(html);
    
    const players = [];
    
    // Takım bilgilerini çek
    const teamName = $('h1').first().text().trim();
    const teamLogo = $('.team-logo img, .logo img').first().attr('src') || '';
    
    // Kadro tablosundan oyuncuları çek
    $('tbody tr').each((i, row) => {
      const playerLink = $(row).find('td a[href*="/player/"]').first();
      if (playerLink.length) {
        const href = playerLink.attr('href');
        const playerName = playerLink.text().trim();
        
        // Oyuncu görseli
        const playerImg = $(row).find('figure img').first().attr('src') || 
                         $(row).find('img[data-src]').first().attr('data-src') || '';
        
        // Yaş
        const age = parseInt($(row).find('td[data-col="ae"]').text().trim()) || null;
        
        // Genel değerlendirme (OA)
        const overall = parseInt($(row).find('td[data-col="oa"] em').text().trim()) || 
                       parseInt($(row).find('td[data-col="oa"]').text().trim()) || null;
        
        // Potansiyel (PT)
        const potential = parseInt($(row).find('td[data-col="pt"] em').text().trim()) || 
                         parseInt($(row).find('td[data-col="pt"]').text().trim()) || null;
        
        // Pozisyon
        const position = $(row).find('.pos').first().text().trim() || '';
        
        // Uyruk (bayrak)
        const nationality = $(row).find('.flag').first().attr('title') || '';
        
        // Piyasa değeri
        const value = $(row).find('td[data-col="vl"]').text().trim() || '';
        
        // Maaş
        const wage = $(row).find('td[data-col="wg"]').text().trim() || '';
        
        // Sözleşme
        const contract = $(row).find('.sub').text().trim() || '';
        
        if (playerName && href) {
          players.push({
            href,
            isim: playerName,
            tamIsim: playerName,
            resim: playerImg.startsWith('http') ? playerImg : `https://cdn.sofifa.net${playerImg}`,
            yas: age,
            guc: overall || potential || 50,
            mevki: position,
            basMevki: position,
            uyruk: nationality,
            piyasaDegeri: value,
            maas: wage,
            sozlesme: contract,
            takım: teamName
          });
        }
      }
    });
    
    return {
      teamName,
      teamLogo: teamLogo.startsWith('http') ? teamLogo : `https://cdn.sofifa.net${teamLogo}`,
      players
    };
  } catch (error) {
    console.error(`Error fetching players from team ${teamUrl}:`, error.message);
    return null;
  }
}

// UEFA turnuvalarından takım linklerini çek
async function fetchTeamsFromUEFATournaments() {
  const teams = [];
  
  // UEFA Avrupa Ligi ve Champions League için özel sayfalar
  // Bu sayfaları manuel olarak ekleyebiliriz veya lig sayfasından çekebiliriz
  
  return teams;
}

// Ana fonksiyon
async function main() {
  console.log('🚀 Sofifa.com scraping başlıyor...\n');
  
  // Lig linklerini çek
  console.log('📋 Ligler taranıyor...');
  const leagueLinks = await fetchLeagueLinks();
  console.log(`✅ ${leagueLinks.length} lig bulundu\n`);
  
  const allPlayers = [];
  const allTeams = [];
  
  // Her lig için takımları çek
  for (let i = 0; i < leagueLinks.length; i++) {
    const league = leagueLinks[i];
    console.log(`[${i + 1}/${leagueLinks.length}] ${league.name} - Takımlar taranıyor...`);
    
    const leagueUrl = league.href.startsWith('http') ? league.href : `https://sofifa.com${league.href}`;
    const teamLinks = await fetchTeamLinksFromLeague(leagueUrl);
    console.log(`  📋 ${teamLinks.length} takım bulundu`);
    
    // Her takım için oyuncuları çek
    for (let j = 0; j < teamLinks.length; j++) {
      const teamLink = teamLinks[j];
      try {
        const teamData = await fetchPlayersFromTeam(teamLink);
        if (teamData && teamData.players.length > 0) {
          allTeams.push({
            isim: teamData.teamName,
            logo: teamData.teamLogo,
            lig: league.name,
            oyuncuSayisi: teamData.players.length
          });
          
          teamData.players.forEach(player => {
            player.id = allPlayers.length + 1;
            allPlayers.push(player);
          });
          
          console.log(`    ✅ ${teamData.teamName}: ${teamData.players.length} oyuncu (Toplam: ${allPlayers.length})`);
        }
      } catch (error) {
        console.error(`    ❌ Takım oyuncuları çekilemedi: ${error.message}`);
      }
    }
    
    console.log(`  ✅ ${league.name} tamamlandı: ${allPlayers.length} toplam oyuncu\n`);
  }
  
  // Verileri kaydet
  const playersPath = join(__dirname, 'src/data/sofifa-futbolcular.json');
  const teamsPath = join(__dirname, 'src/data/sofifa-takimlar.json');
  
  fs.writeFileSync(playersPath, JSON.stringify(allPlayers, null, 2), 'utf-8');
  fs.writeFileSync(teamsPath, JSON.stringify(allTeams, null, 2), 'utf-8');
  
  console.log(`\n✅ Toplam ${allPlayers.length} futbolcu verisi kaydedildi`);
  console.log(`   📁 Oyuncular: ${playersPath}`);
  console.log(`   📁 Takımlar: ${teamsPath}`);
  console.log(`   📊 ${allTeams.length} takım bulundu\n`);
}

main().catch(console.error);

