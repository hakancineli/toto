// Görselleri indirmek için Node.js script
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const futbolcular = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src/data/futbolcular.json'), 'utf8')
);

const imagesDir = path.join(__dirname, 'public/images/futbolcular');

// Klasör yoksa oluştur
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirect takip et
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('Görseller indiriliyor...\n');
  
  for (const futbolcu of futbolcular) {
    const filename = `${futbolcu.id}-${futbolcu.isim.replace(/\s+/g, '-')}.jpg`;
    const filepath = path.join(imagesDir, filename);
    
    // Eğer dosya zaten varsa atla
    if (fs.existsSync(filepath)) {
      console.log(`✓ ${futbolcu.isim} - Zaten var`);
      continue;
    }
    
    try {
      console.log(`İndiriliyor: ${futbolcu.isim}...`);
      await downloadImage(futbolcu.resim, filepath);
      console.log(`✓ ${futbolcu.isim} - İndirildi\n`);
      
      // Rate limiting için kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`✗ ${futbolcu.isim} - Hata: ${error.message}\n`);
    }
  }
  
  console.log('\nİndirme işlemi tamamlandı!');
}

downloadAllImages();

