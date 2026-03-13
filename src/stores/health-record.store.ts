import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getDoctorHealthRecordListAPI,
  getDoctorMyPatientHealthRecordListAPI,
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

      if (query.value.doctorId) {
        const exactName = query.value.realName?.trim()
        const exactPhone = query.value.phone?.trim()
        const exactIdCard = query.value.idCard?.trim()
        const needExactFilter = Boolean(exactName || exactPhone || exactIdCard)

        const pageNum = Math.max(1, Number(query.value.pageNum) || defaultQuery.pageNum)
        const pageSize = Math.max(1, Number(query.value.pageSize) || defaultQuery.pageSize)

        const enrichRecords = async (items: DoctorHealthRecord[]) => {
          return await Promise.all(
            items.map(async (item) => {
              const residentId = Number(item.residentId)
              if (!Number.isFinite(residentId) || residentId <= 0) {
                return item
              }

              try {
                const detailRes = await getHealthRecordDetailAPI(residentId)
                const detail = detailRes.data
                if (!detail) {
                  return item
                }

                return {
                  ...detail,
                  ...item,
                  residentId,
                  title: item.title || detail.title,
                }
              } catch {
                return item
              }
            }),
          )
        }

        if (needExactFilter) {
          const firstPageRes = await getDoctorMyPatientHealthRecordListAPI({
            doctorId: query.value.doctorId,
            pageNum: 1,
            pageSize: 50,
          })
          const firstPageData = firstPageRes.data
          const totalCount = Number(firstPageData?.total || 0)
          const allRaw = [...(firstPageData?.dataList || [])]
          const totalPages = Math.max(1, Math.ceil(totalCount / 50))

          if (totalPages > 1) {
            const restPages = await Promise.all(
              Array.from({ length: totalPages - 1 }).map((_, index) =>
                getDoctorMyPatientHealthRecordListAPI({
                  doctorId: query.value.doctorId,
                  pageNum: index + 2,
                  pageSize: 50,
                }),
              ),
            )
            restPages.forEach((res) => {
              allRaw.push(...(res.data?.dataList || []))
            })
          }

          const enrichedAll = await enrichRecords(allRaw)
          const exactFiltered = enrichedAll.filter((item) => {
            const matchedName = exactName ? (item.name || '').trim() === exactName : true
            const matchedPhone = exactPhone ? (item.phone || '').trim() === exactPhone : true
            const matchedIdCard = exactIdCard ? (item.idCard || '').trim() === exactIdCard : true
            return matchedName && matchedPhone && matchedIdCard
          })

          total.value = exactFiltered.length
          const start = (pageNum - 1) * pageSize
          recordList.value = exactFiltered.slice(start, start + pageSize)
          return recordList.value
        }

        const myPatientRes = await getDoctorMyPatientHealthRecordListAPI({
          doctorId: query.value.doctorId,
          pageNum,
          pageSize,
        })
        const rawList = myPatientRes.data?.dataList || []
        total.value = myPatientRes.data?.total || 0

        recordList.value = await enrichRecords(rawList)
        return recordList.value
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
