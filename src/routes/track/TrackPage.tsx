import { useEffect } from "react"

interface TrackPageProps {
  mapsLoaded: boolean
}

export default function TrackPage({ mapsLoaded }: TrackPageProps) {
  useEffect(() => {
    if (!mapsLoaded) return
    if (!window.google || !window.google.maps) return

    const map = new window.google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        center: { lat: 11.5564, lng: 104.9282 }, // Phnom Penh example
        zoom: 12,
      }
    )

    new window.google.maps.Marker({
      position: { lat: 11.5564, lng: 104.9282 },
      map,
      title: "Center Point",
    })
  }, [mapsLoaded])

  return (
    <div
      id="map"
      style={{
        height: "100vh",
        width: "100%",
      }}
    />
  )
}
