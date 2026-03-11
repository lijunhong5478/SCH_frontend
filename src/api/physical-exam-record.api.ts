import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { PhysicalExamRecord } from '@/types/health-record.types'
import type {
  PhysicalExamRecordQuery,
  PhysicalExamRole,
  SavePhysicalExamRecordDTO,
} from '@/types/physical-exam-record.types'

const API = {
  RESIDENT_LIST: '/resident/physicalExamRecord/list',
  DOCTOR_LIST: '/doctor/physicalExamRecord/list',
  RESIDENT_DETAIL: '/resident/physicalExamRecord',
  DOCTOR_DETAIL: '/doctor/physicalExamRecord',
  DOCTOR_SAVE: '/doctor/physicalExamRecord',
} as const

export const getPhysicalExamRecordListAPI = (role: PhysicalExamRole, params: PhysicalExamRecordQuery) => {
  const url = role === 'doctor' ? API.DOCTOR_LIST : API.RESIDENT_LIST
  return http.get<Result<PageResult<PhysicalExamRecord>>>(url, { params }) as unknown as Promise<
    Result<PageResult<PhysicalExamRecord>>
  >
}

export const getPhysicalExamRecordDetailAPI = (role: PhysicalExamRole, id: number) => {
  const baseUrl = role === 'doctor' ? API.DOCTOR_DETAIL : API.RESIDENT_DETAIL
  return http.get<Result<PhysicalExamRecord>>(`${baseUrl}/${id}`) as unknown as Promise<Result<PhysicalExamRecord>>
}

export const savePhysicalExamRecordAPI = (payload: SavePhysicalExamRecordDTO) => {
  return http.post<Result<string>>(API.DOCTOR_SAVE, payload) as unknown as Promise<Result<string>>
}
