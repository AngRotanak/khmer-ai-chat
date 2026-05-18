import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import AttendanceReport from "./components/AttendanceReport"
import { AdminLayout } from "./components/AdminLayout"
import { useAttendanceRecords } from "./components/useAttendanceRecords"
import AttendanceCalendar from "./components/AttendanceCalendar"
import StaffCalendar from "./components/StaffCalendar"
import AdminSummaryCalendar from "./components/AdminSummaryCalendar"
import ViewModeFAB from "./components/ViewModeFAB"   // ✅ FAB with icons
import { z } from "zod"
// import { getGroupId } from "./components/utils/telegram"
import { db } from "~/lib/firebase"
import { ref, get, push } from "firebase/database"

export const Route = createFileRoute("/attendance/report")({
  component: ReportPage,
  validateSearch: z.object({
    group_id: z.string().optional(),   // ✅ only group_id is allowed
  }),
})


function ReportPage() {
  const [reportMode, setReportMode] = useState<"monthly" | "daily">("monthly")
  const [selectedMonth, setSelectedMonth] = useState("2026-05")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([])
  const [selectedKey, setSelectedKey] = useState<string>()
  const [viewMode, setViewMode] = useState<"report" | "calendar" | "summary">("report")

  const params = new URLSearchParams(location.search)
  let groupId = params.get("group_id") || ""

  if (!groupId || groupId === "unknown") {
    const tg = (window as any).Telegram?.WebApp
    const rawParam = tg?.initDataUnsafe?.start_param
    if (rawParam) {
      groupId = rawParam
    }
  }

  // ✅ Fetch staff list...
  useEffect(() => {
    const fetchStaff = async () => {
      const rolesPath = `khmer-autobot/attendance_config/${groupId}/attendance_roles`
      const snapshot = await get(ref(db, rolesPath))
      const data = snapshot.val() || {}

      const staff = Object.entries(data).map(([uid, info]: any) => ({
        id: uid,
        name: info.fullName || uid,
        role: info.role || "staff",
        username: info.username || "",
      }))
      setStaffList(staff)

      await push(ref(db, `logs/webapp/${groupId}`), {
        type: "staff_list_fetch",
        path: rolesPath,
        keys: Object.keys(data),
        count: staff.length,
        timestamp: new Date().toISOString(),
      })
    }
    fetchStaff()
  }, [groupId])


  // ✅ groupId is guaranteed string
  const { records, groupedRecords, summary } = useAttendanceRecords(
    groupId,
    selectedUserId || undefined,
    reportMode,
    selectedMonth,
    selectedDate
  )

  return (
    <AdminLayout title="📊 Report">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3 flex flex-col items-center justify-center shadow-md space-y-2">

        {/* Staff selector */}
        <div className="w-full max-w-sm text-center">
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Select Staff</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded w-full focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Staff</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.role})
              </option>
            ))}
          </select>
        </div>

        {/* Report type selector */}
        <div className="w-full max-w-sm text-center">
          <label className="block text-teal-400 mb-1 text-sm font-semibold">Report Type</label>
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

      {/* ✅ Report content */}
      <div className="flex-1 px-1 pt-2 pb-10">
        {viewMode === "summary" ? (
          <AdminSummaryCalendar
            staffList={staffList}
            groupedRecords={groupedRecords}
            month={selectedMonth}
          />
        ) : viewMode === "calendar" ? (
          selectedUserId ? (
            <AttendanceCalendar
              staffId={selectedUserId}
              groupedRecords={groupedRecords}
              month={selectedMonth}
              selectedKey={selectedKey}
              onSelectKey={(key?: string) => setSelectedKey(key)}
            />
          ) : (
            staffList.map(staff => (
              <StaffCalendar
                key={staff.id}
                staff={staff}
                groupId={groupId}
                reportMode={reportMode}
                selectedMonth={selectedMonth}
              />
            ))
          )
        ) : (
          <AttendanceReport
            records={records}
            groupedRecords={groupedRecords}
            summary={summary}
            calendarMode={false}
          />
        )}
      </div>

      {/* Floating Action Button for quick view switching */}
      <ViewModeFAB currentMode={viewMode} onChange={setViewMode} />
    </AdminLayout>
  )
}
