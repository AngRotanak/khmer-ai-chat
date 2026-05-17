import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { db } from '~/lib/firebase'
import { ref, onValue } from 'firebase/database'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/dashboard/driver')({
  component: DriverDashboardPage,
})

function DriverDashboardPage() {
  const [eta] = useState('~15 mins')
  const [status, setStatus] = useState('On The Way')
  const [carPos, setCarPos] = useState<LatLngExpression>([11.5620, 104.9300])

  const defaultCenter: LatLngExpression = [11.5564, 104.9282]
  const route: LatLngExpression[] = [
    [11.5564, 104.9282], // start
    carPos,              // car position (dynamic)
    [11.5700, 104.9350], // destination
  ]

  // ✅ Listen to Firebase driver coordinates
  useEffect(() => {
    const unsub = onValue(ref(db, 'khmer-ai-chat/users/driver1'), (snapshot) => {
      const data = snapshot.val()
      if (data?.lat && data?.lng) {
        setCarPos([data.lat, data.lng])
        setStatus(data.status || 'On The Way')
      }
    })
    return () => unsub()
  }, [])

  // ✅ Icons (emoji via divIcon)
  const startIcon = L.divIcon({
    html: '<div style="font-size:28px; color:#ff9800;">📍</div>',
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  })

  const carIcon = L.divIcon({
    html: '<div style="font-size:28px; color:#2196f3;">🚗</div>',
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  })

  const destinationIcon = L.divIcon({
    html: '<div style="font-size:28px; color:#4caf50;">✅</div>',
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  })

  return (
    <div className="bg-dark-900 min-h-screen text-light-100 flex flex-col">
      {/* Header + ETA */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-brand-teal">Delivery Tracking</h1>
        <div className="flex justify-between text-sm mt-2">
          <span>ETA: {eta}</span>
          <span>Status: {status}</span>
        </div>
        <div className="w-full bg-dark-700 h-2 rounded mt-2">
          <div className="bg-brand-teal h-2 rounded" style={{ width: '60%' }}></div>
        </div>
      </div>

      {/* Map */}
      <div className="relative p-4">
        <MapContainer center={defaultCenter} zoom={13} className="w-full h-[400px]">
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={route} color="blue" />
          <Marker position={route[0]} icon={startIcon} />
          <Marker position={carPos} icon={carIcon} /> {/* 🚗 updates live */}
          <Marker position={route[2]} icon={destinationIcon} />
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <button className="btn-secondary">📷</button>
          <button className="btn-secondary">💬</button>
          <button className="btn-secondary">📞</button>
        </div>
      </div>

      {/* Proof of Delivery + Footer */}
      <div className="p-4">
        <button className="btn-primary w-full">Proof of Delivery</button>
        <p className="text-center text-brand-teal font-bold mt-2">Arriving Soon!</p>
      </div>
    </div>
  )
}
