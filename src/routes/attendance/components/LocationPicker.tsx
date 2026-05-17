 import { GoogleMap, Marker, Circle, useLoadScript } from "@react-google-maps/api"

 // ✅ Location Picker
  interface LocationPickerProps {
    officeName: string
    config: any
    updateOffice: (officeName: string, field: string, value: any) => void
  }

export default function LocationPicker({ officeName, config, updateOffice }: LocationPickerProps) {
    const { isLoaded } = useLoadScript({
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    })

    if (!isLoaded) return <p>Loading map...</p>

    const center = {
      lat: config.officeLocation?.lat ?? 13.3633,
      lng: config.officeLocation?.lng ?? 103.8564,
    }

    const setCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            updateOffice(officeName, "officeLocation", { lat, lng })
          },
          (err) => {
            console.error("❌ Error getting location:", err)
            alert("Unable to fetch current location. Please allow GPS access.")
          }
        )
      } else {
        alert("Geolocation is not supported in this browser.")
      }
    }

    return (
      <div className="space-y-2">
        <GoogleMap
          zoom={14}
          center={center}
          mapContainerStyle={{ width: "100%", height: "300px" }}
          onClick={(e) =>
            updateOffice(officeName, "officeLocation", {
              lat: e.latLng?.lat(),
              lng: e.latLng?.lng(),
            })
          }
        >
          {config.officeLocation?.lat && config.officeLocation?.lng && (
            <>
              <Marker
                position={config.officeLocation}
                draggable={true}
                onDragEnd={(e) =>
                  updateOffice(officeName, "officeLocation", {
                    lat: e.latLng?.lat(),
                    lng: e.latLng?.lng(),
                  })
                }
              />
              <Circle
                center={config.officeLocation}
                radius={config.gpsRadius ?? 0}
                options={{
                  strokeColor: "#00ffff",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "#00ffff",
                  fillOpacity: 0.2,
                }}
              />
            </>
          )}
        </GoogleMap>

        {/* ✅ Live coordinates display */}
        {config.officeLocation?.lat && config.officeLocation?.lng && (
          <p className="text-sm text-gray-300">
            📍 Selected Location: Lat {config.officeLocation.lat.toFixed(6)}, Lng{" "}
            {config.officeLocation.lng.toFixed(6)}
          </p>
        )}

        {/* ✅ Use My Location button */}
        <button
          onClick={setCurrentLocation}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Use My Current Location
        </button>
      </div>
    )
  }
