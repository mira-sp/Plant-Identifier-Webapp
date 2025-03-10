'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const regionCoordinates = {
  'North America': [50, -100],
  'South America': [-15, -60],
  Europe: [50, 10],
  Africa: [0, 20],
  Asia: [30, 100],
  Australia: [-25, 135]
}

export default function PlantMap({ regions }) {
  if (!regions || regions.length === 0) {
    return <p className="text-gray-500">No native regions available.</p>
  }

  return (
    <MapContainer center={[20, 0]} zoom={2} className="h-64 w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {regions.map((region) => {
        const coords = regionCoordinates[region]
        if (!coords) return null
        return (
          <CircleMarker key={region} center={coords} radius={8} color="green">
            <Popup>{region}</Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
