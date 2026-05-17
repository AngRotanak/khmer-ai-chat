import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { db } from '~/lib/firebase'
import { ref, onValue } from 'firebase/database'

import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/dashboard/admin/driver-map')({
  component: DriverActivityMapPage,
})

function DriverActivityMapPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    return onValue(ref(db, 'khmer-ai-chat/users'), (snapshot) => {
      const data = snapshot.val() || {}
      const driverList = Object.entries(data)
        .filter(([_, u]: any) => u.role === 'driver')
        .map(([uid, u]: any) => ({
          id: uid,
          ...u,
          lat: u.lat || 11.5564,
          lng: u.lng || 104.9282,
        }))
      setDrivers(driverList)
    })
  }, [])

  const defaultCenter: LatLngExpression = [11.5564, 104.9282]

  const getStatusIcon = (status: string) => {
    let color = 'blue'
    if (status?.toLowerCase().includes('idle')) color = 'orange'
    if (status?.toLowerCase().includes('delivered')) color = 'green'

    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })
  }

  return (
    <div className="p-6 bg-dark-900 min-h-screen text-light-100">
      <h1 className="text-2xl font-bold mb-6 text-brand-teal">Admin Dashboard</h1>

      <div className={`grid ${fullscreen ? 'grid-cols-1' : 'grid-cols-2 gap-6'} mb-6`}>
        {/* Map */}
        <div className={`${fullscreen ? 'h-screen' : 'h-[500px]'} panel relative`}>
          <MapContainer center={defaultCenter} zoom={13} className="h-full w-full">
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drivers.map((d) => (
              <Marker
                key={d.id}
                position={[d.lat, d.lng] as LatLngExpression}
                icon={getStatusIcon(d.status || '')}
              >
                <Popup>
                  <strong>{d.displayName}</strong><br />
                  {d.email}<br />
                  Status: {d.status || 'Unknown'}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* ✅ Legend */}
          <div className="absolute bottom-4 left-4 bg-dark-800 p-3 rounded shadow text-sm flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span> On the Way
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Idle
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span> Delivered
            </div>
          </div>

          {fullscreen && (
            <>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setFullscreen(false)} className="btn-secondary">Exit Fullscreen</button>
                <button className="btn-secondary">Filter</button>
                <button className="btn-secondary">Refresh</button>
              </div>
              {/* Floating buttons */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6">
                <button className="w-16 h-16 rounded-full bg-brand-teal text-light-100">Deliveries</button>
                <button className="w-16 h-16 rounded-full bg-dark-700 text-light-100">Reports</button>
              </div>
            </>
          )}
        </div>

        {/* Right-hand panel (Collapsed View only) */}
        {!fullscreen && (
          <div className="flex flex-col gap-6">
            <div className="panel">
              <h2 className="font-bold mb-2">Delivery List</h2>
              <ul className="list-disc pl-5">
                <li>#1025 Downtown</li>
                <li>#0235 Bebbuurb</li>
                <li>#0357 Stitt Why</li>
                <li>#0157 Deliverl</li>
              </ul>
            </div>

            <div className="panel">
              <h2 className="font-bold mb-2">Generate Tracking Link</h2>
              <input
                type="text"
                placeholder="Enter Order ID..."
                className="input mb-2 w-full"
              />
              <button className="btn-primary w-full">Create Link</button>
            </div>

            {/* ✅ Reports */}
            <div className="panel">
              <h2 className="font-bold mb-2">Reports</h2>
              <div className="space-y-2 text-sm">
                <p>Total Deliveries Today: <span className="font-bold">24</span></p>
                <p>Completed Deliveries: <span className="font-bold">18</span></p>
                <p>Pending Deliveries: <span className="font-bold">6</span></p>
                <p>Driver Idle Reports: <span className="font-bold">3</span></p>
                <p>Average Delivery Time: <span className="font-bold">32 min</span></p>
              </div>
              <button className="btn-secondary mt-3 w-full">Export Report</button>
            </div>

            {/* ✅ Stats */}
            <div className="panel">
              <h2 className="font-bold mb-2">Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-2 bg-dark-800 rounded">
                  <p className="text-light-300">Active Drivers</p>
                  <p className="text-xl font-bold text-brand-teal">12</p>
                </div>
                <div className="p-2 bg-dark-800 rounded">
                  <p className="text-light-300">Idle Drivers</p>
                  <p className="text-xl font-bold text-orange-500">3</p>
                </div>
                <div className="p-2 bg-dark-800 rounded">
                  <p className="text-light-300">Delivered Orders</p>
                  <p className="text-xl font-bold text-green-500">18</p>
                </div>
                <div className="p-2 bg-dark-800 rounded">
                  <p className="text-light-300">Avg. Distance</p>
                  <p className="text-xl font-bold">12 km</p>
                </div>
              </div>
            </div>

            <button onClick={() => setFullscreen(true)} className="btn-primary w-full">
              Fullscreen Map View
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
