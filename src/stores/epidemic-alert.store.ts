import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { epidemicAlertApi } from '@/api/epidemic-alert.api'
import type { EpidemicAlert, EpidemicAlertQuery, PublishEpidemicAlertDTO } from '@/types/epidemic-alert.types'
import { ResponseCode } from '@/types/api.types'

export const useEpidemicAlertStore = defineStore('epidemicAlert', () => {
  // 状态
  const alertList = ref<EpidemicAlert[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentDetail = ref<EpidemicAlert | null>(null)
  const detailLoading = ref(false)
  const publishLoading = ref(false)
  const deleteLoading = ref(false)

  // 查询参数
  const queryParams = ref<EpidemicAlertQuery>({
    page: 1,
    pageSize: 2,
    region: '',
    riskLevel: undefined,
    startTime: undefined,
    endTime: undefined,
  })

  // 计算属性
  const isEmpty = computed(() => {
    return !loading.value && alertList.value.length === 0
  })

  /**
   * 分页查询疫情预警
   */
  const fetchAlerts = async (params?: Partial<EpidemicAlertQuery>) => {
    loading.value = true
    try {
      if (params) {
        Object.assign(queryParams.value, params)
      }

      const requestParams: EpidemicAlertQuery = {
        page: queryParams.value.page,
        pageSize: queryParams.value.pageSize,
      }

      if (queryParams.value.region?.trim()) {
        requestParams.region = queryParams.value.region.trim()
      }

      if (queryParams.value.riskLevel !== undefined) {
        requestParams.riskLevel = queryParams.value.riskLevel
      }

      if (queryParams.value.startTime) {
        requestParams.startTime = queryParams.value.startTime
      }

      if (queryParams.value.endTime) {
        requestParams.endTime = queryParams.value.endTime
      }

      const res = await epidemicAlertApi.getPage(requestParams)
      if (res.code === ResponseCode.SUCCESS) {
        alertList.value = res.data.dataList || []
        total.value = res.data.total || 0
      } else {
        console.error('获取疫情预警列表失败:', res.message)
      }
    } catch (error) {
      console.error('获取疫情预警列表异常:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID查询疫情预警详情
   */
  const fetchAlertById = async (id: number) => {
    detailLoading.value = true
    try {
      const res = await epidemicAlertApi.getById(id)
      if (res.code === ResponseCode.SUCCESS) {
        currentDetail.value = res.data
        return res.data
      }
      console.error('获取疫情预警详情失败:', res.message)
      return null
    } catch (error) {
      console.error('获取疫情预警详情异常:', error)
      return null
    } finally {
      detailLoading.value = false
    }
  }

  /**
   * 清空详情
   */
  const clearDetail = () => {
    currentDetail.value = null
  }

  /**
   * 发布疫情预警
   */
  const publishAlert = async (data: PublishEpidemicAlertDTO): Promise<{ success: boolean; message: string }> => {
    publishLoading.value = true
    try {
      const res = await epidemicAlertApi.publish(data)
      if (res.code === ResponseCode.SUCCESS) {
        await fetchAlerts()
        return { success: true, message: res.message || '发布成功' }
      }
      return { success: false, message: res.message || '发布失败' }
    } catch (error) {
      console.error('发布疫情预警异常:', error)
      return { success: false, message: '发布失败，请稍后重试' }
    } finally {
      publishLoading.value = false
    }
  }

  /**
   * 删除疫情预警
   */
  const deleteAlert = async (id: number): Promise<{ success: boolean; message: string }> => {
    deleteLoading.value = true
    try {
      const res = await epidemicAlertApi.delete(id)
      if (res.code === ResponseCode.SUCCESS) {
        await fetchAlerts()
        return { success: true, message: res.message || '删除成功' }
      }
      return { success: false, message: res.message || '删除失败' }
    } catch (error) {
      console.error('删除疫情预警异常:', error)
      return { success: false, message: '删除失败，请稍后重试' }
    } finally {
      deleteLoading.value = false
    }
  }

  /**
   * 更新查询条件并重置到第一页
   */
  const updateQuery = async (params: Partial<EpidemicAlertQuery>) => {
    queryParams.value.page = 1
    await fetchAlerts(params)
  }

  /**
   * 切换页码
   */
  const changePage = async (page: number) => {
    await fetchAlerts({ page })
  }

  /**
   * 切换每页大小
   */
  const changePageSize = async (pageSize: number) => {
    queryParams.value.page = 1
    await fetchAlerts({ pageSize })
  }

  /**
   * 重置查询参数
   */
  const resetQuery = async () => {
    queryParams.value = {
      page: 1,
      pageSize: 2,
      region: '',
      riskLevel: undefined,
      startTime: undefined,
      endTime: undefined,
    }
    await fetchAlerts()
  }

  return {
    alertList,
    total,
    loading,
    currentDetail,
    detailLoading,
    publishLoading,
    deleteLoading,
    queryParams,
    isEmpty,
    fetchAlerts,
    fetchAlertById,
    clearDetail,
    publishAlert,
    deleteAlert,
    updateQuery,
    changePage,
    changePageSize,
    resetQuery,
  }
})
