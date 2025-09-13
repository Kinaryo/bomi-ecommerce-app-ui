"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export default function ProfileMap({ latitude, longitude, street, houseNumber }) {
  if (!latitude || !longitude) return null;

  const popupText =
    street || houseNumber
      ? `${street || ""} No. ${houseNumber || ""}`
      : "Lokasi utama";

  return (
    <div className="h-64 w-full relative z-0">
      <MapContainer
        center={[parseFloat(latitude), parseFloat(longitude)]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[parseFloat(latitude), parseFloat(longitude)]}>
          <Popup>{popupText}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
