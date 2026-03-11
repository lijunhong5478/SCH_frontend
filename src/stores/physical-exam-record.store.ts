import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getPhysicalExamRecordDetailAPI,
  getPhysicalExamRecordListAPI,
  savePhysicalExamRecordAPI,
} from '@/api/physical-exam-record.api'
import type {
  PhysicalExamRecordQuery,
  PhysicalExamRole,
  SavePhysicalExamRecordDTO,
} from '@/types/physical-exam-record.types'
import type { PhysicalExamRecord } from '@/types/health-record.types'

export const usePhysicalExamRecordStore = defineStore('physicalExamRecord', () => {
  const loading = ref(false)
  const detailLoading = ref(false)
  const submitting = ref(false)
  const list = ref<PhysicalExamRecord[]>([])
  const total = ref(0)
  const detail = ref<PhysicalExamRecord | null>(null)

  const queryList = async (role: PhysicalExamRole, query: PhysicalExamRecordQuery) => {
    loading.value = true
    try {
      const res = await getPhysicalExamRecordListAPI(role, query)
      list.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return list.value
    } finally {
      loading.value = false
    }
  }

  const queryDetailById = async (role: PhysicalExamRole, id: number) => {
    detailLoading.value = true
    try {
      const res = await getPhysicalExamRecordDetailAPI(role, id)
      detail.value = res.data || null
      return detail.value
    } finally {
      detailLoading.value = false
    }
  }

  const saveRecord = async (payload: SavePhysicalExamRecordDTO) => {
    submitting.value = true
    try {
      const res = await savePhysicalExamRecordAPI(payload)
      return res
    } finally {
      submitting.value = false
    }
  }

  const clearDetail = () => {
    detail.value = null
  }

  return {
    loading,
    detailLoading,
    submitting,
    list,
    total,
    detail,
    queryList,
    queryDetailById,
    saveRecord,
    clearDetail,
  }
})
