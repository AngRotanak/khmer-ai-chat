import { useState, useEffect } from "react"
import { ref, onValue, update, set, remove, push } from "firebase/database"
import { db } from "~/lib/firebase"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { OfficeCard } from "../components/OfficeCard"
import { NewOfficeForm } from "../components/NewOfficeForm"
import { AdminLayout } from "../components/AdminLayout"

export const Route = createFileRoute("/attendance/admin/config")({
  component: AttendanceConfigPage,
  validateSearch: z.object({
    group_id: z.string().optional(),
  }),
})

function AttendanceConfigPage() {
  const params = new URLSearchParams(location.search)
  let groupId = params.get("group_id")

  if (!groupId || groupId === "unknown") {
    const tg = (window as any).Telegram?.WebApp
    const rawParam = tg?.initDataUnsafe?.start_param
    if (rawParam) {
      groupId = rawParam
    }
  }

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
            officeName={officeName}
            config={config}
            updateOffice={updateOffice}
            deleteOffice={deleteOffice}
          />
        ))
      )}
    </AdminLayout>
  )
}

export default AttendanceConfigPage
