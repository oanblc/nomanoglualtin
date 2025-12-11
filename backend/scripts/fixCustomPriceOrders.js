require('dotenv').config();
const mongoose = require('mongoose');
const CustomPrice = require('../models/CustomPrice');

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı kuruldu');

    // Tüm custom fiyatları al (mevcut order'a göre)
    const prices = await CustomPrice.find().sort({ order: 1, createdAt: 1 });
    console.log(`📊 ${prices.length} custom fiyat bulundu`);

    // Order değerlerini sırayla güncelle
    for (let i = 0; i < prices.length; i++) {
      prices[i].order = i;
      await prices[i].save();
      console.log(`✅ ${prices[i].code} - order: ${i}`);
    }

    console.log('🎉 Tüm order değerleri güncellendi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

fixOrders();

