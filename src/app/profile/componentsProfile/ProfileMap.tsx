"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * ✅ Atur default marker icon tanpa akses properti private
 */
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface ProfileMapProps {
  /** Latitude dari API atau DB (string atau number) */
  latitude: string | number;
  /** Longitude dari API atau DB (string atau number) */
  longitude: string | number;
  /** Nama jalan (opsional) */
  street?: string;
  /** Nomor rumah (opsional) */
  houseNumber?: string;
}

export default function ProfileMap({
  latitude,
  longitude,
  street,
  houseNumber,
}: ProfileMapProps) {
  // Jika lat/lng kosong, jangan render peta
  if (latitude === undefined || longitude === undefined) return null;

  // Konversi ke number bila masih string
  const latNum = typeof latitude === "number" ? latitude : parseFloat(latitude);
  const lngNum = typeof longitude === "number" ? longitude : parseFloat(longitude);

  // Jika hasil parse bukan angka valid, hentikan render
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null;

  // Teks yang muncul di popup marker
  const popupText =
    street || houseNumber
      ? `${street ?? ""}${street && houseNumber ? " No. " : ""}${houseNumber ?? ""}`
      : "Lokasi utama";

  return (
    <div className="h-64 w-full relative z-0">
      <MapContainer
        center={[latNum, lngNum]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[latNum, lngNum]}>
          <Popup>{popupText}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
