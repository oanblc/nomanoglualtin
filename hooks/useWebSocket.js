import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket bağlantısı kuruldu');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket bağlantısı kesildi');
      setIsConnected(false);
    });

    newSocket.on('priceUpdate', (data) => {
      if (data && data.prices) {
        setPrices(data.prices.filter(p => p.isVisible));
        setLastUpdate(data.meta?.time || Date.now());
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket bağlantı hatası:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, prices, isConnected, lastUpdate };
};

