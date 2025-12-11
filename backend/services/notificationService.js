const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Firebase credentials'ları environment variable'lardan al
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    // Eğer credentials yoksa uyarı ver ama crash etme
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.warn('⚠️ Firebase credentials eksik. Push notification çalışmayacak.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK başlatıldı');
  } catch (error) {
    console.error('❌ Firebase başlatma hatası:', error.message);
  }
};

// Push notification gönder
const sendPushNotification = async (fcmToken, notification) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    console.warn('⚠️ Firebase başlatılmadı, notification gönderilemedi');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'price_alarms'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification gönderildi:', response);
    return response;
  } catch (error) {
    console.error('❌ Push notification hatası:', error.message);
    return null;
  }
};

// Toplu notification gönder
const sendBulkNotifications = async (tokens, notification) => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized || !tokens.length) {
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ ${response.successCount} notification gönderildi`);
    return response;
  } catch (error) {
    console.error('❌ Bulk notification hatası:', error.message);
    return null;
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendBulkNotifications
};

