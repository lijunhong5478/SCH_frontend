import axiosInstance from './axios.config';
import type {
  LoginDTO,
  LoginResponse,
  ChangePasswordDTO,
  ChangePasswordResponse,
} from '@/types/api.types';

/**
 * 认证相关API服务
 */
export const authApi = {
  /**
   * 用户登录
   * @param data 登录请求数据
   * @returns 登录响应
   */
  login(data: LoginDTO): Promise<LoginResponse> {
    return axiosInstance.post('/common/user/login', data);
  },

  /**
   * 退出登录
   * @returns 退出响应
   */
  logout(): Promise<void> {
    return axiosInstance.post('/common/user/logout');
  },

  /**
   * 修改当前登录用户密码
   * @param data 旧密码和新密码
   * @returns 修改结果
   */
  changePassword(data: ChangePasswordDTO): Promise<ChangePasswordResponse> {
    return axiosInstance.put('/common/user/password', null, {
      params: {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      },
    });
  },
};

export default authApi;