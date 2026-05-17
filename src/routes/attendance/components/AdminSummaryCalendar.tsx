import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { AttendanceRecord } from "./useAttendanceRecords"

interface Props {
  staffList: { id: string; name: string; role: string }[]
  groupedRecords: Record<string, AttendanceRecord[]>
  month: string
}

export default function AdminSummaryCalendar({ staffList, groupedRecords, month }: Props) {
  let totals = { present: 0, late: 0, absent: 0, overtime: 0 }
  const staffTotals: Record<string, typeof totals> = {}
  staffList.forEach(staff => {
    staffTotals[staff.id] = { present: 0, late: 0, absent: 0, overtime: 0 }
  })

  const weeklyData: { week: string; present: number; late: number; absent: number; overtime: number }[] = []

  function getWeek(dateStr: string) {
    const d = new Date(dateStr)
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
    const diff = d.getDate() + firstDay.getDay()
    return Math.ceil(diff / 7)
  }

  Object.entries(groupedRecords).forEach(([dayKey, records]) => {
    const weekNum = getWeek(dayKey)
    if (!weeklyData[weekNum]) {
      weeklyData[weekNum] = { week: `Week ${weekNum}`, present: 0, late: 0, absent: 0, overtime: 0 }
    }
    records.forEach(r => {
      const staffId = staffList.find(s => s.name === r.full_name)?.id
      if (r.status.includes("Late") || r.status.includes("Early")) {
        totals.late++; weeklyData[weekNum].late++; if (staffId) staffTotals[staffId].late++
      } else if (r.status.includes("Absent")) {
        totals.absent++; weeklyData[weekNum].absent++; if (staffId) staffTotals[staffId].absent++
      } else if (r.status.includes("Overtime")) {
        totals.overtime++; weeklyData[weekNum].overtime++; if (staffId) staffTotals[staffId].overtime++
      } else {
        totals.present++; weeklyData[weekNum].present++; if (staffId) staffTotals[staffId].present++
      }
    })
  })

  return (
    <div className="bg-gray-900 rounded-xl shadow-md mb-8 space-y-6">
      <h2 className="text-teal-400 text-lg sm:text-xl font-bold text-center py-4">
        📊 Admin Summary — {month}
      </h2>

      {/* Sticky summary cards */}
      <div className="sticky top-0 z-30 bg-gray-900 px-4 py-2 shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon="✅" label="Present" value={totals.present} color="text-teal-400" />
          <SummaryCard icon="⚠️" label="Late/Early" value={totals.late} color="text-yellow-400" />
          <SummaryCard icon="❌" label="Absent" value={totals.absent} color="text-red-400" />
          <SummaryCard icon="⏱️" label="Overtime" value={totals.overtime} color="text-purple-400" />
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="px-4">
        <h3 className="text-teal-300 font-semibold mb-2 text-center sm:text-left">Weekly Attendance Overview</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#14b8a6" name="✅ Present" />
              <Bar dataKey="late" fill="#facc15" name="⚠️ Late/Early" />
              <Bar dataKey="absent" fill="#ef4444" name="❌ Absent" />
              <Bar dataKey="overtime" fill="#a855f7" name="⏱️ Overtime" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff comparison table */}
      <div className="overflow-x-auto px-4">
        <table className="min-w-full text-xs sm:text-sm text-gray-300 mt-6">
          <thead>
            <tr className="text-teal-400">
              <th className="text-left px-2 py-1">Staff</th>
              <th className="px-2">✅</th>
              <th className="px-2">⚠️</th>
              <th className="px-2">❌</th>
              <th className="px-2">⏱️</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(staff => (
              <tr key={staff.id} className="border-t border-gray-700">
                <td className="px-2 py-1">{staff.name} ({staff.role})</td>
                <td className="text-teal-400 text-center">{staffTotals[staff.id].present}</td>
                <td className="text-yellow-400 text-center">{staffTotals[staff.id].late}</td>
                <td className="text-red-400 text-center">{staffTotals[staff.id].absent}</td>
                <td className="text-purple-400 text-center">{staffTotals[staff.id].overtime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center">
      <span className="text-lg sm:text-2xl">{icon}</span>
      <span className="text-xs sm:text-sm text-gray-300">{label}</span>
      <span className={`text-sm sm:text-lg font-bold ${color}`}>{value}</span>
    </div>
  )
}
