import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getResidentDoctorListAPI } from '@/api/resident-doctor.api'
import {
  doctorGenderTextMap,
  doctorTitleTextMap,
  timeSlotTextMap,
  weekDayTextMap,
  type DoctorTimeSlot,
  type ResidentDoctor,
  type ResidentDoctorQuery,
} from '@/types/resident-doctor.types'

const defaultQuery: Required<Pick<ResidentDoctorQuery, 'pageNum' | 'pageSize'>> = {
  pageNum: 1,
  pageSize: 10,
}

export const useResidentDoctorStore = defineStore('residentDoctor', () => {
  const loading = ref(false)
  const doctorList = ref<ResidentDoctor[]>([])
  const total = ref(0)

  const query = ref<ResidentDoctorQuery>({ ...defaultQuery })

  const hasData = computed(() => doctorList.value.length > 0)

  const queryDoctorList = async (partialQuery?: ResidentDoctorQuery) => {
    loading.value = true
    try {
      query.value = {
        ...query.value,
        ...partialQuery,
      }
      const res = await getResidentDoctorListAPI(query.value)
      doctorList.value = res.data?.dataList || []
      total.value = res.data?.total || 0
      return doctorList.value
    } finally {
      loading.value = false
    }
  }

  const resetQuery = () => {
    query.value = { ...defaultQuery }
  }

  const getDoctorTitleText = (title?: number) => {
    if (!title || !(title in doctorTitleTextMap)) {
      return '未知职称'
    }
    return doctorTitleTextMap[title as keyof typeof doctorTitleTextMap]
  }

  const getGenderText = (gender?: number) => {
    if (gender !== 0 && gender !== 1) {
      return '未知'
    }
    return doctorGenderTextMap[gender]
  }

  const getTimeSlotText = (timeSlot: DoctorTimeSlot) => {
    return timeSlotTextMap[timeSlot] || ''
  }

  const getWeekDayText = (weekDay: number) => {
    return weekDayTextMap[weekDay] || ''
  }

  const getScheduleBrief = (doctor: ResidentDoctor) => {
    const schedules = doctor.doctorSchedules || []
    if (!schedules.length) {
      return '暂无排班信息'
    }

    return schedules
      .slice(0, 3)
      .map((item) => `${getWeekDayText(item.weekDay)}${getTimeSlotText(item.timeSlot)}`)
      .join('、')
  }

  const getFullScheduleText = (doctor: ResidentDoctor) => {
    const schedules = doctor.doctorSchedules || []
    if (!schedules.length) {
      return '暂无排班信息'
    }

    return schedules
      .map((item) => `${getWeekDayText(item.weekDay)}${getTimeSlotText(item.timeSlot)}`)
      .join('、')
  }

  return {
    loading,
    doctorList,
    total,
    query,
    hasData,
    queryDoctorList,
    resetQuery,
    getDoctorTitleText,
    getGenderText,
    getTimeSlotText,
    getWeekDayText,
    getScheduleBrief,
    getFullScheduleText,
  }
})
