import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    // LocalStorage'dan device ID al, yoksa oluştur
    let id = localStorage.getItem('deviceId');
    
    if (!id) {
      id = uuidv4();
      localStorage.setItem('deviceId', id);
    }
    
    setDeviceId(id);
  }, []);

  return deviceId;
};

