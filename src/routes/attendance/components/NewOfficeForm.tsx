import LocationPicker from "./LocationPicker"

type NewOfficeFormProps = {
  newOffice: {
    officeName: string
    gpsRadius: number
    workHours: { start: string; end: string }
    reportFrequency: string
    requirePhoto: boolean
    officeLocation: { lat: number; lng: number }
  }
  setNewOffice: React.Dispatch<React.SetStateAction<any>>
  saveNewOffice: () => void
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewOfficeForm({
  newOffice,
  setNewOffice,
  saveNewOffice,
  setShowForm,
}: NewOfficeFormProps) {
  return (
    <div className="bg-gray-900 p-6 rounded-lg space-y-4 shadow-lg">
      {/* Office Name */}
      <input
        type="text"
        placeholder="Office Name"
        value={newOffice.officeName}
        onChange={(e) => setNewOffice({ ...newOffice, officeName: e.target.value })}
        className="w-full p-2 rounded bg-gray-800 text-white focus:ring-2 focus:ring-teal-500"
      />

      {/* GPS Radius */}
      <input
        type="number"
        placeholder="Enter GPS radius (meters)"
        value={newOffice.gpsRadius}
        onChange={(e) => setNewOffice({ ...newOffice, gpsRadius: parseInt(e.target.value) })}
        className="w-full p-2 rounded bg-gray-800 text-white focus:ring-2 focus:ring-teal-500"
      />

      {/* Work Hours */}
      <div className="flex gap-4">
        <input
          type="time"
          value={newOffice.workHours.start || ""}
          onChange={(e) =>
            setNewOffice({
              ...newOffice,
              workHours: { ...newOffice.workHours, start: e.target.value || "" },
            })
          }
          className="p-2 rounded bg-gray-800 text-white flex-1 focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="time"
          value={newOffice.workHours.end || ""}
          onChange={(e) =>
            setNewOffice({
              ...newOffice,
              workHours: { ...newOffice.workHours, end: e.target.value || "" },
            })
          }
          className="p-2 rounded bg-gray-800 text-white flex-1 focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Report Frequency */}
      <select
        value={newOffice.reportFrequency}
        onChange={(e) => setNewOffice({ ...newOffice, reportFrequency: e.target.value })}
        className="w-full p-2 rounded bg-gray-800 text-white focus:ring-2 focus:ring-teal-500"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {/* Require Photo */}
      <button
        onClick={() => setNewOffice({ ...newOffice, requirePhoto: !newOffice.requirePhoto })}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          newOffice.requirePhoto
            ? "bg-teal-600 text-white hover:bg-teal-500"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        {newOffice.requirePhoto ? "📸 Require Photo: Yes" : "📸 Require Photo: No"}
      </button>

      {/* Pin Picker */}
      <LocationPicker
        officeName={newOffice.officeName || "new"}
        config={newOffice}
        updateOffice={(_, field, value) =>
          setNewOffice({ ...newOffice, [field]: value })
        }
      />

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={saveNewOffice}
          className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition"
        >
          💾 Save Office
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
        >
          ✖ Cancel
        </button>
      </div>
    </div>
  )
}
