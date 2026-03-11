import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getResidentMedicalHistoryDetailAPI,
  getResidentMedicalHistoryListAPI,
  saveResidentMedicalHistoryAPI,
} from '@/api/resident-medical-history.api'
import type { ResidentMedicalHistory } from '@/types/health-record.types'
import type {
  ResidentMedicalHistoryQuery,
  ResidentMedicalHistoryRole,
  SaveResidentMedicalHistoryDTO,
} from '@/types/resident-medical-history.types'

export const useResidentMedicalHistoryStore = defineStore('residentMedicalHistory', () => {
  const loading = ref(false)
  const detailLoading = ref(false)
  const submitting = ref(false)
  const list = ref<ResidentMedicalHistory[]>([])
  const total = ref(0)
  const detail = ref<ResidentMedicalHistory | null>(null)

  const queryList = async (role: ResidentMedicalHistoryRole, query: ResidentMedicalHistoryQuery) => {
    loading.value = true
    try {
      const res = await getResidentMedicalHistoryListAPI(role, query)
      list.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return list.value
    } finally {
      loading.value = false
    }
  }

  const queryDetailById = async (role: ResidentMedicalHistoryRole, id: number) => {
    detailLoading.value = true
    try {
      const res = await getResidentMedicalHistoryDetailAPI(role, id)
      detail.value = res.data || null
      return detail.value
    } finally {
      detailLoading.value = false
    }
  }

  const saveRecord = async (payload: SaveResidentMedicalHistoryDTO) => {
    submitting.value = true
    try {
      const res = await saveResidentMedicalHistoryAPI(payload)
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
