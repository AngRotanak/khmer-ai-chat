import { useState, useEffect } from "react"
import { ref, onValue, update, set, remove, push } from "firebase/database"
import { db } from "~/lib/firebase"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { OfficeCard } from "../components/OfficeCard"
import { NewOfficeForm } from "../components/NewOfficeForm"
import { AdminLayout } from "../components/AdminLayout"
import { getGroupId } from "../components/utils/telegram"

export const Route = createFileRoute("/attendance/admin/config")({
  component: AttendanceConfigPage,
  validateSearch: z.object({
    group_id: z.string().optional(),
  }),
})

function AttendanceConfigPage() {
  const groupId = getGroupId()
  const [offices, setOffices] = useState<Record<string, any>>({})
  const [showForm, setShowForm] = useState(false)
  const [newOffice, setNewOffice] = useState({
    officeName: "",
    gpsRadius: 200,
    workHours: { start: "08:00", end: "17:00" },
    reportFrequency: "daily",
    requirePhoto: false,
    officeLocation: { lat: 13.3633, lng: 103.8564 },
  })

  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [newReason, setNewReason] = useState("")

  // ✅ Load reasons
  useEffect(() => {
    if (!groupId) return
    const reasonsPath = `khmer-autobot/attendance_config/${groupId}/reasons`
    const reasonsRef = ref(db, reasonsPath)

    onValue(reasonsRef, async (snapshot) => {
      const data = snapshot.val() || {}
      setReasons(data)

      try {
        await push(ref(db, `logs/webapp/${groupId}`), {
          type: "reasons_snapshot",
          groupId,
          path: reasonsPath,
          exists: snapshot.exists(),
          keys: Object.keys(data),
          raw: data,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Firebase log error:", err)
      }
    })
  }, [groupId])

  // ✅ Add reason
  const addReason = async () => {
    if (!newReason.trim()) return
    const key = newReason.toLowerCase().replace(/\s+/g, "_")
    await set(ref(db, `khmer-autobot/attendance_config/${groupId}/reasons/${key}`), newReason)
    setNewReason("")
  }

  // ✅ Delete reason
  const deleteReason = async (key: string) => {
    if (!groupId) return
    if (confirm(`Delete reason "${reasons[key]}"?`)) {
      await remove(ref(db, `khmer-autobot/attendance_config/${groupId}/reasons/${key}`))
    }
  }


  // ✅ Load offices
  useEffect(() => {
    if (!groupId) return
    const officesPath = `khmer-autobot/attendance_config/${groupId}/offices`
    const officesRef = ref(db, officesPath)

    onValue(officesRef, async (snapshot) => {
      const data = snapshot.val() || {}
      setOffices(data)

      try {
        await push(ref(db, `logs/webapp/${groupId}`), {
          type: "offices_snapshot",
          groupId,
          path: officesPath,
          exists: snapshot.exists(),
          keys: Object.keys(data),
          raw: data,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Firebase log error:", err)
      }
    })
  }, [groupId])

  // ✅ Update office
  const updateOffice = (officeName: string, field: string, value: any) => {
    if (!groupId) return
    const officeRef = ref(db, `khmer-autobot/attendance_config/${groupId}/offices/${officeName}`)
    update(officeRef, {
      [field]: value,
      lastUpdated: new Date().toISOString(),
      updatedBy: "angrotanak",
    })
  }

  // ✅ Save new office
  const saveNewOffice = () => {
    if (!groupId || !newOffice.officeName.trim()) return
    const officeRef = ref(db, `khmer-autobot/attendance_config/${groupId}/offices/${newOffice.officeName}`)
    set(officeRef, {
      ...newOffice,
      lastUpdated: new Date().toISOString(),
      updatedBy: "angrotanak",
    })
    setShowForm(false)
    setNewOffice({
      officeName: "",
      gpsRadius: 200,
      workHours: { start: "08:00", end: "17:00" },
      reportFrequency: "daily",
      requirePhoto: false,
      officeLocation: { lat: 13.3633, lng: 103.8564 },
    })
  }

  // ✅ Delete office
  const deleteOffice = (officeName: string) => {
    if (!groupId) return
    if (confirm(`Are you sure you want to delete office "${officeName}"?`)) {
      const officeRef = ref(db, `khmer-autobot/attendance_config/${groupId}/offices/${officeName}`)
      remove(officeRef)
    }
  }


  return (
    <AdminLayout title="🏢 Office Config">
      {/* Create Office Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition"
        >
          ➕ Create Office
        </button>
      )}

      {/* New Office Form */}
      {showForm && (
        <NewOfficeForm
          newOffice={newOffice}
          setNewOffice={setNewOffice}
          saveNewOffice={saveNewOffice}
          setShowForm={setShowForm}
        />
      )}

      {/* Office Cards */}
      {Object.entries(offices).length === 0 ? (
        <p className="text-gray-400">No offices found for group {groupId}</p>
      ) : (
        Object.entries(offices).map(([officeName, config]) => (
          <OfficeCard
            key={officeName}
            officeName={config.officeName}   // ✅ use field, not key
            config={config}
            updateOffice={updateOffice}
            deleteOffice={deleteOffice}
          />
        ))
      )}

      {/* 🔹 Manage Reasons */}
      <div className="mt-8 p-4 rounded-lg bg-gray-800 border border-teal-500 space-y-3">
        <h4 className="text-teal-400 font-semibold">⚙️ Manage Reasons</h4>
        <ul className="space-y-2">
          {Object.entries(reasons).map(([key, label]) => (
            <li
              key={key}
              className="flex justify-between items-center text-sm bg-gray-700 rounded px-3 py-2"
            >
              <span>{label}</span>
              <button
                onClick={() => deleteReason(key)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                ❌ Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Enter new reason..."
            className="flex-1 p-2 rounded text-sm bg-gray-700 text-white"
          />
          <button
            onClick={addReason}
            className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-400 text-sm"
          >
            ➕ Add
          </button>
        </div>
      </div>
    </AdminLayout>
  )

}

export default AttendanceConfigPage
