# Nomanoğlu Altın - Fiyat Takip Sistemi

Anlık altın, döviz ve gümüş fiyatlarını takip eden web uygulaması.

## Gereksinimler

- Node.js 18+
- npm veya yarn
- MongoDB erişimi

## Kurulum

### 1. Projeyi Klonla

```bash
git clone https://github.com/oanblc/nomanoglualtin.git
cd nomanoglualtin
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

**Backend `.env` dosyası oluştur:**

`backend/.env.example` dosyasını kopyala ve değerleri doldur:

```bash
cp .env.example .env
# .env dosyasını editörde açıp gerçek değerleri gir
```

Gerekli değişkenler (detay `.env.example`'da):

| Değişken | Açıklama |
|----------|----------|
| `PORT` | Backend port (varsayılan 5001) |
| `MONGODB_URI` | MongoDB bağlantı string'i (Railway dashboard veya MongoDB provider'ından) |
| `JWT_SECRET` | JWT imzalama anahtarı — `openssl rand -hex 64` ile üret |
| `ADMIN_USERNAME` | Admin kullanıcı adı |
| `ADMIN_PASSWORD` | Admin şifresi (üretimde bcrypt hash olarak saklanması önerilir) |
| `WEBHOOK_SECRET` | Webhook doğrulama anahtarı — `openssl rand -hex 32` |
| `PRICE_API_URL` | Birincil fiyat kaynağı API'si |
| `PRICE_API_URL_BACKUP` | Yedek fiyat kaynağı |

**Backend'i başlat:**

```bash
npm start
# veya development modunda:
npm run dev
```

### 3. Frontend Kurulumu

Yeni terminal aç ve ana klasöre git:

```bash
cd ..
npm install
```

**Frontend `.env.local` dosyası oluştur:**

```bash
# .env.local (ana klasörde)
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=http://localhost:5001
```

**Frontend'i başlat:**

```bash
npm run dev
```

## Erişim Adresleri

| Servis | Adres |
|--------|-------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| Admin Panel | http://localhost:3000/admin/login |
| İşletme Sayfası | http://localhost:3000/isletme-fiyatlari |
| Health Check | http://localhost:5001/health |

## Proje Yapısı

```
nomanoglualtin/
├── pages/              # Next.js sayfaları
├── components/         # React bileşenleri
├── hooks/              # Custom React hooks
├── contexts/           # React context'ler
├── styles/             # CSS dosyaları
├── backend/            # Express.js backend
│   ├── routes/         # API route'ları
│   ├── models/         # MongoDB modelleri
│   ├── services/       # İş mantığı servisleri
│   └── middleware/     # Express middleware'ler
└── public/             # Statik dosyalar
```

## Özellikler

- Anlık altın/döviz fiyat takibi (Socket.IO WebSocket)
- Admin paneli ile fiyat yönetimi
- **İşletme Fiyatları:** şube içi özel fiyatlandırma (şifre korumalı)
- KYC işlem yönetimi ve PDF export
- Responsive tasarım
- SEO optimizasyonu
- KVKK uyumlu çerez yönetimi

## Deploy

Railway GitHub entegrasyonu ile otomatik deploy:
- `main` branch'ine push → Railway otomatik build + deploy
- Env vars Railway dashboard → Variables altında yönetilir
- Build log: Railway dashboard → Deployments

## Sorun Giderme

### MongoDB Bağlantı Hatası
`.env` dosyasındaki `MONGODB_URI` değerinin doğru olduğundan emin olun.

### WebSocket Bağlanmıyor
Backend'in çalıştığından emin olun: `curl http://localhost:5001/health`

### Port Kullanımda Hatası
Başka bir uygulama portu kullanıyor olabilir. Port'u değiştirin veya mevcut uygulamayı kapatın.

## Güvenlik

- `.env` ve `backend/.env` dosyalarını **asla** commit etmeyin (`.gitignore`'da mevcut)
- Admin/employee/business şifrelerini düzenli rotate edin
- `JWT_SECRET` ve `WEBHOOK_SECRET` yeterince uzun random olmalı
- Prod'da `ADMIN_PASSWORD`'ü bcrypt hash olarak saklamak güvenlik artışı sağlar
