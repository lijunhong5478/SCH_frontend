import type { DiagnosisReport } from '@/types/health-record.types'

export interface DiagnosisReportQuery {
  createDate?: string
  doctorId?: number
  healthRecordId?: number
  pageNum?: number
  pageSize?: number
}

export type DiagnosisRole = 'doctor' | 'resident'

export interface DiagnosisReportListResult {
  total: number
  dataList: DiagnosisReport[]
}

export interface MedicalVisitDetail {
  id: number
  doctorName: string
  doctorPhone: string
  doctorImage: string
  doctorTitle: number
  doctorDepartment: string
  residentName: string
  chiefComplaint: string
  treatmentAdvice: string
  createTime: string
}

export interface UpdateDiagnosisReportDTO {
  id: number
  diagnosisResult: string
  diagnosisDetail: string
}
