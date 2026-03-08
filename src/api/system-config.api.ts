import axiosInstance from './axios.config'
import type { ApiResponse } from '@/types/api.types'
import type { SystemConfig, UpdateSystemConfigDTO } from '@/types/system-config.types'

/**
 * 系统配置相关 API
 */
export const systemConfigApi = {
  /**
   * 查询所有系统配置
   */
  getAll(): Promise<ApiResponse<SystemConfig[]>> {
    return axiosInstance.get('/admin/system-configs')
  },

  /**
   * 更新系统配置
   */
  update(data: UpdateSystemConfigDTO): Promise<ApiResponse<string>> {
    return axiosInstance.put('/admin/system-configs', data)
  },
}

export default systemConfigApi
