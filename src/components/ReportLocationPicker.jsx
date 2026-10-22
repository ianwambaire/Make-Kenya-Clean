import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerUrl from "leaflet/dist/images/marker-icon.png";
import markerRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

const markerIcon = L.icon({
  iconUrl: markerUrl,
  iconRetinaUrl: markerRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function MapSelection({ position, onSelect, disabled }) {
  const map = useMap();
  useMapEvents({ click: (event) => !disabled && onSelect(event.latlng) });

  useEffect(() => {
    if (position) map.panTo(position, { animate: false });
  }, [map, position]);

  return position ? <Marker position={position} icon={markerIcon} title="Selected report location" alt="Selected report location" /> : null;
}

export default function ReportLocationPicker({ latitude, longitude, onSelect, disabled }) {
  const mapRef = useRef(null);
  const hasPosition = latitude !== "" && longitude !== "" &&
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -5 && Number(latitude) <= 5 &&
    Number(longitude) >= 33 && Number(longitude) <= 42;
  const position = hasPosition ? [Number(latitude), Number(longitude)] : null;

  return (
    <div className="report-location-picker">
      <p id="location-map-instructions">Tap a point to place the pin. Tap another point to change it. You can also move the map with the arrow keys and select its centre.</p>
      <MapContainer ref={mapRef} center={position || [-1.2921, 36.8219]} zoom={hasPosition ? 15 : 12} scrollWheelZoom={false} className="report-location-map" aria-label="Choose report location" aria-describedby="location-map-instructions">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapSelection position={position} onSelect={onSelect} disabled={disabled} />
      </MapContainer>
      <button type="button" className="btn secondary-btn" disabled={disabled} onClick={() => {
        const centre = mapRef.current?.getCenter();
        if (centre) onSelect(centre);
      }}>Use map centre</button>
    </div>
  );
}
