import { useEffect, useState, useRef } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { db } from '~/lib/firebase'
import { ref, onValue } from "firebase/database"

import { useLoadGoogleMaps } from '~/lib/useLoadGoogleMaps'
import { QRCodeCanvas } from "qrcode.react"


import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { ref as dbRef, push, set } from "firebase/database"
import { app } from "~/lib/firebase" // your firebase app instance

// Utility: animate marker smoothly
function animateMarker(marker: google.maps.Marker, newPos: google.maps.LatLng, duration = 1000) {
  const oldPos = marker.getPosition()
  if (!oldPos) {
    marker.setPosition(newPos)
    return
  }
  const oldLat = oldPos.lat()
  const oldLng = oldPos.lng()
  const newLat = newPos.lat()
  const newLng = newPos.lng()
  const deltaLat = newLat - oldLat
  const deltaLng = newLng - oldLng
  let start: number | null = null
  function step(timestamp: number) {
    if (!start) start = timestamp
    const progress = Math.min((timestamp - start) / duration, 1)
    const lat = oldLat + deltaLat * progress
    const lng = oldLng + deltaLng * progress
    marker.setPosition(new google.maps.LatLng(lat, lng))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Utility: haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const Route = createFileRoute('/track/$tracking_id')({
  component: TrackPage,
})

function TrackPage() {
  const { tracking_id } = useParams({ from: '/track/$tracking_id' })
  const mapsLoaded = useLoadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_KEY!)

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null)
  const [destination, setDestination] = useState<{ lat: number, lon: number } | null>(null)
  const [lastSeen, setLastSeen] = useState<string>("")
  const [eta, setEta] = useState<string>("On the way…")
  const [speed, setSpeed] = useState<string>("")
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const storage = getStorage(app)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'options' | 'chat'>('options')

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")


  const [driverLat, setDriverLat] = useState<number | null>(null)
  const [driverLng, setDriverLng] = useState<number | null>(null)
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)
  const [etaDistance, setEtaDistance] = useState<number | null>(null)



  // Track last driver position/time for speed calc
  const lastDriverPos = useRef<{ lat: number, lon: number, time: number } | null>(null)

  const [sessionStatus, setSessionStatus] = useState<string>("")

  // ✅ Listen to session status
  useEffect(() => {
    const q = ref(db, `public_tracking/${tracking_id}/session`)
    return onValue(q, (snapshot) => {
      const session = snapshot.val()
      if (session?.status) {
        setSessionStatus(session.status)
      }
    })
  }, [tracking_id])

  useEffect(() => {
    const q = ref(db, `public_tracking/${tracking_id}/chat`)
    return onValue(q, (snapshot) => {
      const msgs = snapshot.val()
      if (msgs) {
        setMessages(Object.values(msgs))
      }
    })
  }, [tracking_id])

  // ✅ Initialize map
  useEffect(() => {
    if (!mapsLoaded || map) return
    const gmap = new window.google.maps.Map(document.getElementById("map")!, {
      zoom: 14,
      center: { lat: 0, lng: 0 },
    })
    setMap(gmap)
    polylineRef.current = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map: gmap,
    })
  }, [mapsLoaded, map])

  // ✅ Listen to driver location
  useEffect(() => {
    if (!mapsLoaded || !map) return
    const q = ref(db, `public_tracking/${tracking_id}/current_location`)
    return onValue(q, (snapshot) => {
      const loc = snapshot.val()
      if (!loc) return
      const pos = new google.maps.LatLng(loc.lat, loc.lon)

      // ✅ Save driver coordinates in state
      setDriverLat(loc.lat)
      setDriverLng(loc.lon)

      // Driver marker logic
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new google.maps.Marker({
          position: pos,
          map,
          icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          title: "Driver",
        })
      } else {
        animateMarker(driverMarkerRef.current, pos)
      }

      // Trail polyline
      if (polylineRef.current) {
        const path = polylineRef.current.getPath()
        path.push(pos)
      }

      map.panTo(pos)
      setLastSeen(loc.time)

      // Speed calculation
      const now = Date.parse(loc.time)
      if (lastDriverPos.current) {
        const dtHours = (now - lastDriverPos.current.time) / (1000 * 60 * 60)
        const distKm = haversine(lastDriverPos.current.lat, lastDriverPos.current.lon, loc.lat, loc.lon)
        if (dtHours > 0 && distKm > 0.01) {
          const spd = distKm / dtHours
          setSpeed(`Speed ~${spd.toFixed(1)} km/h`)
        }
      }
      lastDriverPos.current = { lat: loc.lat, lon: loc.lon, time: now }

      // ✅ ETA + distance check
      if (destination) {
        // Save destination coordinates in state
        setDestLat(destination.lat)
        setDestLng(destination.lon)

        const service = new google.maps.DistanceMatrixService()
        service.getDistanceMatrix(
          {
            origins: [pos],
            destinations: [new google.maps.LatLng(destination.lat, destination.lon)],
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
            try {
              if (status !== "OK" || !response) {
                setEta("ETA unavailable")
                return
              }
              const elements = response.rows[0].elements
              if (!elements?.length || elements[0].status !== "OK") {
                setEta("ETA unavailable")
                return
              }

              const distText = elements[0].distance?.text ?? "Unknown"
              const durText = elements[0].duration?.text ?? "Unknown"
              setEta(`~${durText} (${distText} away)`)

              // ✅ Numeric distance in meters
              const distMeters = elements[0].distance?.value
              if (distMeters && distMeters < 500) {
                triggerArrivalNotification()
              }
            } catch (err) {
              console.error("DistanceMatrix error:", err)
              setEta("ETA unavailable")
            }
          }
        )
      }
    })
  }, [mapsLoaded, map, tracking_id, destination])


  // ✅ Listen to destination
  useEffect(() => {
    const q = ref(db, `public_tracking/${tracking_id}/session`)
    return onValue(q, (snapshot) => {
      const session = snapshot.val()
      if (session?.destination?.lat && session?.destination?.lon) {
        setDestination({ lat: session.destination.lat, lon: session.destination.lon })
      }
    })
  }, [tracking_id])

  // ✅ Place destination marker
  useEffect(() => {
    if (!mapsLoaded || !map || !destination) return
    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lon },
        map,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        title: "Destination",
      })
    } else {
      destinationMarkerRef.current.setPosition({ lat: destination.lat, lng: destination.lon })
    }
  }, [mapsLoaded, map, destination])

  // ✅ Draw route line
  useEffect(() => {
    if (!mapsLoaded || !map || !destination || !driverMarkerRef.current) return
    const directionsService = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({ map })

    directionsService.route(
      {
        origin: driverMarkerRef.current.getPosition()!,
        destination: { lat: destination.lat, lng: destination.lon },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result)
        }
      }
    )
  }, [mapsLoaded, map, destination, driverMarkerRef.current])


  function sendTextMessage() {
    if (!newMessage.trim()) return
    const msgRef = push(ref(db, `public_tracking/${tracking_id}/chat`))
    const newMsg = {
      sender: "customer",
      type: "text",
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }
    set(msgRef, newMsg)
    setNewMessage("")
  }


  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" })
      const voiceRef = storageRef(storage, `chat/${tracking_id}/voice_${Date.now()}.webm`)
      await uploadBytes(voiceRef, blob)
      const url = await getDownloadURL(voiceRef)

      // Save message in Realtime DB
      const msgRef = push(dbRef(db, `public_tracking/${tracking_id}/chat`))
      await set(msgRef, {
        sender: "customer",
        type: "voice",
        content: url,
        timestamp: new Date().toISOString(),
      })
    }

    recorder.start()
    setTimeout(() => recorder.stop(), 5000) // record 5s demo
  }


  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Upload to Firebase Storage
    const imgRef = storageRef(storage, `chat/${tracking_id}/${Date.now()}_${file.name}`)
    await uploadBytes(imgRef, file)
    const url = await getDownloadURL(imgRef)

    // Save message in Realtime DB
    const msgRef = push(dbRef(db, `public_tracking/${tracking_id}/chat`))
    await set(msgRef, {
      sender: "customer",
      type: "image",
      content: url,
      timestamp: new Date().toISOString(),
    })
  }

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000 // meters
    const toRad = (deg: number) => deg * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    if (!mapsLoaded || !map || !driverLat || !driverLng || !destLat || !destLng) return

    const pos = new google.maps.LatLng(driverLat, driverLng)
    const service = new google.maps.DistanceMatrixService()

    service.getDistanceMatrix(
      {
        origins: [pos],
        destinations: [new google.maps.LatLng(destLat, destLng)],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status !== "OK" || !response) {
          setEta("ETA unavailable")
          return
        }
        const elements = response.rows[0].elements
        if (!elements?.length || elements[0].status !== "OK") {
          setEta("ETA unavailable")
          return
        }

        const distText = elements[0].distance?.text ?? "Unknown"
        const durText = elements[0].duration?.text ?? "Unknown"
        setEta(`~${durText} (${distText} away)`)

        // ✅ Numeric distance in meters
        const distMeters = elements[0].distance?.value
        setEtaDistance(distMeters)

        if (distMeters && distMeters < 500) {
          triggerArrivalNotification()
        }
      }
    )
  }, [mapsLoaded, map, driverLat, driverLng, destLat, destLng])


  useEffect(() => {
    if (driverLat && driverLng && destLat && destLng) {
      const distance = haversineDistance(driverLat, driverLng, destLat, destLng)
      setEtaDistance(distance)
    }
  }, [driverLat, driverLng, destLat, destLng])


  useEffect(() => {
    if (etaDistance !== null && etaDistance < 500) { // less than 500m
      triggerArrivalNotification()
    }
  }, [etaDistance])

  function playRingTone() {
    const audio = new Audio("/ringtone.mp3") // served from public/
    audio.play().catch(err => console.error("Audio play failed:", err))
  }

  function triggerArrivalNotification() {
    if (Notification.permission === "granted") {
      new Notification("Driver is nearly here!", {
        body: "Please get ready to receive your delivery.",
        icon: "/delivery_icon.png", // also in public/
      })
      playRingTone()
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          triggerArrivalNotification()
        }
      })
    }
  }



  return (
    <HelmetProvider>
      <Helmet>
        <title>Tracking {tracking_id} | KhmerAi.Chat</title>
      </Helmet>

      <main className="flex-grow relative h-screen">
        <div id="map" className="h-full w-full"></div>

        {!mapsLoaded && (
          <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
            Loading Google Maps…
          </div>
        )}

        {/* ✅ Customer overlay */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-60 p-3 rounded shadow text-sm space-y-2 w-[250px] text-black">
          <div className="font-semibold text-teal-400">Driver is on the way</div>
          <div>ETA: {eta}</div>
          {speed && <div>{speed}</div>}
          {lastSeen && <div>Last seen: {lastSeen}</div>}

          {/* Progress bar */}
          <div className="w-full bg-gray-700 h-2 rounded">
            <div
              className="bg-teal-500 h-2 rounded"
              style={{ width: eta.includes("min") ? "60%" : "30%" }}
            ></div>
          </div>

          {/* Status badge */}
          {sessionStatus && (
            <span
              className={`px-2 py-1 text-xs rounded ${sessionStatus === "Delivered"
                  ? "bg-green-600 text-white"
                  : sessionStatus === "In Progress"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-500 text-white"
                }`}
            >
              {sessionStatus}
            </span>
          )}

          {/* Drawer toggle */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setDrawerMode("options")
                setDrawerOpen(true)
              }}
              className="flex-1 px-3 py-1 bg-black bg-opacity-70 text-teal-400 text-xs rounded shadow hover:bg-teal-700 hover:text-white"
            >
              Options
            </button>
            <button
              onClick={() => {
                setDrawerMode("chat")
                setDrawerOpen(true)
              }}
              className="flex-1 px-3 py-1 bg-black bg-opacity-70 text-teal-400 text-xs rounded shadow hover:bg-teal-700 hover:text-white"
            >
              Chat
            </button>
          </div>
        </div>


        {/* ✅ Unified Drawer */}
        {drawerOpen && (
          <div className="absolute bottom-0 left-0 w-full bg-black text-teal-400 shadow-lg p-4 rounded-t-lg h-1/2 flex flex-col">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">
                {drawerMode === "options" ? "Delivery Options" : "Chat with Driver"}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                ✕
              </button>
            </div>

            {drawerMode === "options" && (
              <>
                {/* Share Tracking */}
                <button
                  onClick={() => {
                    const link = `https://www.khmerai.chat/track/${tracking_id}`
                    if (navigator.share) {
                      navigator.share({
                        title: "Delivery Tracking",
                        text: "Track your delivery in real time",
                        url: link,
                      })
                    } else {
                      navigator.clipboard.writeText(link)
                      alert("Tracking link copied to clipboard!")
                    }
                  }}
                  className="mb-2 px-3 py-1 bg-teal-500 text-white text-xs rounded shadow hover:bg-teal-600"
                >
                  Share Tracking
                </button>

                {/* QR Code */}
                <div className="mb-2 flex justify-center bg-white p-2 rounded">
                  <QRCodeCanvas
                    value={`https://www.khmerai.chat/track/${tracking_id}`}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </>
            )}

            {drawerMode === "chat" && (
              <>
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto border border-teal-500 p-2 rounded mb-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-1 ${msg.sender === "customer" ? "text-right" : "text-left"
                        }`}
                    >
                      <span className="inline-block px-2 py-1 rounded bg-gray-800 text-white">
                        {msg.type === "text" && msg.content}
                        {msg.type === "image" && (
                          <img src={msg.content} alt="sent" className="max-w-[150px]" />
                        )}
                        {msg.type === "voice" && (
                          <audio controls src={msg.content}></audio>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Input controls */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-teal-500 rounded px-2 py-1 bg-gray-900 text-white"
                  />
                  <button
                    onClick={sendTextMessage}
                    className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600"
                  >
                    Send
                  </button>
                  <label
                    htmlFor="imageInput"
                    className="px-3 py-1 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600"
                  >
                    📷
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageInput"
                  />
                  <button
                    onClick={startRecording}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    🎤
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </HelmetProvider>
  )
}

export default TrackPage
