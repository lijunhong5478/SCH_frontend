import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getDoctorHealthRecordListAPI,
  getHealthRecordDetailAPI,
} from '@/api/health-record.api'
import {
  residentGenderTextMap,
  type DoctorHealthRecord,
  type DoctorHealthRecordQuery,
} from '@/types/health-record.types'

const defaultQuery: Required<Pick<DoctorHealthRecordQuery, 'pageNum' | 'pageSize'>> = {
  pageNum: 1,
  pageSize: 10,
}

export const useHealthRecordStore = defineStore('healthRecord', () => {
  const loading = ref(false)
  const detailLoading = ref(false)
  const recordList = ref<DoctorHealthRecord[]>([])
  const total = ref(0)
  const query = ref<DoctorHealthRecordQuery>({ ...defaultQuery })
  const activeRecord = ref<DoctorHealthRecord | null>(null)

  const hasData = computed(() => recordList.value.length > 0)

  const queryRecordList = async (partialQuery?: DoctorHealthRecordQuery) => {
    loading.value = true
    try {
      query.value = {
        ...query.value,
        ...partialQuery,
      }
      const res = await getDoctorHealthRecordListAPI(query.value)
      recordList.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return recordList.value
    } finally {
      loading.value = false
    }
  }

  const queryRecordDetailByLoginId = async (loginUserId?: number | null) => {
    if (!loginUserId) {
      activeRecord.value = null
      return null
    }

    detailLoading.value = true
    try {
      const res = await getHealthRecordDetailAPI(loginUserId)
      activeRecord.value = res.data || null
      return activeRecord.value
    } finally {
      detailLoading.value = false
    }
  }

  const queryResidentRecord = async (loginUserId?: number | null) => {
    if (!loginUserId) {
      activeRecord.value = null
      return null
    }

    detailLoading.value = true
    try {
      const detailRes = await getHealthRecordDetailAPI(loginUserId)
      activeRecord.value = detailRes.data || null
      return activeRecord.value
    } finally {
      detailLoading.value = false
    }
  }

  const resetQuery = () => {
    query.value = { ...defaultQuery }
  }

  const clearActiveRecord = () => {
    activeRecord.value = null
  }

  const getGenderText = (gender?: number) => {
    if (gender !== 0 && gender !== 1) {
      return '未知'
    }
    return residentGenderTextMap[gender]
  }

  return {
    loading,
    detailLoading,
    recordList,
    total,
    query,
    activeRecord,
    hasData,
    queryRecordList,
    queryRecordDetailByLoginId,
    queryResidentRecord,
    resetQuery,
    clearActiveRecord,
    getGenderText,
  }
})
