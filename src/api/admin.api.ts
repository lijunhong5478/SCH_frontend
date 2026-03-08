import axiosInstance from './axios.config';
import type {
  ApiResponse,
  AdminDetailResponse,
  UpdateProfileDTO,
  UpdateProfileResponse,
  UploadFileResponse,
  GraphDataVO,
  DoctorScheduleResponse,
  UpdateDoctorScheduleDTO,
  UpdateDoctorScheduleResponse,
} from '@/types/api.types';

export const adminApi = {
  getProfileById(id: number): Promise<AdminDetailResponse> {
    return axiosInstance.get(`/admin/account/${id}`);
  },

  updateProfile(data: UpdateProfileDTO): Promise<UpdateProfileResponse> {
    return axiosInstance.put('/admin/account', data);
  },

  uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Let the browser set multipart boundary automatically.
    return axiosInstance.post('/common/file/upload', formData);
  },

  /**
   * 获取各科室医生分布数据
   */
  getDoctorDeptStats(): Promise<ApiResponse<GraphDataVO[]>> {
    return axiosInstance.get('/admin/graph/doctorDept');
  },

  /**
   * 获取用户年龄分布数据
   */
  getUserAgeStats(): Promise<ApiResponse<GraphDataVO[]>> {
    return axiosInstance.get('/admin/graph/userAge');
  },

  /**
   * 获取预约挂号统计数据
   */
  getAppointmentStats(): Promise<ApiResponse<{ date: string; count: number }[]>> {
    return axiosInstance.get('/admin/graph/appointment');
  },

  /**
   * 获取今日预约状态统计（等待中/就诊中/已完成）
   */
  getTodayAppointmentStats(): Promise<
    ApiResponse<{ waiting: number; inVisit: number; finished: number }>
  > {
    return axiosInstance.get('/admin/appointment/status/today');
  },

  /**
   * 根据医生ID获取排班信息
   */
  getDoctorSchedule(doctorId: number): Promise<DoctorScheduleResponse> {
    return axiosInstance.get(`/admin/doctor/${doctorId}`);
  },

  /**
   * 更新医生排班信息
   */
  updateDoctorSchedule(data: UpdateDoctorScheduleDTO): Promise<UpdateDoctorScheduleResponse> {
    return axiosInstance.put('/admin/doctor/schedule', data);
  },
};

export default adminApi;
