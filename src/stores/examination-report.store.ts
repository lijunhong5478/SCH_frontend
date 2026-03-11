import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getExaminationReportDetailAPI,
  getExaminationReportListAPI,
  saveExaminationReportsAPI,
} from '@/api/examination-report.api'
import {
  examinationReportTypeTextMap,
  type ExaminationReportQuery,
  type SaveExaminationReportDTO,
} from '@/types/examination-report.types'
import type { ExaminationReport } from '@/types/health-record.types'

export const useExaminationReportStore = defineStore('examinationReport', () => {
  const loading = ref(false)
  const detailLoading = ref(false)
  const submitting = ref(false)
  const list = ref<ExaminationReport[]>([])
  const total = ref(0)
  const detail = ref<ExaminationReport | null>(null)

  const queryList = async (query: ExaminationReportQuery) => {
    loading.value = true
    try {
      const res = await getExaminationReportListAPI(query)
      list.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return list.value
    } finally {
      loading.value = false
    }
  }

  const queryDetailById = async (id: number) => {
    detailLoading.value = true
    try {
      const res = await getExaminationReportDetailAPI(id)
      detail.value = res.data || null
      return detail.value
    } finally {
      detailLoading.value = false
    }
  }

  const saveReports = async (payload: SaveExaminationReportDTO[]) => {
    submitting.value = true
    try {
      const res = await saveExaminationReportsAPI(payload)
      return res
    } finally {
      submitting.value = false
    }
  }

  const getReportTypeText = (reportType?: number) => {
    if (!reportType) {
      return '未知类型'
    }
    return examinationReportTypeTextMap[reportType] || `类型${reportType}`
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
    saveReports,
    getReportTypeText,
    clearDetail,
  }
})