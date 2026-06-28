import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, RotateCcw, Crosshair } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LocationMapPickerProps {
  address: string;
  city: string;
  state: string;
  zip: string;
  onLocationChange?: (lat: number, lng: number) => void;
}

// Leaflet CDN URLs
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded && (window as any).L) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    if ((window as any).L) { leafletLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => { leafletLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch { /* ignore */ }
  return null;
}

export default function LocationMapPicker({ address, city, state, zip, onLocationChange }: LocationMapPickerProps) {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Two modes: 'preview' (Google Maps embed) and 'edit' (Leaflet interactive)
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [leafletReady, setLeafletReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ').trim();
  const hasAddress = Boolean(address.trim() && city.trim());

  // Google Maps embed URL
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Switch to edit mode
  const handleCustomize = () => {
    setMode('edit');
  };

  // Switch back to preview mode — useEffect cleanup handles Leaflet teardown
  const handleBackToPreview = () => {
    setMode('preview');
    setCoords(null);
    setLeafletReady(false);
  };

  // Load Leaflet when switching to edit mode
  useEffect(() => {
    if (mode !== 'edit' || !hasAddress) return;
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch(() => {});
  }, [mode, hasAddress]);

  // Initialize Leaflet map
  useEffect(() => {
    if (mode !== 'edit' || !leafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:44px;position:relative;cursor:grab;">
        <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 28 16 28s16-16 16-28C32 7.2 24.8 0 16 0z" fill="#B88717"/>
          <circle cx="16" cy="16" r="8" fill="#0D0D14"/>
          <circle cx="16" cy="16" r="4" fill="#F6D37A"/>
        </svg>
      </div>`,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });

    const marker = L.marker([39.8283, -98.5795], {
      icon: goldIcon,
      draggable: true,
    });

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      onLocationChange?.(pos.lat, pos.lng);
    });

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      if (!map.hasLayer(marker)) marker.addTo(map);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      onLocationChange?.(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [leafletReady, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Geocode when Leaflet map is ready
  const geocode = useCallback(async () => {
    if (!hasAddress || !mapInstanceRef.current || !markerRef.current) return;
    setLoading(true);
    const result = await geocodeAddress(fullAddress);
    setLoading(false);

    if (result && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      marker.setLatLng([result.lat, result.lng]);
      if (!map.hasLayer(marker)) marker.addTo(map);
      map.setView([result.lat, result.lng], 15, { animate: true });
      setCoords(result);
      onLocationChange?.(result.lat, result.lng);
    }
  }, [fullAddress, hasAddress, onLocationChange]);

  // Auto-geocode on Leaflet init + address change
  useEffect(() => {
    if (mode !== 'edit' || !leafletReady || !hasAddress) return;
    const timer = setTimeout(geocode, 500);
    return () => clearTimeout(timer);
  }, [fullAddress, leafletReady, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasAddress) return null;

  return (
    <div className="mt-4">
      {/* ── Mode: Google Maps Preview (default) ── */}
      {mode === 'preview' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B88717]" />
              <span className="text-[13px] font-semibold text-[#F5F0E6]">
                {t('post.mapPreview')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCustomize}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#B88717]/20 to-emerald-500/10 border border-[#B88717]/30 text-[11px] font-semibold text-[#F6D37A] hover:from-[#B88717]/30 hover:to-emerald-500/20 hover:border-[#F6D37A]/50 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(246,211,122,0.15)]"
            >
              <Crosshair className="w-3 h-3" />
              {t('post.customizePin')}
            </button>
          </div>
          <div
            className="relative rounded-xl overflow-hidden border border-white/[0.085]"
            style={{ height: '280px' }}
          >
            <iframe
              title={`Map preview of ${fullAddress}`}
              src={embedUrl}
              width="100%"
              height="280"
              style={{
                border: 0,
                display: 'block',
                filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)',
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </>
      )}

      {/* ── Mode: Leaflet Interactive (edit pin) ── */}
      {mode === 'edit' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#B88717]" />
              <span className="text-[13px] font-semibold text-[#F5F0E6]">
                {t('post.pinLocation')}
              </span>
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-[#B88717] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {coords && (
                <span className="text-[10px] text-[#7D8291] font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              )}
              <button
                type="button"
                onClick={handleBackToPreview}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#7D8291] hover:text-[#F5F0E6] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {t('post.backToPreview')}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#7D8291] mb-2 leading-relaxed">
            {t('post.mapDragHint')}
          </p>
          <div
            className="relative rounded-xl overflow-hidden border border-[#B88717]/30"
            style={{ height: '300px' }}
          >
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%' }}
            />
            {!leafletReady && (
              <div className="absolute inset-0 bg-[#15151D] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#B88717] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
