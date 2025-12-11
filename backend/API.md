# 📡 Fiyat Takip API Dokümantasyonu

Backend API endpoint'leri - Web ve Mobil Uygulamalar için

## 🔌 Base URL
```
http://localhost:5000/api
```

---

## 📊 Fiyat Endpoint'leri

### 1. Mevcut Fiyatları Getir
```http
GET /api/prices/current
```
**Açıklama:** Ham kaynak fiyatlarını getirir (API'den çekilen fiyatlar)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "USDTRY",
      "name": "Amerikan Doları",
      "rawAlis": 34.25,
      "rawSatis": 34.45,
      "category": "doviz"
    }
  ]
}
```

### 2. Kaynak Fiyatları Getir
```http
GET /api/prices/sources
```
**Açıklama:** Admin panel için kaynak fiyatları + metadata

**Response:**
```json
{
  "success": true,
  "data": [...],
  "lastUpdate": "2024-01-01T12:00:00.000Z",
  "count": 50
}
```

### 3. Fiyat Geçmişi
```http
GET /api/prices/history/:code?hours=24
```
**Parametreler:**
- `code`: Fiyat kodu (örn: USDTRY)
- `hours`: Kaç saatlik geçmiş (default: 24)

---

## 💰 Custom Prices (Özel Fiyatlar)

### 1. Tüm Custom Fiyatları Getir
```http
GET /api/custom-prices
```
**Açıklama:** Oluşturulan tüm özel fiyatları getirir

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc123...",
      "name": "VIP Dolar",
      "code": "VIP_USD",
      "category": "doviz",
      "alisConfig": {
        "sourceCode": "USDTRY",
        "sourceType": "satis",
        "multiplier": 1.05,
        "addition": 0.5
      },
      "satisConfig": {
        "sourceCode": "USDTRY",
        "sourceType": "satis",
        "multiplier": 1.08,
        "addition": 1
      },
      "order": 0,
      "isVisible": true
    }
  ]
}
```

### 2. Custom Fiyat Oluştur
```http
POST /api/custom-prices
Content-Type: application/json

{
  "name": "VIP Dolar",
  "code": "VIP_USD",
  "category": "doviz",
  "alisConfig": {
    "sourceCode": "USDTRY",
    "sourceType": "satis",
    "multiplier": 1.05,
    "addition": 0.5
  },
  "satisConfig": {
    "sourceCode": "USDTRY",
    "sourceType": "satis",
    "multiplier": 1.08,
    "addition": 1
  }
}
```

### 3. Custom Fiyat Güncelle
```http
PUT /api/custom-prices/:id
```

### 4. Custom Fiyat Sil
```http
DELETE /api/custom-prices/:id
```

---

## 👨‍👩‍👧‍👦 Family Cards (NOMANOĞLU Ailesi)

### 1. Tüm Kartları Getir
```http
GET /api/family-cards
```

### 2. Kart Oluştur
```http
POST /api/family-cards
Content-Type: application/json

{
  "label": "1967'den Beri",
  "title": "Yarım asırlık deneyim.",
  "description": "1967'den bugüne güvenilir ve kaliteli hizmet.",
  "icon": "TrendingUp",
  "order": 1
}
```

### 3. Kart Güncelle
```http
PUT /api/family-cards/:id
```

### 4. Kart Sil
```http
DELETE /api/family-cards/:id
```

---

## 📝 Articles (Makaleler)

### 1. Tüm Makaleleri Getir
```http
GET /api/articles
```

### 2. Makale Oluştur
```http
POST /api/articles
Content-Type: application/json

{
  "category": "Yatırım",
  "title": "Altın Yatırımı Rehberi",
  "description": "Altın yatırımı yaparken dikkat edilmesi gereken önemli noktalar.",
  "content": "## Başlık\n\nMakale içeriği...",
  "icon": "Coins",
  "order": 1
}
```

### 3. Makale Güncelle
```http
PUT /api/articles/:id
```

### 4. Makale Sil
```http
DELETE /api/articles/:id
```

### 5. Tek Makale Getir
```http
GET /api/articles/:id
```

---

## 🏢 Branches (Şubeler)

### 1. Tüm Şubeleri Getir
```http
GET /api/branches
```

### 2. Şube Oluştur
```http
POST /api/branches
Content-Type: application/json

{
  "name": "Kadirli Şubesi",
  "city": "Osmaniye",
  "address": "Cumhuriyet Mahallesi, Atatürk Caddesi No:123",
  "phone": "0850 XXX XX XX",
  "email": "kadirli@nomanoglu.com",
  "workingHours": "09:00 - 18:00",
  "mapLink": "https://maps.google.com/..."
}
```

### 3. Şube Güncelle
```http
PUT /api/branches/:id
```

### 4. Şube Sil
```http
DELETE /api/branches/:id
```

---

## ⚙️ Settings (Ayarlar)

### 1. Ayarları Getir
```http
GET /api/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logoBase64": "data:image/png;base64,...",
    "logoHeight": 48,
    "logoWidth": "auto",
    "maxDisplayItems": 20,
    "featuredPrices": ["USDTRY", "EURTRY", "GBPTRY"]
  }
}
```

### 2. Ayarları Güncelle (Singleton)
```http
POST /api/settings
Content-Type: application/json

{
  "logoBase64": "data:image/png;base64,...",
  "logoHeight": 48,
  "logoWidth": "auto",
  "maxDisplayItems": 20
}
```

---

## 🚨 Alarms (Alarmlar)

Mevcut alarm endpoint'leri için:
```http
GET /api/alarms
POST /api/alarms
PUT /api/alarms/:id
DELETE /api/alarms/:id
```

---

## 📱 Mobil Uygulama Kullanımı

Mobil uygulamanız için önerilen endpoint'ler:

### Başlangıç Yüklemesi
1. `GET /api/custom-prices` - Fiyat listesi
2. `GET /api/family-cards` - Kurumsal kartlar
3. `GET /api/articles` - Makaleler
4. `GET /api/branches` - Şubeler
5. `GET /api/settings` - Logo ve ayarlar

### WebSocket Bağlantısı
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('priceUpdate', (data) => {
  console.log('Fiyatlar güncellendi:', data.prices);
});
```

---

## 🔐 Authentication

Admin panel endpoint'leri için:
```http
POST /api/auth/login
POST /api/auth/register
```

---

## ⚡ Hata Kodları

- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Hatalı istek
- `401` - Yetkisiz
- `404` - Bulunamadı
- `500` - Sunucu hatası

## 📝 Notlar

- Tüm POST/PUT istekleri `Content-Type: application/json` header'ı gerektirir
- MongoDB connection string: `.env` dosyasında `MONGODB_URI` olarak tanımlı
- WebSocket gerçek zamanlı fiyat güncellemeleri için kullanılır

