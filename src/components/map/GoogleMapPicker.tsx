// ============================================
// Location Picker
// ใช้ Google Maps ถ้ามี API Key, ไม่เช่นนั้นใช้ OpenStreetMap
// ============================================
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_MAP_CENTER, formatLatLng, geoErrorMessage, getGoogleMapsApiKey } from '@/lib/geo';
import type { GeoLocation } from '@/types';

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

interface GoogleMapPickerProps {
  value?: GeoLocation;
  onChange: (location: GeoLocation) => void;
  className?: string;
  hint?: string;
}

const OsmMapPicker = dynamic(() => import('./OsmMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-2xl bg-surface md:h-[28rem]">
      <div className="spinner" />
    </div>
  ),
});

const mapContainerStyle = { width: '100%', height: '100%' };

function GoogleMapInner({
  value,
  onChange,
  className,
  hint = 'แตะแผนที่เพื่อปักหมุดจุดรับอาหาร',
  apiKey,
  onFatalError,
}: GoogleMapPickerProps & { apiKey: string; onFatalError: () => void }) {
  const [center, setCenter] = useState<GeoLocation>(value || DEFAULT_MAP_CENTER);
  const [address, setAddress] = useState(value?.address || '');
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    id: 'google-maps-script',
  });

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => onFatalError();
    return () => {
      window.gm_authFailure = previous;
    };
  }, [onFatalError]);

  useEffect(() => {
    if (loadError) onFatalError();
  }, [loadError, onFatalError]);

  useEffect(() => {
    if (!value) return;
    setCenter(value);
    if (value.address) setAddress(value.address);
    mapRef.current?.panTo(value);
  }, [value?.lat, value?.lng, value?.address]);

  const applyLocation = async (pos: GeoLocation, pan = true) => {
    setCenter(pos);
    if (pan) mapRef.current?.panTo(pos);
    onChangeRef.current(pos);
    setAddress(formatLatLng(pos));

    if (!window.google?.maps) return;
    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ location: pos });
      const formatted = results[0]?.formatted_address;
      if (formatted) {
        setAddress(formatted);
        onChangeRef.current({ ...pos, address: formatted });
      }
    } catch {
      // ใช้พิกัดอย่างเดียวถ้าแปลงที่อยู่ไม่สำเร็จ
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    applyLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() }, false);
  };

  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        applyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(geoErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (!isLoaded) {
    return (
      <div className={cn('flex h-80 items-center justify-center rounded-2xl bg-surface md:h-[28rem]', className)}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col gap-3', className)}>
      <div className="relative z-0 isolate h-80 w-full overflow-hidden rounded-2xl border border-border md:h-[28rem]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onClick={handleMapClick}
        >
          {value && (
            <Marker
              position={value}
              draggable
              onDragEnd={(e) => {
                if (!e.latLng) return;
                applyLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() }, false);
              }}
            />
          )}
        </GoogleMap>

        {!value && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <p className="rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-navy shadow">
              {hint}
            </p>
          </div>
        )}

        <button
          onClick={goToCurrentLocation}
          type="button"
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1] flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm font-medium text-navy shadow-lg hover:bg-accent-soft disabled:opacity-70"
        >
          <Navigation className="h-4 w-4" />
          {locating ? 'กำลังหาตำแหน่ง...' : 'ตำแหน่งฉัน'}
        </button>
      </div>
      {geoError && <p className="text-sm text-red-600">{geoError}</p>}
      {address && (
        <div className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-navy">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}

export default function GoogleMapPicker(props: GoogleMapPickerProps) {
  const apiKey = getGoogleMapsApiKey();
  const [useOsm, setUseOsm] = useState(!apiKey);

  if (useOsm) {
    return <OsmMapPicker {...props} />;
  }

  return <GoogleMapInner {...props} apiKey={apiKey} onFatalError={() => setUseOsm(true)} />;
}
