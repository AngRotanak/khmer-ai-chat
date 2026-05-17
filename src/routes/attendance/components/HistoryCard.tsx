interface AttendanceRecord {
  timestamp: string
  office_name: string
  action: "checkin" | "checkout"
  status: string
  remark?: string
}

export default function HistoryCard({ record }: { record: AttendanceRecord }) {
  const time = new Date(record.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <div className="bg-gray-900 rounded-lg shadow-md border border-gray-800 px-4 py-3 flex items-center justify-between hover:border-teal-500 transition">
      {/* Left side: icon + office */}
      <div className="flex items-center gap-3">
        {record.action === "checkin" ? (
          <span className="text-green-400 text-lg">⬆️</span>
        ) : (
          <span className="text-red-400 text-lg">⬇️</span>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{record.office_name}</p>
          <p className="text-xs text-gray-400">{time}</p>
        </div>
      </div>

      {/* Right side: status + remark */}
      <div className="text-right">
        <p
          className={`text-xs font-medium px-2 py-0.5 rounded inline-block ${
            record.status.includes("✅")
              ? "bg-green-600 text-white"
              : record.status.includes("⚠️ យឺត")
              ? "bg-yellow-500 text-black"
              : record.status.includes("⚠️ ចេញមុន")
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {record.status}
        </p>
        <p className="text-xs text-gray-400 mt-1">{record.remark || "-"}</p>
      </div>
    </div>
  )
}
