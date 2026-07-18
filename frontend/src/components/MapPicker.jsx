import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red pulsing marker icon for complaint location
const complaintIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Sub-component: click handler to place/move marker
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Sub-component: re-centers map when center prop changes
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

// Sub-component: draggable marker
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDragEnd(latlng.lat, latlng.lng);
      }
    }
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={complaintIcon}
    />
  );
}

/**
 * MapPicker — Interactive Leaflet/OpenStreetMap map component
 * 
 * Props:
 * - center: [lat, lng] — initial center of the map
 * - zoom: number — initial zoom level (default 13)
 * - markerPosition: [lat, lng] | null — current marker position
 * - onLocationSelect: (lat, lng) => void — callback when user clicks map or drags marker
 * - height: string — CSS height value (default '320px')
 */
export default function MapPicker({ 
  center = [26.9124, 75.7873], // Default: Jaipur, Rajasthan
  zoom = 13, 
  markerPosition = null, 
  onLocationSelect, 
  height = '320px' 
}) {
  return (
    <div 
      className="rounded-3 overflow-hidden border shadow-sm position-relative"
      style={{ height, width: '100%' }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {markerPosition && (
          <DraggableMarker 
            position={markerPosition} 
            onDragEnd={onLocationSelect} 
          />
        )}
      </MapContainer>

      {/* Map Attribution Overlay */}
      <div 
        className="position-absolute bottom-0 start-0 w-100 p-2 d-flex justify-content-between align-items-center" 
        style={{ zIndex: 1000, background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' }}
      >
        <span className="badge bg-dark bg-opacity-75 text-white border border-white border-opacity-10 py-1 px-2" style={{ fontSize: '0.58rem' }}>
          <i className="bi bi-map-fill me-1"></i> OpenStreetMap
        </span>
        {markerPosition && (
          <span className="badge bg-success bg-opacity-75 text-white py-1 px-2" style={{ fontSize: '0.58rem' }}>
            <i className="bi bi-geo-alt-fill me-1"></i>
            {markerPosition[0].toFixed(4)}°N, {markerPosition[1].toFixed(4)}°E
          </span>
        )}
      </div>
    </div>
  );
}
