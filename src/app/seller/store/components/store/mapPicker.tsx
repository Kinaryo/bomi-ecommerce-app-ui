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
          const marker = e.target as L.Marker;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          onChange(pos.lat.toString(), pos.lng.toString());
        },
      }}
    />
  ) : null;
}

// 🔎 Geocoder control tanpa any
interface MarkGeocodeEvent {
  geocode: {
    center: L.LatLng;
  };
}
function GeocoderControl({
  onChange,
}: {
  onChange: (lat: string, lng: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // tipekan geocoder ke L.Control.GeocoderObject
    const geocoder: L.Control = (L.Control as unknown as {
      geocoder: (options: Record<string, unknown>) => L.Control;
    }).geocoder({
      defaultMarkGeocode: false,
    });

    const handler = (e: MarkGeocodeEvent) => {
      const { center } = e.geocode;
      map.setView(center, 15); // zoom lebih dekat
      onChange(center.lat.toString(), center.lng.toString());
    };

    // @ts-expect-error: event bawaan leaflet-control-geocoder belum punya tipe resmi
    geocoder.on("markgeocode", handler);

    map.addControl(geocoder);

    return () => {
      // bersihkan handler dan control
      // @ts-expect-error: event bawaan
      geocoder.off("markgeocode", handler);
      map.removeControl(geocoder);
    };
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
