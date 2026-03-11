import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  checkDoctorDiagnosisPermissionAPI,
  getDiagnosisReportListAPI,
  getMedicalVisitDetailAPI,
  updateDoctorDiagnosisReportAPI,
} from '@/api/diagnosis-report.api'
import type {
  DiagnosisReportQuery,
  DiagnosisRole,
  MedicalVisitDetail,
  UpdateDiagnosisReportDTO,
} from '@/types/diagnosis-report.types'
import type { DiagnosisReport } from '@/types/health-record.types'

export const useDiagnosisReportStore = defineStore('diagnosisReport', () => {
  const loading = ref(false)
  const submitting = ref(false)
  const list = ref<DiagnosisReport[]>([])
  const total = ref(0)
  const visitDetail = ref<MedicalVisitDetail | null>(null)

  const queryList = async (role: DiagnosisRole, query: DiagnosisReportQuery) => {
    loading.value = true
    try {
      const res = await getDiagnosisReportListAPI(role, query)
      list.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return list.value
    } finally {
      loading.value = false
    }
  }

  const queryVisitDetail = async (role: DiagnosisRole, visitId: number) => {
    const res = await getMedicalVisitDetailAPI(role, visitId)
    visitDetail.value = res.data || null
    return visitDetail.value
  }

  const checkDoctorPermission = async (diagnosisId: number, doctorId: number) => {
    const res = await checkDoctorDiagnosisPermissionAPI(diagnosisId, doctorId)
    return Boolean(res.data)
  }

  const updateDoctorDiagnosis = async (payload: UpdateDiagnosisReportDTO) => {
    submitting.value = true
    try {
      const res = await updateDoctorDiagnosisReportAPI(payload)
      return res
    } finally {
      submitting.value = false
    }
  }

  const clearVisitDetail = () => {
    visitDetail.value = null
  }

  return {
    loading,
    submitting,
    list,
    total,
    visitDetail,
    queryList,
    queryVisitDetail,
    checkDoctorPermission,
    updateDoctorDiagnosis,
    clearVisitDetail,
  }
})
