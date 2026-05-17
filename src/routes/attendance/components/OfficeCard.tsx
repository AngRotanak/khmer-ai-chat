import { useState, useEffect } from "react"
import LocationPicker from "./LocationPicker"

type OfficeCardProps = {
  officeName: string
  config: {
    gpsRadius?: number | string
    workHours?: { start?: string; end?: string }
    reportFrequency?: string
    requirePhoto?: boolean
    officeLocation?: { lat: number; lng: number }
  }
  updateOffice: (officeName: string, field: string, value: any) => void
  deleteOffice: (officeName: string) => void
}

export function OfficeCard({
  officeName,
  config,
  updateOffice,
  deleteOffice,
}: OfficeCardProps) {
  const [localConfig, setLocalConfig] = useState(config)

  // Sync local state if Firebase updates externally
  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4 border border-gray-700">
      <h2 className="text-teal-400 font-bold text-lg">{officeName}</h2>

      {/* GPS Radius */}
      <input
        type="number"
        placeholder="Enter GPS radius (meters)"
        value={localConfig.gpsRadius ?? ""}
        onChange={(e) =>
          setLocalConfig((prev) => ({
            ...prev,
            gpsRadius: e.target.value === "" ? "" : Number(e.target.value),
          }))
        }
        onBlur={(e) => {
          if (e.target.value !== "") {
            updateOffice(officeName, "gpsRadius", Number(e.target.value))
          }
        }}
        className="w-full p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-teal-500"
      />

      {/* Work Hours */}
      <div className="flex gap-4">
        <input
          type="time"
          value={localConfig.workHours?.start ?? ""}
          onChange={(e) =>
            setLocalConfig((prev) => ({
              ...prev,
              workHours: { ...prev.workHours, start: e.target.value },
            }))
          }
          onBlur={(e) =>
            updateOffice(officeName, "workHours", {
              ...localConfig.workHours,
              start: e.target.value,
            })
          }
          className="p-2 rounded bg-gray-700 text-white flex-1 focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="time"
          value={localConfig.workHours?.end ?? ""}
          onChange={(e) =>
            setLocalConfig((prev) => ({
              ...prev,
              workHours: { ...prev.workHours, end: e.target.value },
            }))
          }
          onBlur={(e) =>
            updateOffice(officeName, "workHours", {
              ...localConfig.workHours,
              end: e.target.value,
            })
          }
          className="p-2 rounded bg-gray-700 text-white flex-1 focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Require Photo */}
      <button
        onClick={() => {
          const newVal = !localConfig.requirePhoto
          setLocalConfig((prev) => ({ ...prev, requirePhoto: newVal }))
          updateOffice(officeName, "requirePhoto", newVal)
        }}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          localConfig.requirePhoto
            ? "bg-teal-600 text-white hover:bg-teal-500"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        {localConfig.requirePhoto ? "📸 Require Photo: Yes" : "📸 Require Photo: No"}
      </button>

      {/* Report Frequency */}
      <select
        value={localConfig.reportFrequency ?? "daily"}
        onChange={(e) => {
          const val = e.target.value
          setLocalConfig((prev) => ({ ...prev, reportFrequency: val }))
          updateOffice(officeName, "reportFrequency", val)
        }}
        className="w-full p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-teal-500"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {/* Location Picker */}
      <LocationPicker
        officeName={officeName}
        config={localConfig}
        updateOffice={(name, field, value) => {
          setLocalConfig((prev) => ({ ...prev, [field]: value }))
          updateOffice(name, field, value)
        }}
      />

      {/* Delete Office */}
      <button
        onClick={() => deleteOffice(officeName)}
        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition"
      >
        🗑 Delete Office
      </button>
    </div>
  )
}
