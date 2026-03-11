import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { ResidentMedicalHistory } from '@/types/health-record.types'
import type {
  ResidentMedicalHistoryQuery,
  ResidentMedicalHistoryRole,
  SaveResidentMedicalHistoryDTO,
} from '@/types/resident-medical-history.types'

const API = {
  RESIDENT_LIST: '/resident/residentMedicalHistory/list',
  DOCTOR_LIST: '/doctor/residentMedicalHistory/list',
  RESIDENT_DETAIL: '/resident/residentMedicalHistory',
  DOCTOR_DETAIL: '/doctor/residentMedicalHistory',
  DOCTOR_SAVE: '/doctor/residentMedicalHistory',
} as const

export const getResidentMedicalHistoryListAPI = (role: ResidentMedicalHistoryRole, params: ResidentMedicalHistoryQuery) => {
  const url = role === 'doctor' ? API.DOCTOR_LIST : API.RESIDENT_LIST
  return http.get<Result<PageResult<ResidentMedicalHistory>>>(url, { params }) as unknown as Promise<
    Result<PageResult<ResidentMedicalHistory>>
  >
}

export const getResidentMedicalHistoryDetailAPI = (role: ResidentMedicalHistoryRole, id: number) => {
  const baseUrl = role === 'doctor' ? API.DOCTOR_DETAIL : API.RESIDENT_DETAIL
  return http.get<Result<ResidentMedicalHistory>>(`${baseUrl}/${id}`) as unknown as Promise<Result<ResidentMedicalHistory>>
}

export const saveResidentMedicalHistoryAPI = (payload: SaveResidentMedicalHistoryDTO) => {
  return http.post<Result<string>>(API.DOCTOR_SAVE, payload) as unknown as Promise<Result<string>>
}
