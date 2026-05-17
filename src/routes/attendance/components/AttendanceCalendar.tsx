import type { AttendanceRecord } from "./useAttendanceRecords"

interface Props {
  staffId: string
  groupedRecords: Record<string, AttendanceRecord[]>
  month: string
  selectedKey?: string
  onSelectKey?: (key?: string) => void
}

export default function AttendanceCalendar({ staffId, groupedRecords, month, selectedKey, onSelectKey }: Props) {
  const daysInMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate()

  const getStatus = (records: AttendanceRecord[] | undefined) => {
    if (!records || records.length === 0) return "❌"
    if (records.some(r => r.status.includes("Overtime"))) return "⏱️"
    if (records.some(r => r.status.includes("Late"))) return "⚠️"
    if (records.some(r => r.status.includes("Early"))) return "⚠️"
    return "✅"
  }

  const days: { day: number; status: string }[] = []
  let totals = { present: 0, late: 0, absent: 0, overtime: 0 }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${month}-${String(day).padStart(2, "0")}`
    const records = groupedRecords[dateKey]
    const status = getStatus(records)
    days.push({ day, status })

    if (status === "✅") totals.present++
    if (status === "⚠️") totals.late++
    if (status === "❌") totals.absent++
    if (status === "⏱️") totals.overtime++
  }

  // Pad start and end for alignment
  const firstWeekday = new Date(`${month}-01`).getDay()
  const offset = (firstWeekday === 0 ? 6 : firstWeekday - 1)
  let paddedDays = Array(offset).fill({ day: 0, status: "" }).concat(days)
  const remainder = paddedDays.length % 7
  if (remainder !== 0) {
    paddedDays = paddedDays.concat(Array(7 - remainder).fill({ day: 0, status: "" }))
  }

  // ✅ Get records for selected day (strip staffId from selectedKey)
  const selectedRecords = selectedKey
    ? groupedRecords[selectedKey.split("|")[1]] || []
    : []

  return (
    <div className="bg-gray-900 rounded-xl shadow-md p-6 mb-8 space-y-6">
      {/* Calendar header */}
      <h2 className="text-teal-400 text-xl font-bold flex items-center gap-2">
        📅 {month}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="text-gray-400 text-xs sm:text-sm font-semibold">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {paddedDays.map((d, idx) => {
          const dateKey = `${month}-${String(d.day).padStart(2, "0")}`
          const uniqueKey = `${staffId}|${dateKey}`
          const isSelected = selectedKey === uniqueKey

          return (
            <button
              key={idx}
              type="button"
              className={`rounded-lg p-2 sm:p-3 min-h-[50px] cursor-pointer transition 
                ${d.day > 0 ? "bg-gray-800 hover:bg-gray-700" : ""} 
                ${isSelected ? "border-2 border-teal-400 shadow-lg" : ""}`}
              onClick={(e) => {
                e.preventDefault()
                if (d.day > 0 && onSelectKey) {
                  onSelectKey(isSelected ? undefined : uniqueKey)
                }
              }}
            >
              {d.day > 0 && (
                <>
                  <div className="text-[11px] sm:text-xs text-gray-400">{d.day}</div>
                  <div className="text-lg sm:text-xl">{d.status}</div>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* ✅ Animated detail panel */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          selectedKey ? "max-h-96 opacity-100 mt-6 border-t border-gray-700 pt-4" : "max-h-0 opacity-0"
        }`}
      >
        {selectedKey && (
          <>
            <h3 className="text-teal-400 font-semibold mb-3">Details for {selectedKey.split("|")[1]}</h3>
            {selectedRecords.length > 0 ? (
              <div className="grid gap-4">
                {selectedRecords.map((rec, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4 shadow flex flex-col space-y-2">
                    <div className="text-teal-300 font-semibold text-sm">
                      👤 {rec.full_name || "Unknown Staff"}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{rec.action}</span>
                      <span className="text-gray-400">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span
                        className={`font-medium ${
                          rec.status.includes("Late")
                            ? "text-yellow-400"
                            : rec.status.includes("Early")
                            ? "text-orange-400"
                            : rec.status.includes("Overtime")
                            ? "text-purple-400"
                            : rec.status.includes("Absent")
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {rec.status}
                      </span>
                      {rec.detail && <span className="text-xs text-gray-400">{rec.detail}</span>}
                    </div>
                    {rec.remark && (
                      <div className="text-xs text-yellow-300">Reason: {rec.remark}</div>
                    )}
                    <div className="text-xs text-gray-400">🏢 {rec.officeName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No records for this day.</p>
            )}
          </>
        )}
      </div>

      {/* ✅ Monthly summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-2xl">✅</span>
          <span className="text-sm text-gray-300">Present</span>
          <span className="text-lg font-bold text-teal-400">{totals.present}</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-2xl">⚠️</span>
          <span className="text-sm text-gray-300">Late/Early</span>
          <span className="text-lg font-bold text-yellow-400">{totals.late}</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-2xl">❌</span>
          <span className="text-sm text-gray-300">Absent</span>
          <span className="text-lg font-bold text-red-400">{totals.absent}</span>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-2xl">⏱️</span>
          <span className="text-sm text-gray-300">Overtime</span>
          <span className="text-lg font-bold text-purple-400">{totals.overtime}</span>
        </div>
      </div>
    </div>
  )
}
