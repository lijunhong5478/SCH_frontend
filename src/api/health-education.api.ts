import axiosInstance from './axios.config'
import type { ApiResponse, PageResult } from '@/types/api.types'
import type { HealthTip, HealthTipVO, HealthTipQuery, PublishHealthTipDTO } from '@/types/health-education.types'

/**
 * 健康宣教相关 API
 */
export const healthEducationApi = {
  /**
   * 分页查询健康宣教
   */
  getPage(params: HealthTipQuery): Promise<ApiResponse<PageResult<HealthTip>>> {
    return axiosInstance.get('/admin/health-tips/page', { params })
  },

  /**
   * 根据ID查询健康宣教详情
   */
  getById(id: number): Promise<ApiResponse<HealthTipVO>> {
    return axiosInstance.get(`/admin/health-tips/${id}`)
  },

  /**
   * 发布健康宣教
   */
  publish(data: PublishHealthTipDTO): Promise<ApiResponse<string>> {
    return axiosInstance.post('/admin/health-tips/publish', data)
  },

  /**
   * 删除健康宣教
   */
  delete(id: number): Promise<ApiResponse<string>> {
    return axiosInstance.delete(`/admin/health-tips/${id}`)
  },
}

export default healthEducationApi
