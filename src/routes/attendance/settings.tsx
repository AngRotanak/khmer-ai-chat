import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AdminLayout } from "./components/AdminLayout"

export const Route = createFileRoute("/attendance/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const [language, setLanguage] = useState("en")
  const [theme, setTheme] = useState("dark")
  const [notifications, setNotifications] = useState(true)

return (
    <AdminLayout title="⚙️ Settings">
      <div className="w-full max-w-md space-y-6 mx-auto">
        {/* Language Selector */}
        <div>
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
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
            onClick={() => setNotifications(!notifications)}
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              notifications
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {notifications ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}