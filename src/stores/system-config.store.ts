import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { systemConfigApi } from '@/api/system-config.api'
import { ResponseCode } from '@/types/api.types'
import type { SystemConfig, UpdateSystemConfigDTO } from '@/types/system-config.types'

export const useSystemConfigStore = defineStore('systemConfig', () => {
  const configList = ref<SystemConfig[]>([])
  const loading = ref(false)
  const savingId = ref<number | null>(null)

  const isEmpty = computed(() => !loading.value && configList.value.length === 0)

  /**
   * 查询全部系统配置
   */
  const fetchConfigs = async () => {
    loading.value = true
    try {
      const res = await systemConfigApi.getAll()
      if (res.code === ResponseCode.SUCCESS) {
        configList.value = Array.isArray(res.data) ? res.data : []
      } else {
        console.error('获取系统配置失败:', res.message)
      }
    } catch (error) {
      console.error('获取系统配置异常:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新单条系统配置
   */
  const updateConfig = async (payload: UpdateSystemConfigDTO): Promise<{ success: boolean; message: string }> => {
    savingId.value = payload.id
    try {
      const res = await systemConfigApi.update(payload)
      if (res.code === ResponseCode.SUCCESS) {
        const idx = configList.value.findIndex((item) => item.id === payload.id)
        if (idx !== -1) {
          const current = configList.value[idx]
          if (!current) {
            return { success: true, message: res.message || '保存成功' }
          }

          configList.value[idx] = {
            ...current,
            ...payload,
            updateTime: payload.updateTime || current.updateTime,
          }
        }
        return { success: true, message: res.message || '保存成功' }
      }
      return { success: false, message: res.message || '保存失败' }
    } catch (error) {
      console.error('更新系统配置异常:', error)
      return { success: false, message: '保存失败，请稍后重试' }
    } finally {
      savingId.value = null
    }
  }

  return {
    configList,
    loading,
    savingId,
    isEmpty,
    fetchConfigs,
    updateConfig,
  }
})
