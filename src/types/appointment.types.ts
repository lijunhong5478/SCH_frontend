export interface Appointment {
  id: number
  residentId: number
  doctorId: number
  scheduleId: number
  triageLevel?: number
  symptom?: string
  appointmentStatus: number
  visitStatus: number
  cancelReason?: string
  cancelTime?: string
  isDeleted?: number
  createTime: string
  appointmentTime: string
  appointmentDate: string
  queueNo: string
}

export interface AppointmentQueryDTO {
  doctorId?: number
  residentId?: number
  appointmentStatus?: number
  visitStatus?: number
  appointmentDate?: string
  appointmentTime?: string
  pageNum?: number
  pageSize?: number
}

export interface ExactTimeAppointmentDTO {
  residentId: number
  doctorId: number
  scheduleId: number
  appointmentDate: string
  appointmentTime: string
  symptom?: string
}

export interface MedicalVisit {
  id: number
  appointId: number
  residentId: number
  doctorId: number
  doctorName?: string
  doctorPhone?: string
  doctorDepartment?: string
  residentName?: string
  chiefComplaint: string
  treatmentAdvice: string
  createTime: string
  isDeleted?: number
}

export interface DoctorMedicalVisitQueryDTO {
  createDate?: string
  doctorId?: number
  doctorName?: string
  pageNum?: number
  pageSize?: number
  patientName?: string
  residentId?: number
}

export interface DoctorMedicalVisitRecord {
  id: number
  doctorName: string
  doctorPhone?: string
  doctorImage?: string
  doctorTitle?: number
  doctorDepartment?: string
  residentName: string
  chiefComplaint: string
  treatmentAdvice: string
  createTime: string
}

export interface CreateMedicalVisitDTO {
  appointId: number
  residentId: number
  doctorId: number
  chiefComplaint?: string
  treatmentAdvice?: string
  createTime?: string
  id?: number
  isDeleted?: number
}

export interface CreateDiagnosisReportDTO {
  visitId: number
  healthRecordId: number
  diagnosisResult: string
  diagnosisDetail: string
}

export const APPOINTMENT_STATUS = {
  BOOKED: 0,
  CANCELLED: 1,
  EXPIRED: 2,
  FINISHED: 3,
} as const

export const VISIT_STATUS = {
  WAITING: 0,
  CALLED: 1,
  IN_VISIT: 2,
  DONE: 3,
  SKIPPED: 4,
} as const

export const appointmentStatusTextMap: Record<number, string> = {
  [APPOINTMENT_STATUS.BOOKED]: '预约中',
  [APPOINTMENT_STATUS.CANCELLED]: '已取消',
  [APPOINTMENT_STATUS.EXPIRED]: '已过期',
  [APPOINTMENT_STATUS.FINISHED]: '已完成',
}

export const visitStatusTextMap: Record<number, string> = {
  [VISIT_STATUS.WAITING]: '排队中',
  [VISIT_STATUS.CALLED]: '已叫号',
  [VISIT_STATUS.IN_VISIT]: '就诊中',
  [VISIT_STATUS.DONE]: '已完成',
  [VISIT_STATUS.SKIPPED]: '过号',
}

export const MORNING_APPOINTMENT_TIMES = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] as const

export const AFTERNOON_APPOINTMENT_TIMES = [
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
] as const

export type AppointmentTimeValue = (typeof MORNING_APPOINTMENT_TIMES)[number] | (typeof AFTERNOON_APPOINTMENT_TIMES)[number]
