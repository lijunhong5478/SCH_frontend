import type { PhysicalExamRecord } from '@/types/health-record.types'

export interface PhysicalExamRecordQuery {
  recordId: number
  pageNum?: number
  pageSize?: number
}

export type PhysicalExamRole = 'doctor' | 'resident'

export interface SavePhysicalExamRecordDTO {
  recordId: number
  height: number
  weight: number
  systolicBp: number
  diastolicBp: number
  heartRate: number
  bloodSugar: number
  bmi: number
}

export interface PhysicalExamRecordListResult {
  total: number
  dataList: PhysicalExamRecord[]
}
