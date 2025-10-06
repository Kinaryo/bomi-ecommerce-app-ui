"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix default icon (tanpa delete)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface ProfileMapProps {
  latitude: string | number;
  longitude: string | number;
  street?: string;
  houseNumber?: string;
}

export default function ProfileMap({
  latitude,
  longitude,
  street,
  houseNumber,
}: ProfileMapProps) {
  if (!latitude || !longitude) return null;

  const popupText =
    street || houseNumber ? `${street || ""} No. ${houseNumber || ""}` : "Lokasi utama";

  return (
    <div className="h-64 w-full">
      <MapContainer
        center={[parseFloat(latitude as string), parseFloat(longitude as string)]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[parseFloat(latitude as string), parseFloat(longitude as string)]}>
          <Popup>{popupText}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
