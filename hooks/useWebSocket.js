import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const CACHE_KEY = 'cachedPrices';
const CACHE_TIME_KEY = 'cachedPricesTime';
const CACHE_DURATION = 60 * 60 * 1000; // 1 saat

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const previousPricesRef = useRef([]);
  const initialLoadDone = useRef(false);

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
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Sürekli dene
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      // Bağlantı kesildiğinde önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
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

      // Cache'e kaydet
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (err) {
        // Cache yazma hatası
      }

      setPrices(sortedPrices);
      setLastUpdate(data.meta?.time || Date.now());
    });

    newSocket.on('connect_error', () => {
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

