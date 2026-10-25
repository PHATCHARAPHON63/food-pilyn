// ============================================
// Delivery Map สำหรับแอดมิน
// แสดงจุดร้าน จุดจัดส่ง ลำดับ และเส้นทาง ด้วย OpenStreetMap
// ============================================
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { ensureLeafletCss } from '@/lib/leaflet-map';
import type { GeoLocation, Order } from '@/types';

interface DeliveryMapProps {
  origin: GeoLocation;
  orders: Order[];
  optimizedSequence?: Order[];
  routePath?: GeoLocation[];
  className?: string;
}

function markerIcon(label: string, bg: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${bg};color:#fff;border:2px solid #fff;box-shadow:0 4px 10px rgba(11,31,58,0.3);display:flex;align-items:center;justify-content:center;font:700 11px/1 sans-serif">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function DeliveryMap({
  origin,
  orders,
  optimizedSequence,
  routePath,
  className,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    ensureLeafletCss();
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, { zoomControl: true }).setView([origin.lat, origin.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const resize = window.setTimeout(() => map.invalidateSize(), 80);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    return () => {
      window.clearTimeout(resize);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
    // สร้างแผนที่ครั้งเดียว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const displayOrders = optimizedSequence || orders;
    const bounds = L.latLngBounds([[origin.lat, origin.lng]]);

    L.marker([origin.lat, origin.lng], {
      icon: markerIcon('ร้าน', '#0b1f3a'),
      title: origin.address || 'ร้าน',
    }).addTo(layers);

    displayOrders.forEach((order, idx) => {
      const seq = order.deliverySequence ?? idx + 1;
      const pos = order.deliveryLocation;
      bounds.extend([pos.lat, pos.lng]);
      L.marker([pos.lat, pos.lng], {
        icon: markerIcon(String(seq), '#c9a227'),
        title: `${order.orderNumber} · ${order.customer.name}`,
      }).addTo(layers);
    });

    const path = routePath && routePath.length > 1 ? routePath : [origin, ...displayOrders.map((o) => o.deliveryLocation), origin];
    if (path.length > 1) {
      L.polyline(
        path.map((p) => [p.lat, p.lng] as [number, number]),
        { color: '#0b1f3a', weight: 4, opacity: 0.75 }
      ).addTo(layers);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.18));
    }
  }, [origin, orders, optimizedSequence, routePath]);

  return (
    <div className={cn('relative z-0 isolate h-full min-h-[24rem] w-full overflow-hidden rounded-2xl border border-border md:min-h-[32rem]', className)}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
