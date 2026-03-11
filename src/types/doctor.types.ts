import type { DoctorSchedule } from '@/types/api.types';

export interface DoctorDetail {
  userId: number;
  username: string;
  phone: string;
  avatarUrl: string;
  status: number;
  doctorId: number;
  name: string;
  gender: number;
  age: number;
  contact?: string;
  address?: string;
  departmentId?: number;
  departmentName?: string;
  title?: number;
  specialty?: string;
  introduction?: string;
  doctorSchedules?: DoctorSchedule[];
}

export interface UpdateDoctorProfileDTO {
  id: number;
  username: string;
  phone: string;
  avatarUrl: string;
  name: string;
  gender: number;
  age: number;
  contact: string;
  address: string;
}
