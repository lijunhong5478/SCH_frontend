import type { DoctorTitle } from './account.types'

export type DoctorTimeSlot = 'AM' | 'PM'

export interface ResidentDoctorSchedule {
  id: number
  doctorId: number
  weekDay: number
  timeSlot: DoctorTimeSlot
  maxNumber: number
  currentNumber: number
  status: number
  createTime: string
}

export interface ResidentDoctor {
  userId: number
  username: string
  phone: string
  avatarUrl: string
  status: number
  doctorId: number
  name: string
  specialty: string
  title: DoctorTitle
  introduction: string
  gender: 0 | 1
  age: number
  departmentId: number
  departmentName: string
  doctorSchedules: ResidentDoctorSchedule[]
}

export interface ResidentDoctorQuery {
  departmentId?: number
  name?: string
  pageNum?: number
  pageSize?: number
  timeSlot?: DoctorTimeSlot
  title?: DoctorTitle
  workDay?: string
}

export const doctorTitleTextMap: Record<DoctorTitle, string> = {
  1: '住院医师',
  2: '主治医师',
  3: '副主任医师',
  4: '主任医师',
}

export const doctorGenderTextMap: Record<0 | 1, string> = {
  0: '女',
  1: '男',
}

export const weekDayTextMap: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

export const timeSlotTextMap: Record<DoctorTimeSlot, string> = {
  AM: '上午',
  PM: '下午',
}
