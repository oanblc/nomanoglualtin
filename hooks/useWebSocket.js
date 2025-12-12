import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const CACHE_KEY = 'cachedPrices';
const CACHE_TIME_KEY = 'cachedPricesTime';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const previousPricesRef = useRef([]);

  // Sayfa yüklendiğinde cache'den fiyatları yükle
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      if (cached && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        // Cache 5 dakikadan eskiyse kullanma
        if (timeDiff < CACHE_DURATION) {
          const cachedPrices = JSON.parse(cached);
          if (cachedPrices && cachedPrices.length > 0) {
            // Order'a gore sirala
            const sortedPrices = [...cachedPrices].sort((a, b) => (a.order || 0) - (b.order || 0));
            setPrices(sortedPrices);
            previousPricesRef.current = sortedPrices;
            console.log('📦 Cache\'den fiyatlar yüklendi:', sortedPrices.length);
          }
        }
      }
    } catch (err) {
      console.error('Cache okuma hatası:', err);
    }
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Sürekli dene
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket bağlantısı kuruldu');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket bağlantısı kesildi');
      setIsConnected(false);
      // Bağlantı kesildiğinde önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
    });

    newSocket.on('priceUpdate', (data) => {
      // Veri kontrolü - boş veya geçersiz veri gelirse önceki fiyatları koru
      if (!data || !data.prices || !Array.isArray(data.prices)) {
        console.log('⚠️ Geçersiz veri formatı, önceki fiyatlar korunuyor');
        return;
      }

      const visiblePrices = data.prices.filter(p => p.isVisible);

      // Sadece geçerli veri varsa güncelle
      if (visiblePrices.length > 0) {
        // Order'a gore sirala
        const sortedPrices = [...visiblePrices].sort((a, b) => (a.order || 0) - (b.order || 0));

        setPrices(sortedPrices);
        previousPricesRef.current = sortedPrices;
        setLastUpdate(data.meta?.time || Date.now());

        // Cache'e kaydet (siralanmis hali)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (err) {
          console.error('Cache yazma hatası:', err);
        }
      } else if (previousPricesRef.current.length > 0) {
        // Boş veri gelirse önceki fiyatları geri yükle
        console.log('⚠️ Boş fiyat verisi geldi, önceki fiyatlar geri yükleniyor');
        setPrices(previousPricesRef.current);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket bağlantı hatası:', error);
      // Hata durumunda önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, prices, isConnected, lastUpdate };
};

