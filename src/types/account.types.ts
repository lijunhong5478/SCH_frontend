export interface Account {
  id: number
  name?: string
  username: string
  phone: string
  idCard: string
  avatarUrl: string
  avatar?: string
  status: number
  isDeleted: number
  createTime: string
  updateTime: string
  roleType: number
}

export interface AccountQuery {
  isDeleted?: number
  pageNum?: number
  pageSize?: number
  phone?: string | null
  role?: number
  status?: number
  username?: string | null
}

export interface Department {
  id: number
  name: string
  description: string
  isDeleted: number
  createTime: string
}

export type DoctorTitle = 1 | 2 | 3 | 4

export interface AddDoctorScheduleDTO {
  createTime?: string
  currentNumber?: number
  doctorId?: number
  id?: number
  maxNumber: number
  status?: number
  timeSlot: 'AM' | 'PM' | ''
  weekDay: number
}

export interface AddDoctorDTO {
  age: number
  avatarUrl: string
  departmentId: number
  doctorSchedules: AddDoctorScheduleDTO[]
  gender: number
  idCard: string
  introduction: string
  name: string
  password: string
  phone: string
  specialty: string
  title: DoctorTitle
  username: string
}
