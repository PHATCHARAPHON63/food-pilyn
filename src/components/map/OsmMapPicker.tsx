// ============================================
// แผนที่ปักหมุดด้วย OpenStreetMap (Leaflet)
// ใช้เมื่อ Google Maps API Key ไม่พร้อมใช้งาน
// ============================================
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MAP_CENTER,
  formatLatLng,
  geoErrorMessage,
  reverseGeocodeNominatim,
} from '@/lib/geo';
import { ensureLeafletCss } from '@/lib/leaflet-map';
import type { GeoLocation } from '@/types';

interface OsmMapPickerProps {
  value?: GeoLocation;
  onChange: (location: GeoLocation) => void;
  className?: string;
  hint?: string;
}

function pinIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;border-radius:9999px;background:#0b1f3a;border:3px solid #c9a227;box-shadow:0 4px 10px rgba(11,31,58,0.35)"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function OsmMapPicker({
  value,
  onChange,
  className,
  hint = 'แตะแผนที่เพื่อปักหมุดจุดรับอาหาร',
}: OsmMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const applyLocationRef = useRef<(pos: GeoLocation, pan?: boolean) => void>(() => {});

  const [address, setAddress] = useState(value?.address || '');
  const [picked, setPicked] = useState(Boolean(value));
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);

  const ensureMarker = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }
    const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon() }).addTo(map);
    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      applyLocationRef.current({ lat: latlng.lat, lng: latlng.lng }, false);
    });
    markerRef.current = marker;
  };

  const applyLocation = async (pos: GeoLocation, pan = true) => {
    ensureMarker(pos.lat, pos.lng);
    if (pan) mapRef.current?.panTo([pos.lat, pos.lng]);
    onChangeRef.current(pos);
    setPicked(true);
    setAddress(formatLatLng(pos));
    try {
      const formatted = await reverseGeocodeNominatim(pos);
      if (formatted) {
        setAddress(formatted);
        onChangeRef.current({ ...pos, address: formatted });
      }
    } catch {
      // ใช้พิกัดอย่างเดียวถ้าแปลงที่อยู่ไม่สำเร็จ
    }
  };
  applyLocationRef.current = (pos, pan) => {
    void applyLocation(pos, pan);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    ensureLeafletCss();
    const el = containerRef.current;
    if (!el) return;

    const start = value || DEFAULT_MAP_CENTER;
    const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(
      [start.lat, start.lng],
      16
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      applyLocationRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }, false);
    });

    mapRef.current = map;
    const resize = window.setTimeout(() => map.invalidateSize(), 80);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    if (value) {
      ensureMarker(value.lat, value.lng);
      setAddress(value.address || formatLatLng(value));
      setPicked(true);
    }

    return () => {
      window.clearTimeout(resize);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // สร้างแผนที่ครั้งเดียวตอน mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value) return;
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      if (Math.abs(latlng.lat - value.lat) < 1e-7 && Math.abs(latlng.lng - value.lng) < 1e-7) {
        if (value.address) setAddress(value.address);
        return;
      }
    }
    applyLocationRef.current(value, true);
  }, [value?.lat, value?.lng, value?.address]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
        void applyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(geoErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className={cn('relative flex flex-col gap-3', className)}>
      <div className="relative z-0 isolate h-80 w-full overflow-hidden rounded-2xl border border-border md:h-[28rem]">
        <div ref={containerRef} className="h-full w-full" />
        {!picked && (
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
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm font-medium text-navy shadow-lg hover:bg-accent-soft disabled:opacity-70"
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
