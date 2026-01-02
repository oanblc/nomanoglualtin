const { MongoClient } = require('mongodb');

// Atlas (kaynak) ve Railway (hedef) bağlantıları
const ATLAS_URI = 'mongodb+srv://ozanbalcioglu_db_user:Oo3615520@cluster0.yeh3wmi.mongodb.net/fiyat';
const RAILWAY_URI = 'mongodb://mongo:FDaHhHFYvQKRWtdzWSeKnFKWrARXamHe@shuttle.proxy.rlwy.net:16685/nomanoglu?authSource=admin';

async function migrate() {
  console.log('Migration başlıyor...\n');

  // Atlas'a bağlan
  console.log('Atlas\'a bağlanılıyor...');
  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  console.log('✅ Atlas bağlantısı başarılı!\n');

  // Railway'e bağlan
  console.log('Railway MongoDB\'ye bağlanılıyor...');
  const railwayClient = new MongoClient(RAILWAY_URI);
  await railwayClient.connect();
  console.log('✅ Railway bağlantısı başarılı!\n');

  const atlasDb = atlasClient.db('fiyat');
  const railwayDb = railwayClient.db('nomanoglu');

  // Taşınacak collection'lar
  const collections = ['settings', 'customprices', 'articles', 'familycards', 'branches', 'seos'];

  for (const collName of collections) {
    try {
      const sourceCollection = atlasDb.collection(collName);
      const targetCollection = railwayDb.collection(collName);

      // Kaynak verilerini al
      const documents = await sourceCollection.find({}).toArray();

      if (documents.length > 0) {
        // Hedefte varsa temizle
        await targetCollection.deleteMany({});
        // Verileri ekle
        await targetCollection.insertMany(documents);
        console.log(`✅ ${collName}: ${documents.length} kayıt taşındı`);
      } else {
        console.log(`⚠️ ${collName}: Veri yok, atlanıyor`);
      }
    } catch (err) {
      console.log(`❌ ${collName}: Hata - ${err.message}`);
    }
  }

  // Bağlantıları kapat
  await atlasClient.close();
  await railwayClient.close();

  console.log('\n✅ Migration tamamlandı!');
}

migrate().catch(console.error);
