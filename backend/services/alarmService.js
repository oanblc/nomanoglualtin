const Alarm = require('../models/Alarm');
const { getCurrentPrices } = require('./priceService');
const { sendPushNotification } = require('./notificationService');

let alarmCheckInterval = null;

// Alarm koşulunu kontrol et
const checkAlarmCondition = (currentPrice, alarm) => {
  const price = alarm.priceType === 'alis' ? currentPrice.calculatedAlis : currentPrice.calculatedSatis;
  
  if (alarm.condition === 'above') {
    return price >= alarm.targetPrice;
  } else if (alarm.condition === 'below') {
    return price <= alarm.targetPrice;
  }
  return false;
};

// Tüm alarmları kontrol et
const checkAlarms = async (io) => {
  try {
    const activeAlarms = await Alarm.find({ isActive: true, isTriggered: false });
    const currentPrices = getCurrentPrices();

    // Fiyatları code ile erişilebilir hale getir
    const priceMap = {};
    currentPrices.forEach(price => {
      priceMap[price.code] = price;
    });

    for (const alarm of activeAlarms) {
      const currentPrice = priceMap[alarm.productCode];
      
      if (!currentPrice) continue;

      const isTriggered = checkAlarmCondition(currentPrice, alarm);

      if (isTriggered) {
        // Alarmı tetiklenmiş olarak işaretle
        alarm.isTriggered = true;
        alarm.triggeredAt = new Date();
        await alarm.save();

        const price = alarm.priceType === 'alis' ? currentPrice.calculatedAlis : currentPrice.calculatedSatis;
        const conditionText = alarm.condition === 'above' ? 'üstüne çıktı' : 'altına düştü';
        const priceTypeText = alarm.priceType === 'alis' ? 'Alış' : 'Satış';

        const message = `${alarm.productName} ${priceTypeText} fiyatı ${alarm.targetPrice} TL ${conditionText}. Güncel: ${price.toFixed(2)} TL`;

        console.log(`🔔 Alarm tetiklendi: ${message}`);

        // Push notification gönder (mobil için)
        if (alarm.fcmToken) {
          await sendPushNotification(alarm.fcmToken, {
            title: 'Fiyat Alarmı! 🔔',
            body: message,
            data: {
              productCode: alarm.productCode,
              productName: alarm.productName,
              currentPrice: price.toString(),
              targetPrice: alarm.targetPrice.toString()
            }
          });
        }

        // WebSocket ile bildiri gönder (web için)
        io.emit('alarmTriggered', {
          alarmId: alarm._id,
          deviceId: alarm.deviceId,
          productCode: alarm.productCode,
          productName: alarm.productName,
          message,
          currentPrice: price,
          targetPrice: alarm.targetPrice
        });
      }
    }
  } catch (error) {
    console.error('❌ Alarm kontrol hatası:', error);
  }
};

// Alarm kontrolünü başlat
const startAlarmChecker = (io) => {
  console.log('🔔 Alarm kontrol servisi başlatıldı');

  // Her 5 saniyede bir kontrol et
  alarmCheckInterval = setInterval(() => {
    checkAlarms(io);
  }, 5000);
};

// Alarm kontrolünü durdur
const stopAlarmChecker = () => {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
    console.log('⏹️ Alarm kontrol servisi durduruldu');
  }
};

module.exports = {
  startAlarmChecker,
  stopAlarmChecker,
  checkAlarms
};

