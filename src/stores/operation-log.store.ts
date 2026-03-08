import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OperationLog, OperationLogQuery } from '@/types/operation-log.types'
import { operationLogApi } from '@/api/operation-log.api'
import { ResponseCode } from '@/types/api.types'

export const useOperationLogStore = defineStore('operationLog', () => {
  // 状态
  const logList = ref<OperationLog[]>([])
  const total = ref(0)
  const loading = ref(false)
  const deleteLoading = ref(false)

  // 查询参数
  const queryParams = ref<OperationLogQuery>({
    pageNum: 1,
    pageSize: 15,
    startDate: undefined,
    endDate: undefined,
  })

  // 计算属性
  const isEmpty = computed(() => {
    return !loading.value && logList.value.length === 0
  })

  // 方法
  /**
   * 分页查询操作日志
   */
  const fetchLogs = async (params?: Partial<OperationLogQuery>) => {
    loading.value = true
    try {
      // 合并查询参数
      if (params) {
        Object.assign(queryParams.value, params)
      }

      // 构建请求参数，过滤空值
      const requestParams: OperationLogQuery = {
        pageNum: queryParams.value.pageNum,
        pageSize: queryParams.value.pageSize,
      }

      if (queryParams.value.startDate) {
        requestParams.startDate = queryParams.value.startDate
      }

      if (queryParams.value.endDate) {
        requestParams.endDate = queryParams.value.endDate
      }

      const res = await operationLogApi.getPage(requestParams)

      if (res.code === ResponseCode.SUCCESS) {
        logList.value = res.data.dataList || []
        total.value = res.data.total || 0
      } else {
        console.error('获取操作日志列表失败:', res.message)
      }
    } catch (error) {
      console.error('获取操作日志列表异常:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除操作日志
   */
  const deleteLog = async (id: number): Promise<{ success: boolean; message: string }> => {
    deleteLoading.value = true
    try {
      const res = await operationLogApi.delete(id)

      if (res.code === ResponseCode.SUCCESS) {
        // 删除成功后刷新列表
        await fetchLogs()
        return { success: true, message: res.message || '删除成功' }
      } else {
        return { success: false, message: res.message || '删除失败' }
      }
    } catch (error) {
      console.error('删除操作日志异常:', error)
      return { success: false, message: '删除失败，请稍后重试' }
    } finally {
      deleteLoading.value = false
    }
  }

  /**
   * 更新查询参数并重新查询
   */
  const updateQuery = async (params: Partial<OperationLogQuery>) => {
    queryParams.value.pageNum = 1 // 重置页码
    await fetchLogs(params)
  }

  /**
   * 切换页码
   */
  const changePage = async (pageNum: number) => {
    await fetchLogs({ pageNum })
  }

  /**
   * 切换每页大小
   */
  const changePageSize = async (pageSize: number) => {
    queryParams.value.pageNum = 1
    await fetchLogs({ pageSize })
  }

  /**
   * 重置查询条件
   */
  const resetQuery = async () => {
    queryParams.value = {
      pageNum: 1,
      pageSize: 15,
      startDate: undefined,
      endDate: undefined,
    }
    await fetchLogs()
  }

  return {
    // 状态
    logList,
    total,
    loading,
    deleteLoading,
    queryParams,
    // 计算属性
    isEmpty,
    // 方法
    fetchLogs,
    deleteLog,
    updateQuery,
    changePage,
    changePageSize,
    resetQuery,
  }
})
