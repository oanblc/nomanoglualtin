const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Models
const CustomPrice = require('../models/CustomPrice');
const FamilyCard = require('../models/FamilyCard');
const Article = require('../models/Article');
const Branch = require('../models/Branch');
const Settings = require('../models/Settings');

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiyat';

console.log('🔄 MongoDB Migration Başlatılıyor...\n');

async function migrate() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB bağlantısı kuruldu\n');

    const dataPath = path.join(__dirname, '..', 'data');

    // 1. Custom Prices Migration
    console.log('📦 Custom Prices migrate ediliyor...');
    const customPricesPath = path.join(dataPath, 'customPrices.json');
    if (fs.existsSync(customPricesPath)) {
      const customPricesData = JSON.parse(fs.readFileSync(customPricesPath, 'utf8'));
      
      // Önce mevcut verileri temizle
      await CustomPrice.deleteMany({});
      
      if (customPricesData && customPricesData.length > 0) {
        for (const priceData of customPricesData) {
          const price = new CustomPrice(priceData);
          await price.save();
        }
        console.log(`✅ ${customPricesData.length} custom price migrate edildi`);
      } else {
        console.log('⚠️  customPrices.json boş');
      }
    } else {
      console.log('⚠️  customPrices.json bulunamadı');
    }

    // 2. Family Cards Migration
    console.log('\n📦 Family Cards migrate ediliyor...');
    const familyCardsPath = path.join(dataPath, 'familyCards.json');
    if (fs.existsSync(familyCardsPath)) {
      const familyCardsData = JSON.parse(fs.readFileSync(familyCardsPath, 'utf8'));
      
      await FamilyCard.deleteMany({});
      
      if (familyCardsData && familyCardsData.length > 0) {
        for (const cardData of familyCardsData) {
          const card = new FamilyCard(cardData);
          await card.save();
        }
        console.log(`✅ ${familyCardsData.length} family card migrate edildi`);
      } else {
        console.log('⚠️  familyCards.json boş');
      }
    } else {
      console.log('⚠️  familyCards.json bulunamadı');
    }

    // 3. Articles Migration
    console.log('\n📦 Articles migrate ediliyor...');
    const articlesPath = path.join(dataPath, 'articles.json');
    if (fs.existsSync(articlesPath)) {
      const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
      
      await Article.deleteMany({});
      
      if (articlesData && articlesData.length > 0) {
        for (const articleData of articlesData) {
          const article = new Article(articleData);
          await article.save();
        }
        console.log(`✅ ${articlesData.length} article migrate edildi`);
      } else {
        console.log('⚠️  articles.json boş');
      }
    } else {
      console.log('⚠️  articles.json bulunamadı');
    }

    // 4. Branches Migration
    console.log('\n📦 Branches migrate ediliyor...');
    const branchesPath = path.join(dataPath, 'branches.json');
    if (fs.existsSync(branchesPath)) {
      const branchesData = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));
      
      await Branch.deleteMany({});
      
      if (branchesData && branchesData.length > 0) {
        for (const branchData of branchesData) {
          const branch = new Branch(branchData);
          await branch.save();
        }
        console.log(`✅ ${branchesData.length} branch migrate edildi`);
      } else {
        console.log('⚠️  branches.json boş');
      }
    } else {
      console.log('⚠️  branches.json bulunamadı');
    }

    // 5. Settings Migration
    console.log('\n📦 Settings migrate ediliyor...');
    const settingsPath = path.join(dataPath, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      await Settings.deleteMany({});
      
      const settings = new Settings({
        key: 'app_settings',
        ...settingsData
      });
      await settings.save();
      console.log('✅ Settings migrate edildi');
    } else {
      // Varsayılan settings oluştur
      const settings = new Settings({
        key: 'app_settings',
        logoBase64: '',
        logoHeight: 48,
        logoWidth: 'auto',
        maxDisplayItems: 20,
        featuredPrices: ['USDTRY', 'EURTRY', 'GBPTRY']
      });
      await settings.save();
      console.log('✅ Varsayılan settings oluşturuldu');
    }

    console.log('\n🎉 Migration başarıyla tamamlandı!\n');
    
    // Özet
    const customPricesCount = await CustomPrice.countDocuments();
    const familyCardsCount = await FamilyCard.countDocuments();
    const articlesCount = await Article.countDocuments();
    const branchesCount = await Branch.countDocuments();
    
    console.log('📊 Migration Özeti:');
    console.log(`   - Custom Prices: ${customPricesCount}`);
    console.log(`   - Family Cards: ${familyCardsCount}`);
    console.log(`   - Articles: ${articlesCount}`);
    console.log(`   - Branches: ${branchesCount}`);
    console.log(`   - Settings: 1 (singleton)`);
    
  } catch (error) {
    console.error('\n❌ Migration hatası:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
}

// Migration'ı çalıştır
migrate();

