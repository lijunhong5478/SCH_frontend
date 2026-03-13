import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { DoctorHealthRecord, DoctorHealthRecordQuery } from '@/types/health-record.types'

const API = {
  LIST: '/doctor/healthRecord/list',
  MY_PATIENT_LIST: '/doctor/account/myPatient',
  RESIDENT_RECORD_ID: '/resident/healthRecord/getId',
  DETAIL: '/resident/healthRecord',
} as const

export const getDoctorHealthRecordListAPI = (params: DoctorHealthRecordQuery) => {
  return http.get<Result<PageResult<DoctorHealthRecord>>>(API.LIST, { params }) as unknown as Promise<Result<PageResult<DoctorHealthRecord>>>
}

export const getDoctorMyPatientHealthRecordListAPI = (params: DoctorHealthRecordQuery) => {
  return http.get<Result<PageResult<DoctorHealthRecord>>>(API.MY_PATIENT_LIST, {
    params: {
      doctorId: params.doctorId,
      pageNum: params.pageNum,
      pageSize: params.pageSize,
    },
  }) as unknown as Promise<Result<PageResult<DoctorHealthRecord>>>
}

export const getResidentHealthRecordIdAPI = (residentId: number) => {
  return http.get<Result<number>>(API.RESIDENT_RECORD_ID, {
    params: { id: residentId },
  }) as unknown as Promise<Result<number>>
}

export const getHealthRecordDetailAPI = (id: number) => {
  return http.get<Result<DoctorHealthRecord>>(`${API.DETAIL}/${id}`) as unknown as Promise<Result<DoctorHealthRecord>>
}
