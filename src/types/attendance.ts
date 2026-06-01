// types/attendance.ts
export default interface OfficeDetectionResult {
  officeDetected: boolean
  officeName: string
  distance: number | null
  officeId: string
  status: string
  detail: string
}
