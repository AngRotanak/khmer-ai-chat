// types/attendance.ts
interface OfficeDetectionResult {
  officeDetected: boolean
  officeName: string
  distance: number | null
  officeId: string
  status: string
  detail: string
}
