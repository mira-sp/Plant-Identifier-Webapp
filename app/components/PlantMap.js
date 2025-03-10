'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamisch laden, um SSR zu deaktivieren
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const regionCoordinates = {
  'North America': [50, -100],
  'South America': [-15, -60],
  Europe: [50, 10],
  Africa: [0, 20],
  Asia: [30, 100],
  Australia: [-25, 135]
};

export default function PlantMap({ regions }) {
  if (!regions || regions.length === 0) {
    return <p className="text-gray-500">No native regions available.</p>;
  }

  return (
    <MapContainer center={[20, 0]} zoom={2} className="h-64 w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {regions.map((region) => {
        const coords = regionCoordinates[region];
        if (!coords) return null;
        return (
          <CircleMarker key={region} center={coords} radius={8} color="green">
            <Popup>{region}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
