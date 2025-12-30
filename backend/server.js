const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// İzin verilen originler (production ve development)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nomanoglualtin.up.railway.app',
  'https://nomanoglualtin-production.up.railway.app',
  'https://powerful-liberation-production.up.railway.app',
  'https://www.nomanoglualtin.com.tr',
  'https://nomanoglualtin.com.tr'
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Güvenlik Middleware'leri
// 1. Helmet - HTTP Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "wss:", "ws:", ...allowedOrigins]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. CORS - Sadece izin verilen originler
app.use(cors({
  origin: function (origin, callback) {
    // origin undefined ise (aynı origin istekleri) izin ver
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiting - Genel API limiti
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 istek
  message: { success: false, message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Login için özel rate limit (brute force koruması)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına 5 login denemesi
  message: { success: false, message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting uygula
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // Body size limiti

// MongoDB bağlantısı (opsiyonel)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => {
  console.warn('⚠️ MongoDB bağlantı hatası (devam ediliyor):', err.message);
  // MongoDB olmadan da çalış
});

// Routes
const authRoutes = require('./routes/auth');
const priceRoutes = require('./routes/prices');
const coefficientRoutes = require('./routes/coefficients');
const familyCardsRoutes = require('./routes/familyCards');
const articlesRoutes = require('./routes/articles');
const branchesRoutes = require('./routes/branches');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/coefficients', coefficientRoutes);
// customPricesRoutes io'ya ihtiyaç duyduğu için factory fonksiyon olarak çağrılıyor
app.use('/api/custom-prices', require('./routes/customPrices')(io));
app.use('/api/family-cards', familyCardsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server çalışıyor' });
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('👤 Yeni kullanıcı bağlandı:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 Kullanıcı ayrıldı:', socket.id);
  });
});

// WebSocket ve Polling servisini başlat
const priceService = require('./services/priceService');

// MongoDB bağlantısından bağımsız olarak çalıştır
setTimeout(() => {
  console.log('🔄 Price service başlatılıyor...');
  priceService.startPolling(io);
}, 2000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});

module.exports = { io };

