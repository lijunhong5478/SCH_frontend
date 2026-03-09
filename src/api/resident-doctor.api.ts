import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { ResidentDoctor, ResidentDoctorQuery } from '@/types/resident-doctor.types'

const API = {
  LIST_DOCTOR: '/resident/doctor/list',
} as const

export const getResidentDoctorListAPI = (params: ResidentDoctorQuery) => {
  return http.get<Result<PageResult<ResidentDoctor>>>(API.LIST_DOCTOR, { params }) as unknown as Promise<Result<PageResult<ResidentDoctor>>>
}
