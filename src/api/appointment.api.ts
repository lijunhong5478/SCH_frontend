import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { Appointment, AppointmentQueryDTO, ExactTimeAppointmentDTO } from '@/types/appointment.types'

const API = {
  RESIDENT_BOOK: '/resident/appointment',
  RESIDENT_LIST: '/resident/appointment/list',
  RESIDENT_CANCEL: '/resident/appointment/cancel',
  RESIDENT_IS_APPOINTED: '/resident/appointment/isAppointed',
  RESIDENT_AVAILABLE_SLOTS: '/resident/appointment/availableTimeSlots',

  DOCTOR_LIST: '/doctor/appointment/list',
  DOCTOR_CALL: '/doctor/appointment/call',
  DOCTOR_START: '/doctor/appointment/startConsult',
  DOCTOR_SKIP: '/doctor/appointment/skip',
  DOCTOR_FINISH: '/doctor/appointment/finish',
} as const

export const createResidentAppointmentAPI = (payload: ExactTimeAppointmentDTO) => {
  return http.post<Result<string>>(API.RESIDENT_BOOK, payload) as unknown as Promise<Result<string>>
}

export const getResidentAppointmentListAPI = (params: AppointmentQueryDTO) => {
  return http.get<Result<PageResult<Appointment>>>(API.RESIDENT_LIST, { params }) as unknown as Promise<
    Result<PageResult<Appointment>>
  >
}

export const cancelResidentAppointmentAPI = (appointmentId: number, cancelReason?: string) => {
  return http.put<Result<string>>(API.RESIDENT_CANCEL, null, {
    params: {
      appointmentId,
      cancelReason,
    },
  }) as unknown as Promise<Result<string>>
}

export const checkResidentAppointedAPI = (payload: AppointmentQueryDTO) => {
  return http.post<Result<boolean>>(API.RESIDENT_IS_APPOINTED, payload) as unknown as Promise<Result<boolean>>
}

export const getResidentAvailableTimeSlotsAPI = (date: string, doctorId: number) => {
  return http.get<Result<string[]>>(API.RESIDENT_AVAILABLE_SLOTS, {
    params: {
      date,
      doctorId,
    },
  }) as unknown as Promise<Result<string[]>>
}

export const getDoctorAppointmentListAPI = (params: AppointmentQueryDTO) => {
  return http.get<Result<PageResult<Appointment>>>(API.DOCTOR_LIST, { params }) as unknown as Promise<Result<PageResult<Appointment>>>
}

function updateDoctorAppointmentStatus(path: string, appointmentId: number) {
  return http.put<Result<string>>(path, null, {
    params: { appointmentId },
  }) as unknown as Promise<Result<string>>
}

export const callAppointmentAPI = (appointmentId: number) => updateDoctorAppointmentStatus(API.DOCTOR_CALL, appointmentId)

export const startConsultAppointmentAPI = (appointmentId: number) =>
  updateDoctorAppointmentStatus(API.DOCTOR_START, appointmentId)

export const skipAppointmentAPI = (appointmentId: number) => updateDoctorAppointmentStatus(API.DOCTOR_SKIP, appointmentId)

export const finishAppointmentAPI = (appointmentId: number) => updateDoctorAppointmentStatus(API.DOCTOR_FINISH, appointmentId)
