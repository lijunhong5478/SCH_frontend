import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type {
  DiagnosisReportQuery,
  DiagnosisRole,
  MedicalVisitDetail,
  UpdateDiagnosisReportDTO,
} from '@/types/diagnosis-report.types'
import type { DiagnosisReport } from '@/types/health-record.types'

const API = {
  RESIDENT_LIST: '/resident/diagnosisReport/list',
  DOCTOR_LIST: '/doctor/diagnosisReport/list',
  DOCTOR_UPDATE: '/doctor/diagnosisReport',
  DOCTOR_CHECK: '/doctor/diagnosisReport/check',
  RESIDENT_VISIT: '/resident/medicalVisit',
  DOCTOR_VISIT: '/doctor/medicalVisit',
} as const

export const getDiagnosisReportListAPI = (role: DiagnosisRole, params: DiagnosisReportQuery) => {
  const url = role === 'doctor' ? API.DOCTOR_LIST : API.RESIDENT_LIST
  return http.get<Result<PageResult<DiagnosisReport>>>(url, { params }) as unknown as Promise<Result<PageResult<DiagnosisReport>>>
}

export const getMedicalVisitDetailAPI = (role: DiagnosisRole, visitId: number) => {
  const baseUrl = role === 'doctor' ? API.DOCTOR_VISIT : API.RESIDENT_VISIT
  return http.get<Result<MedicalVisitDetail>>(`${baseUrl}/${visitId}`) as unknown as Promise<Result<MedicalVisitDetail>>
}

export const checkDoctorDiagnosisPermissionAPI = (diagnosisId: number, doctorId: number) => {
  return http.get<Result<boolean>>(API.DOCTOR_CHECK, {
    params: {
      diagnosisId,
      doctorId,
    },
  }) as unknown as Promise<Result<boolean>>
}

export const updateDoctorDiagnosisReportAPI = (payload: UpdateDiagnosisReportDTO) => {
  // Backend update endpoint reads fields from request params; include all fields in params.
  return http.put<Result<string>>(API.DOCTOR_UPDATE, null, {
    params: payload,
  }) as unknown as Promise<Result<string>>
}
