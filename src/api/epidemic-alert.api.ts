import axiosInstance from './axios.config'
import type { ApiResponse, PageResult } from '@/types/api.types'
import type { EpidemicAlert, EpidemicAlertQuery, PublishEpidemicAlertDTO } from '@/types/epidemic-alert.types'

/**
 * 疫情预警相关 API
 */
export const epidemicAlertApi = {
  /**
   * 分页查询疫情预警
   */
  getPage(params: EpidemicAlertQuery): Promise<ApiResponse<PageResult<EpidemicAlert>>> {
    return axiosInstance.get('/admin/epidemic-alerts/page', { params })
  },

  /**
   * 根据ID查询疫情预警详情
   */
  getById(id: number): Promise<ApiResponse<EpidemicAlert>> {
    return axiosInstance.get(`/admin/epidemic-alerts/${id}`)
  },

  /**
   * 发布疫情预警
   */
  publish(data: PublishEpidemicAlertDTO): Promise<ApiResponse<string>> {
    return axiosInstance.post('/admin/epidemic-alerts/publish', data)
  },

  /**
   * 删除疫情预警
   */
  delete(id: number): Promise<ApiResponse<string>> {
    return axiosInstance.delete(`/admin/epidemic-alerts/${id}`)
  },
}

export default epidemicAlertApi
