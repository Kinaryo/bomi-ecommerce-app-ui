"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Import JS & CSS geocoder (WAJIB)
import "leaflet-control-geocoder";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

// 🔹 fix default marker icon
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

function LocationMarker({ onChange, lat, lng }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [+lat, +lng] : null
  );

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onChange(lat.toString(), lng.toString());
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          onChange(pos.lat.toString(), pos.lng.toString());
        },
      }}
    />
  ) : null;
}

// 🔎 Geocoder control
function GeocoderControl({ onChange }: { onChange: (lat: string, lng: string) => void }) {
  const map = useMap();

  useEffect(() => {
    const geocoder = (L.Control as any).geocoder({
      defaultMarkGeocode: false,
    })
      .on("markgeocode", (e: any) => {
        const { center } = e.geocode;
        map.setView(center, 15); // zoom lebih dekat
        onChange(center.lat.toString(), center.lng.toString());
      })
      .addTo(map);

    return () => map.removeControl(geocoder);
  }, [map, onChange]);

  return null;
}

// 🔄 Auto center kalau props lat/lng berubah
function RecenterMap({ lat, lng }: { lat: string; lng: string }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([+lat, +lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [defaultCenter] = useState<[number, number]>([-6.2, 106.816666]); // Jakarta default

  return (
    <MapContainer
      center={lat && lng ? [+lat, +lng] : defaultCenter}
      zoom={12}
      scrollWheelZoom
      className="h-64 w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <GeocoderControl onChange={onChange} />
      <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
