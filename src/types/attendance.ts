// types/attendance.ts
export interface OfficeDetectionResult {
  officeDetected: boolean
  officeName: string
  distance: number | null
  officeId: string
  status: string
  detail: string
}
