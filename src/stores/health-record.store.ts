import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDoctorHealthRecordListAPI } from '@/api/health-record.api'
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
  const recordList = ref<DoctorHealthRecord[]>([])
  const total = ref(0)
  const query = ref<DoctorHealthRecordQuery>({ ...defaultQuery })

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

  const resetQuery = () => {
    query.value = { ...defaultQuery }
  }

  const getGenderText = (gender?: number) => {
    if (gender !== 0 && gender !== 1) {
      return '未知'
    }
    return residentGenderTextMap[gender]
  }

  return {
    loading,
    recordList,
    total,
    query,
    hasData,
    queryRecordList,
    resetQuery,
    getGenderText,
  }
})
