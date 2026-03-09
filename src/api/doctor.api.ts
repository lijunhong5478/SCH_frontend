import http from './axios.config';
import type { Result } from '@/types/api.types';
import type { DoctorDetail, UpdateDoctorProfileDTO } from '@/types/doctor.types';

export const getDoctorAccount = (id: number): Promise<Result<DoctorDetail>> => {
  return http.get(`/doctor/account/${id}`);
};

export const updateDoctorAccount = (data: UpdateDoctorProfileDTO): Promise<Result<string>> => {
  return http.put('/doctor/account', data);
};

export const uploadDoctorAvatar = (file: File): Promise<Result<string>> => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/common/file/upload', formData);
};
