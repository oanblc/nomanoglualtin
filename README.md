# Nomanoğlu Altın - Fiyat Takip Sistemi

Anlık altın, döviz ve gümüş fiyatlarını takip eden web uygulaması.

## Gereksinimler

- Node.js 18+
- npm veya yarn

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

```bash
# backend/.env
PORT=5001
MONGODB_URI=mongodb://mongo:FDaHhHFYvQKRWtdzWSeKnFKWrARXamHe@shuttle.proxy.rlwy.net:16685/nomanoglu?authSource=admin
JWT_SECRET=8ed7817332a87d696eb479a04ce0849301a181bb6a3608463465029a15e02d6045ded06472ca9b77c518107a94e6ea43f7bc66ce15956dcdecfadb0e57826ff0
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Nomanoglu2024!
VPS_WS_URL=http://37.148.208.13:3000
WEBHOOK_SECRET=nomanoglu_webhook_2024_gizli
```

**Backend'i başlat:**

```bash
npm start
# veya development modunda:
npm run dev
```

### 3. Frontend Kurulumu

Yeni terminal aç ve ana klasöre git:

```bash
cd ..  # veya projenin ana klasörüne git
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
| Health Check | http://localhost:5001/health |

## Admin Giriş Bilgileri

- **Kullanıcı:** admin
- **Şifre:** Nomanoglu2024!

## Hızlı Başlatma (Tek Komutla)

Windows PowerShell'de:

```powershell
# Backend başlat (Terminal 1)
cd backend; npm install; npm start

# Frontend başlat (Terminal 2 - yeni pencere)
npm install; npm run dev
```

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

- Anlık altın/döviz fiyat takibi (WebSocket)
- Admin paneli ile fiyat yönetimi
- Responsive tasarım
- SEO optimizasyonu
- KVKK uyumlu çerez yönetimi

## Sorun Giderme

### MongoDB Bağlantı Hatası
`.env` dosyasındaki `MONGODB_URI` değerinin doğru olduğundan emin olun.

### WebSocket Bağlanmıyor
Backend'in çalıştığından emin olun: `curl http://localhost:5001/health`

### Port Kullanımda Hatası
Başka bir uygulama portu kullanıyor olabilir. Port'u değiştirin veya mevcut uygulamayı kapatın.
