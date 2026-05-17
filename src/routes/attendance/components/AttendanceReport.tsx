import { useEffect } from "react"
import type { AttendanceRecord } from "./useAttendanceRecords"
import { db } from "~/lib/firebase"
import { ref, push } from "firebase/database"

interface Props {
  records: AttendanceRecord[]
  groupedRecords: Record<string, AttendanceRecord[]>
  summary: { checkins: number; checkouts: number; late: number; early: number }
  calendarMode?: boolean
}

export default function AttendanceReport({ records, groupedRecords, summary, calendarMode }: Props) {
  // 🔹 Log props to Firebase whenever they change
  useEffect(() => {
    push(ref(db, "logs/webapp/report"), {
      type: "attendance_report_props",
      timestamp: new Date().toISOString(),
      calendarMode,
      recordsCount: records.length,
      groupedKeys: Object.keys(groupedRecords),
      summary,
      sampleRecord: records[0] || null,
    })
  }, [records, groupedRecords, summary, calendarMode])

  if (calendarMode) {
    // 🔹 Calendar overview mode
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white px-4 sm:px-1">
        <h2 className="text-teal-400 text-2xl font-bold flex items-center space-x-2 mb-4">
          <span>📅</span>
          <span>Attendance Calendar</span>
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {Object.entries(groupedRecords).map(([date, dayRecords]) => {
            const statusEmoji = dayRecords.some(r => r.status.includes("⚠️"))
              ? "⚠️"
              : "✅"
            return (
              <div key={date} className="bg-gray-800 text-center p-2 rounded">
                <div className="text-xs text-gray-400">{date}</div>
                <div className="text-lg">{statusEmoji}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 🔹 Detailed view mode
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white space-y-8 px-4 sm:px-1">
      <h2 className="text-teal-400 text-2xl font-bold flex items-center space-x-2">
        <span>📊</span>
        <span>Attendance Report</span>
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="✅ Check-Ins" value={summary.checkins} color="text-green-400" />
        <SummaryCard label="✅ Check-Outs" value={summary.checkouts} color="text-red-400" />
        <SummaryCard label="⚠️ Late" value={summary.late} color="text-yellow-400" />
        <SummaryCard label="⚠️ Early Leave" value={summary.early} color="text-purple-400" />
      </div>

      {/* Grouped records */}
      <div className="space-y-8">
        {Object.entries(groupedRecords).map(([date, dayRecords]) => (
          <div key={date} className="space-y-4">
            <h3 className="text-lg font-semibold text-teal-300 border-b border-gray-700 pb-1">
              📅 {date}
            </h3>

            {dayRecords.map((r, idx) => (
              <div
                key={idx}
                className="bg-gray-900 rounded-xl shadow-lg px-4 py-6 sm:px-6 sm:py-8 border border-gray-800 hover:border-teal-500 transition w-full max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto"
              >
                <div className="flex justify-between text-sm text-teal-300 mb-2">
                  <span className="font-medium">{r.officeName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>

                {r.full_name && (
                  <div className="text-sm mb-1">
                    <span className="font-semibold text-gray-300">👤 Staff:</span>{" "}
                    <span className="text-white">{r.full_name}</span>
                  </div>
                )}

                <div className="text-sm mb-1 flex items-center gap-2">
                  <span className="font-semibold text-gray-300">🕒 Action:</span>
                  {r.action === "checkin" ? (
                    <span className="flex items-center gap-1 text-green-400 font-medium">Check-In</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-medium">Check-Out</span>
                  )}
                </div>

                <div className="text-sm mb-1">
                  <span className="font-semibold text-gray-300">📌 Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      r.status.includes("✅")
                        ? "bg-green-600 text-white"
                        : r.status.includes("⚠️ យឺត")
                        ? "bg-yellow-500 text-black"
                        : r.status.includes("⚠️ ចេញមុន")
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {r.status} {r.detail || ""}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-semibold text-gray-300">💬 Reason:</span>{" "}
                  {r.remark || "-"}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* 🔹 Reusable summary card */
function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 shadow-md text-center">
      <div className="text-sm font-semibold text-gray-300">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}
