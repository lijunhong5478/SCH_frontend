import axiosInstance from './axios.config'
import type { ApiResponse, PageResult } from '@/types/api.types'
import type { OperationLog, OperationLogQuery } from '@/types/operation-log.types'

/**
 * 操作日志相关 API
 */
export const operationLogApi = {
  /**
   * 分页查询操作日志
   */
  getPage(params: OperationLogQuery): Promise<ApiResponse<PageResult<OperationLog>>> {
    return axiosInstance.get('/admin/operationLog/list', { params })
  },

  /**
   * 删除操作日志
   */
  delete(id: number): Promise<ApiResponse<string>> {
    return axiosInstance.delete(`/admin/operationLog/${id}`)
  },
}

export default operationLogApi
