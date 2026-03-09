import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { DoctorHealthRecord, DoctorHealthRecordQuery } from '@/types/health-record.types'

const API = {
  LIST: '/doctor/healthRecord/list',
} as const

export const getDoctorHealthRecordListAPI = (params: DoctorHealthRecordQuery) => {
  return http.get<Result<PageResult<DoctorHealthRecord>>>(API.LIST, { params }) as unknown as Promise<Result<PageResult<DoctorHealthRecord>>>
}
