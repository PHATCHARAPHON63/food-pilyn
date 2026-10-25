// ============================================
// React Hook: useGeolocation
// ดึงตำแหน่งปัจจุบันของผู้ใช้จาก Browser Geolocation API
// ============================================
'use client';

import { useEffect, useState } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  // ดึงตำแหน่งจาก Browser Geolocation API (setState ใน callback เป็นสิ่งจำเป็น)
  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: 'เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง' }));
      return;
    }

    const watcher = navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          latitude: null,
          longitude: null,
          error: err.message || 'ไม่สามารถดึงตำแหน่งได้',
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (typeof watcher === 'number') navigator.geolocation.clearWatch(watcher);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return state;
}
