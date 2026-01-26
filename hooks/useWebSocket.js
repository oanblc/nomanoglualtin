import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const CACHE_KEY = 'cachedPrices';
const CACHE_TIME_KEY = 'cachedPricesTime';
const CACHE_DURATION = 60 * 60 * 1000; // 1 saat
const CACHE_WRITE_INTERVAL = 10000; // 10 saniyede bir localStorage'a yaz

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const previousPricesRef = useRef([]);
  const initialLoadDone = useRef(false);
  const lastCacheWrite = useRef(0);
  const socketRef = useRef(null);

  // Sayfa yüklendiğinde önce API'den, sonra localStorage'dan fiyatları yükle
  useEffect(() => {
    const loadInitialPrices = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      try {
        // Önce API'den cache'li fiyatları çek
        const response = await fetch(`${apiUrl}/api/prices/cached`);
        const data = await response.json();

        if (data.success && data.data && data.data.prices && data.data.prices.length > 0) {
          const sortedPrices = [...data.data.prices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          setPrices(sortedPrices);
          previousPricesRef.current = sortedPrices;
          setLastUpdate(data.data.meta?.time || data.updatedAt);

          // LocalStorage'a da kaydet
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
          return;
        }
      } catch (err) {
        // API cache erişilemedi, localStorage denenecek
      }

      // API'den alınamazsa localStorage'dan dene
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cached && cachedTime) {
          const timeDiff = Date.now() - parseInt(cachedTime);
          if (timeDiff < CACHE_DURATION) {
            const cachedPrices = JSON.parse(cached);
            if (cachedPrices && cachedPrices.length > 0) {
              const sortedPrices = [...cachedPrices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
              setPrices(sortedPrices);
              previousPricesRef.current = sortedPrices;
            }
          }
        }
      } catch (err) {
        // LocalStorage okuma hatası
      }
    };

    loadInitialPrices();
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 500, // Daha hızlı reconnect
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      pingTimeout: 5000, // Ping timeout - bağlantı kontrolü
      pingInterval: 3000 // Daha sık ping
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🔗 Socket.IO bağlandı');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO bağlantı kesildi:', reason);
      setIsConnected(false);
      // Bağlantı kesildiğinde önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
      // Transport close durumunda hemen reconnect dene
      if (reason === 'transport close' || reason === 'transport error') {
        setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            console.log('🔄 Yeniden bağlanıyor...');
            socketRef.current.connect();
          }
        }, 500);
      }
    });

    newSocket.on('priceUpdate', (data) => {
      // Veri kontrolü - boş veya geçersiz veri gelirse önceki fiyatları koru
      if (!data || !data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
        return;
      }

      // Görünür ve geçerli fiyatları filtrele
      const validPrices = data.prices.filter(p =>
        p.isVisible !== false &&
        p.calculatedAlis !== undefined &&
        p.calculatedSatis !== undefined &&
        p.calculatedAlis !== null &&
        p.calculatedSatis !== null &&
        !isNaN(p.calculatedAlis) &&
        !isNaN(p.calculatedSatis) &&
        p.calculatedAlis > 0 &&
        p.calculatedSatis > 0
      );

      // Hiç geçerli fiyat yoksa önceki fiyatları koru
      if (validPrices.length === 0) {
        return;
      }

      // WebSocket'ten gelen fiyatları DOĞRUDAN kullan (merge etme!)
      // Backend zaten tüm fiyatları hesaplayıp gönderiyor
      const sortedPrices = [...validPrices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      // Ref'i güncelle
      previousPricesRef.current = sortedPrices;

      // Cache'e throttled yaz - her güncelleme yerine 10 saniyede bir
      const now = Date.now();
      if (now - lastCacheWrite.current > CACHE_WRITE_INTERVAL) {
        lastCacheWrite.current = now;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
        } catch (err) {
          // Cache yazma hatası
        }
      }

      setPrices(sortedPrices);
      setLastUpdate(data.meta?.time || now);
    });

    newSocket.on('connect_error', (error) => {
      console.log('⚠️ Socket.IO bağlantı hatası:', error.message);
      // Hata durumunda önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
    });

    // Tab görünürlük değişikliği - tab aktif olunca reconnect
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab aktif oldu, bağlantı kontrol ediliyor...');
        if (socketRef.current && !socketRef.current.connected) {
          console.log('🔄 Yeniden bağlanıyor...');
          socketRef.current.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    setSocket(newSocket);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      newSocket.close();
    };
  }, []);

  return { socket, prices, isConnected, lastUpdate };
};

