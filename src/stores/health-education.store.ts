import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HealthTip, HealthTipVO, HealthTipQuery, PublishHealthTipDTO } from '@/types/health-education.types'
import { healthEducationApi } from '@/api/health-education.api'
import { ResponseCode } from '@/types/api.types'

export const useHealthEducationStore = defineStore('healthEducation', () => {
  // 状态
  const healthTipList = ref<HealthTip[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentDetail = ref<HealthTipVO | null>(null)
  const detailLoading = ref(false)
  const publishLoading = ref(false)
  const deleteLoading = ref(false)

  // 查询参数
  const queryParams = ref<HealthTipQuery>({
    page: 1,
    pageSize: 15,
    title: '',
    type: undefined,
    startTime: undefined,
    endTime: undefined,
  })

  // 计算属性
  const hasMore = computed(() => {
    return healthTipList.value.length < total.value
  })

  const isEmpty = computed(() => {
    return !loading.value && healthTipList.value.length === 0
  })

  // 方法
  /**
   * 分页查询健康宣教
   */
  const fetchHealthTips = async (params?: Partial<HealthTipQuery>) => {
    loading.value = true
    try {
      // 合并查询参数
      if (params) {
        Object.assign(queryParams.value, params)
      }

      // 构建请求参数，过滤空值
      const requestParams: HealthTipQuery = {
        page: queryParams.value.page,
        pageSize: queryParams.value.pageSize,
      }

      if (queryParams.value.title?.trim()) {
        requestParams.title = queryParams.value.title.trim()
      }

      if (queryParams.value.type !== undefined) {
        requestParams.type = queryParams.value.type
      }

      if (queryParams.value.startTime) {
        requestParams.startTime = queryParams.value.startTime
      }

      if (queryParams.value.endTime) {
        requestParams.endTime = queryParams.value.endTime
      }

      const res = await healthEducationApi.getPage(requestParams)

      if (res.code === ResponseCode.SUCCESS) {
        healthTipList.value = res.data.dataList || []
        total.value = res.data.total || 0
      } else {
        console.error('获取健康宣教列表失败:', res.message)
      }
    } catch (error) {
      console.error('获取健康宣教列表异常:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取健康宣教详情
   */
  const fetchHealthTipById = async (id: number) => {
    detailLoading.value = true
    try {
      const res = await healthEducationApi.getById(id)

      if (res.code === ResponseCode.SUCCESS) {
        currentDetail.value = res.data
        return res.data
      } else {
        console.error('获取健康宣教详情失败:', res.message)
        return null
      }
    } catch (error) {
      console.error('获取健康宣教详情异常:', error)
      return null
    } finally {
      detailLoading.value = false
    }
  }

  /**
   * 更新查询参数并重新查询
   */
  const updateQuery = async (params: Partial<HealthTipQuery>) => {
    queryParams.value.page = 1 // 重置页码
    await fetchHealthTips(params)
  }

  /**
   * 切换页码
   */
  const changePage = async (page: number) => {
    await fetchHealthTips({ page })
  }

  /**
   * 切换每页大小
   */
  const changePageSize = async (pageSize: number) => {
    queryParams.value.page = 1
    await fetchHealthTips({ pageSize })
  }

  /**
   * 重置查询条件
   */
  const resetQuery = async () => {
    queryParams.value = {
      page: 1,
      pageSize: 15,
      title: '',
      type: undefined,
      startTime: undefined,
      endTime: undefined,
    }
    await fetchHealthTips()
  }

  /**
   * 清除详情
   */
  const clearDetail = () => {
    currentDetail.value = null
  }

  /**
   * 发布健康宣教
   */
  const publishHealthTip = async (data: PublishHealthTipDTO): Promise<{ success: boolean; message: string }> => {
    publishLoading.value = true
    try {
      const res = await healthEducationApi.publish(data)

      if (res.code === ResponseCode.SUCCESS) {
        // 发布成功后刷新列表
        await fetchHealthTips()
        return { success: true, message: res.message || '发布成功' }
      } else {
        return { success: false, message: res.message || '发布失败' }
      }
    } catch (error) {
      console.error('发布健康宣教异常:', error)
      return { success: false, message: '发布失败，请稍后重试' }
    } finally {
      publishLoading.value = false
    }
  }

  /**
   * 删除健康宣教
   */
  const deleteHealthTip = async (id: number): Promise<{ success: boolean; message: string }> => {
    deleteLoading.value = true
    try {
      const res = await healthEducationApi.delete(id)

      if (res.code === ResponseCode.SUCCESS) {
        // 删除成功后刷新列表
        await fetchHealthTips()
        return { success: true, message: res.message || '删除成功' }
      } else {
        return { success: false, message: res.message || '删除失败' }
      }
    } catch (error) {
      console.error('删除健康宣教异常:', error)
      return { success: false, message: '删除失败，请稍后重试' }
    } finally {
      deleteLoading.value = false
    }
  }

  return {
    // 状态
    healthTipList,
    total,
    loading,
    currentDetail,
    detailLoading,
    queryParams,
    publishLoading,
    deleteLoading,
    // 计算属性
    hasMore,
    isEmpty,
    // 方法
    fetchHealthTips,
    fetchHealthTipById,
    updateQuery,
    changePage,
    changePageSize,
    resetQuery,
    clearDetail,
    publishHealthTip,
    deleteHealthTip,
  }
})
