import { useState } from "react"
import AttendanceCalendar from "./AttendanceCalendar"
import { useAttendanceRecords } from "./useAttendanceRecords"

interface StaffCalendarProps {
  staff: { id: string; name: string; role: string }
  groupId: string
  reportMode: "monthly" | "daily"
  selectedMonth: string
}


function StaffCalendar({ staff, groupId, reportMode, selectedMonth }: StaffCalendarProps) {
  const [selectedKey, setSelectedKey] = useState<string>()

  const { groupedRecords } = useAttendanceRecords(
    groupId,
    staff.id,
    reportMode,
    selectedMonth,
    selectedKey ? selectedKey.split("|")[1] : "" // ✅ pass date part if selected
  )

  return (
    <div className="mb-10">
      <h3 className="text-teal-300 font-bold text-lg mb-2">
        {staff.name} ({staff.role})
      </h3>
      <AttendanceCalendar
        staffId={staff.id}
        groupedRecords={groupedRecords}
        month={selectedMonth}
        selectedKey={selectedKey}
        onSelectKey={(key?: string) => setSelectedKey(key)}
      />
    </div>
  )
}

export default StaffCalendar
