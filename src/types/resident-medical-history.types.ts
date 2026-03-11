import type { ResidentMedicalHistory } from '@/types/health-record.types'

export type ResidentMedicalHistoryRole = 'doctor' | 'resident'

export interface ResidentMedicalHistoryQuery {
  recordId: number
  pageNum?: number
  pageSize?: number
}

export interface SaveResidentMedicalHistoryDTO {
  recordId?: number
  chronicDisease?: string
  pastMedicalHistory?: string
  allergyHistory?: string
  familyHistory?: string
  surgeryHistory?: string
}

export interface ResidentMedicalHistoryListResult {
  total: number
  dataList: ResidentMedicalHistory[]
}
