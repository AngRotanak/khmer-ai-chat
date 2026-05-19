import { createFileRoute, Link } from "@tanstack/react-router"
import { AdminLayout } from "./components/AdminLayout"
import useUserSettings from "./components/useUserSettings"
import { db } from "~/lib/firebase"
import { ref, onValue } from "firebase/database"
import { useEffect, useState } from "react"
import { getGroupId, getUserId } from "./components/utils/telegram"

export const Route = createFileRoute("/attendance/settings")({
  component: SettingsPage,
})

function SettingsPage() {
   const userId = getUserId() || "guest"   // ✅ real Telegram userId
  const groupId = getGroupId()
  const { settings, updateSetting } = useUserSettings(userId)

  const [offices, setOffices] = useState<Record<string, any>>({})
  const [currentRole, setCurrentRole] = useState("member")

  // ✅ Load offices from attendance_config
  useEffect(() => {
    if (!groupId) return
    const officesRef = ref(db, `khmer-autobot/attendance_config/${groupId}/offices`)
    onValue(officesRef, (snapshot) => {
      const data = snapshot.val() || {}
      setOffices(data)
    })
  }, [groupId])

  // ✅ Load role (example: from Firebase roles branch)
  useEffect(() => {
    if (!groupId || !userId) return
    const roleRef = ref(db, `khmer-autobot/attendance_config/${groupId}/roles/${userId}`)
    onValue(roleRef, (snapshot) => {
      const role = snapshot.val() || "member"
      setCurrentRole(role)
    })
  }, [groupId, userId])

  return (
    <AdminLayout title="⚙️ Settings">
      <div className="w-full max-w-md space-y-6 mx-auto">
        {/* Language Selector */}
        <div>
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Language</label>
          <select
            value={settings.language}
            onChange={(e) => updateSetting("language", e.target.value)}
            className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
          >
            <option value="en">English</option>
            <option value="kh">Khmer</option>
          </select>
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting("theme", e.target.value as "dark" | "light")}
            className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
          >
            <option value="dark">🌑 Dark</option>
            <option value="light">☀️ Light</option>
          </select>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-teal-400 font-semibold">Notifications</span>
          <button
            onClick={() =>
              updateSetting("notifications", {
                ...settings.notifications,
                attendance_reminders: !settings.notifications?.attendance_reminders,
              })
            }
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              settings.notifications?.attendance_reminders
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {settings.notifications?.attendance_reminders ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Office Selector */}
        <div>
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Default Office</label>
          <select
            value={settings.office_id || ""}
            onChange={(e) => updateSetting("office_id", e.target.value)}
            className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
          >
            <option value="" disabled>
              -- Select Office --
            </option>
            {Object.entries(offices).map(([id, config]) => (
              <option key={id} value={id}>
                {config.officeName}
              </option>
            ))}
          </select>
        </div>

        {/* 🔹 Admin-only shortcut */}
        {currentRole === "admin" && (
          <div className="mt-6">
            <Link
              to="/attendance/admin/config"
              search={{ group_id: groupId }}
              className="block px-4 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition text-center"
            >
              🏢 Manage Offices
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
