import { useEffect, useState, useRef } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { db } from '~/lib/firebase'
import { ref, onValue } from 'firebase/database'
import { useLoadGoogleMaps } from '~/lib/useLoadGoogleMaps'

interface DeliveryPoint {
    lat: number
    lon: number
    customer?: string
    address?: string
    status?: string
    eta?: string
}

export const Route = createFileRoute('/track/$tracking_id')({
    component: TrackPage,
})

interface StopMarker {
    marker: google.maps.Marker
    infoWindow: google.maps.InfoWindow
}

function TrackPage() {
    const { tracking_id } = useParams({ from: '/track/$tracking_id' })
    const mapsLoaded = useLoadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_KEY!)

    const [points, setPoints] = useState<DeliveryPoint[]>([])
    const [progress, setProgress] = useState(0)
    const [eta, setEta] = useState<string>('Calculating...')
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [stopMarkers, setStopMarkers] = useState<StopMarker[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const driverMarkerRef = useRef<google.maps.Marker | null>(null)
    const [lastSeen, setLastSeen] = useState<string>("")

    // ✅ Session listener (unchanged)
    useEffect(() => {
        const q = ref(db, `khmer-autobot/delivery/${tracking_id}/session`)
        return onValue(q, (snapshot) => {
            const session = snapshot.val()
            if (session) {
                const pts = Array.isArray(session.points) ? session.points : []
                setPoints(pts)
                const completed = pts.filter((p: DeliveryPoint) => p.status === 'Delivered').length
                const total = pts.length
                setProgress(total ? Math.round((completed / total) * 100) : 0)
                setEta(session.eta || pts[pts.length - 1]?.eta || 'Unknown')
            } else {
                setPoints([])
                setProgress(0)
                setEta('Unknown')
            }
        })
    }, [tracking_id])
    // ✅ Initialize map only when API is ready
    useEffect(() => {
        if (!mapsLoaded || map) return
        const gmap = new window.google.maps.Map(document.getElementById("map")!, {
            zoom: 14,
            center: { lat: 0, lng: 0 }, // temporary center
        })
        setMap(gmap)
    }, [mapsLoaded, map])

    // ✅ Live driver location listener
    useEffect(() => {
        if (!mapsLoaded || !map) return
        const q = ref(db, `khmer-autobot/delivery/${tracking_id}/current_location`)
        return onValue(q, (snapshot) => {
            const loc = snapshot.val()
            if (!loc) return
            const pos = new google.maps.LatLng(loc.lat, loc.lon)

            if (!driverMarkerRef.current) {
                driverMarkerRef.current = new google.maps.Marker({
                    position: pos,
                    map,
                    icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    title: "Driver",
                })
            } else {
                driverMarkerRef.current.setPosition(pos)
            }
            map.panTo(pos)
            setLastSeen(loc.time)
        })
    }, [mapsLoaded, map, tracking_id])

    // ✅ Stops + route rendering
    useEffect(() => {
        if (!mapsLoaded || !map || !points.length) return

        const directionsService = new google.maps.DirectionsService()
        const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
        })

        directionsService.route(
            {
                origin: { lat: points[0].lat, lng: points[0].lon },
                destination: { lat: points[points.length - 1].lat, lng: points[points.length - 1].lon },
                waypoints: points.slice(1, -1).map(p => ({
                    location: { lat: p.lat, lng: p.lon },
                    stopover: true,
                })),
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    directionsRenderer.setDirections(result)
                }
            }
        )

        const newStopMarkers: StopMarker[] = []

        points.forEach((p, idx) => {
            const iconUrl =
                idx === 0
                    ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : idx === points.length - 1
                        ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'

            const marker = new google.maps.Marker({
                position: { lat: p.lat, lng: p.lon },
                map,
                icon: iconUrl,
                title: idx === 0 ? 'Start' : idx === points.length - 1 ? 'Current' : `Stop ${idx}`,
            })

            const infoWindow = new google.maps.InfoWindow({
                content: `
          <div style="font-weight:600; color:#009CA6;">Stop ${idx}</div>
          <div>${p.customer || "Unknown customer"}</div>
          <div>${p.address || "Unknown address"}</div>
          <div>Status: ${p.status || "Not Started"}</div>
          <div>ETA: ${p.eta || "Unknown"}</div>
        `,
            })

            marker.addListener('click', () => {
                newStopMarkers.forEach(sm => sm.infoWindow.close())
                infoWindow.open(map, marker)
            })

            newStopMarkers.push({ marker, infoWindow })
        })

        setStopMarkers(newStopMarkers)

        return () => {
            newStopMarkers.forEach(sm => sm.marker.setMap(null))
            directionsRenderer.setMap(null)
        }
     }, [mapsLoaded, points, map])

    const handleStopClick = (idx: number) => {
        if (!map || !stopMarkers[idx]) return
        const { marker, infoWindow } = stopMarkers[idx]
        map.panTo(marker.getPosition()!)
        map.setZoom(15)
        stopMarkers.forEach(sm => sm.infoWindow.close())
        infoWindow.open(map, marker)
    }


    return (
        <HelmetProvider>
            <Helmet>
                <title>Tracking {tracking_id} | KhmerAi.Chat</title>
            </Helmet>

            <div className="flex h-screen">
                <aside
                    className={`fixed md:static bottom-0 md:bottom-auto left-0 h-2/3 md:h-auto w-full md:w-80 
        bg-gray-100 dark:bg-dark-800 p-4 overflow-y-auto transform transition-transform duration-300 z-10
        ${sidebarOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}`}
                >
                    <h2 className="font-bold text-lg mb-2">Stops</h2>
                    <div className="mb-4">
                        <div className="h-2 bg-gray-300 rounded">
                            <div
                                className="h-2 bg-teal-500 rounded"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-sm mt-1">
                            Progress: {progress}% | ETA: {eta}
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {points.map((p, idx) => (
                            <li
                                key={idx}
                                onClick={() => handleStopClick(idx)}
                                className="flex justify-between items-center p-2 bg-white rounded shadow-sm cursor-pointer hover:bg-teal-50"
                            >
                                <div>
                                    <div className="font-semibold">
                                        {idx === 0
                                            ? "Start"
                                            : idx === points.length - 1
                                                ? "Current"
                                                : `Stop ${idx}`}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {p.address || "Unknown address"}
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded ${p.status === "Delivered"
                                        ? "bg-green-200 text-green-800"
                                        : p.status === "In Progress"
                                            ? "bg-yellow-200 text-yellow-800"
                                            : "bg-gray-200 text-gray-800"
                                        }`}
                                >
                                    {p.status || "Not Started"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="flex-grow relative">
                    <div id="map" className="h-full w-full"></div>

                    {/* ✅ Show loading until API is ready */}
                    {!mapsLoaded && (
                        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
                            Loading Google Maps…
                        </div>
                    )}

                    {/* ✅ Driver last seen overlay */}
                    {lastSeen && (
                        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-xs">
                            Driver last seen: {lastSeen}
                        </div>
                    )}
                </main>

                <button
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 md:hidden bg-teal-600 text-white px-4 py-2 rounded shadow"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? "Hide Stops" : "Show Stops"}
                </button>
            </div>
        </HelmetProvider>
    )
    
}

export default TrackPage
