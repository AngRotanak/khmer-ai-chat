import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import AttendanceHistory from "./components/AttendanceHistory"
import { AdminLayout } from "./components/AdminLayout"
import { useAttendanceRecords } from "./components/useAttendanceRecords"
import { db } from "~/lib/firebase"
import { ref, push } from "firebase/database"

function ViewHistory() {
  const [reportMode, setReportMode] = useState<"monthly" | "daily">("monthly")
  const [selectedMonth, setSelectedMonth] = useState("2026-05")
  const [selectedDate, setSelectedDate] = useState("")

  const tg = (window as any).Telegram?.WebApp
  const userId = tg?.initDataUnsafe?.user?.id || "736090330"
  const rawParam = tg?.initDataUnsafe?.start_param
  const groupId = new URLSearchParams(rawParam).get("group_id") || "-1002174749045"

  const { records, groupedRecords, summary } = useAttendanceRecords(
    groupId,
    userId, // single staff
    reportMode,
    selectedMonth,
    selectedDate
  )

  // 🔹 Log props at the page level
  useEffect(() => {
    push(ref(db, "logs/webapp/viewHistoryPage"), {
      type: "view_history_page_props",
      timestamp: new Date().toISOString(),
      groupId,
      userId,
      reportMode,
      month: selectedMonth,
      date: selectedDate,
      recordsCount: records.length,
      groupedKeys: Object.keys(groupedRecords),
      summary,
      sampleRecord: records[0] || null,
    })
  }, [records, groupedRecords, summary, groupId, userId, reportMode, selectedMonth, selectedDate])

  return (
    <AdminLayout title="📊 Report">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3 pt-15 flex flex-col items-center justify-center shadow-md space-y-2">
        {/* Report type selector */}
        <div className="w-full max-w-sm text-center">
          <label className="block text-teal-400 mb-1 text-sm font-semibold">
            Report Type
          </label>
          <select
            value={reportMode}
            onChange={(e) => {
              setReportMode(e.target.value as "monthly" | "daily")
              setSelectedDate("")
              setSelectedMonth("2026-05")
            }}
            className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        {/* Conditional input */}
        {reportMode === "monthly" && (
          <div className="w-full max-w-sm text-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        {reportMode === "daily" && (
          <div className="w-full max-w-sm text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
            />
            {!selectedDate && (
              <p className="text-xs text-gray-500 mt-1">No day selected</p>
            )}
          </div>
        )}
      </div>

      {/* Report content */}
      <div className="flex-1 px-1 pt-2 pb-10">
        <AttendanceHistory records={records} groupedRecords={groupedRecords} summary={summary} />
      </div>
    </AdminLayout>
  )
}

export const Route = createFileRoute("/attendance/viewhistory")({
  component: ViewHistory,
})
