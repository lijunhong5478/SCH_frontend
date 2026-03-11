import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DoctorSchedule, UpdateDoctorScheduleDTO } from '@/types/api.types'
import { adminApi } from '@/api/admin.api'
import { getDoctorAccount } from '@/api/doctor.api'

export const useDoctorScheduleStore = defineStore('doctorSchedule', () => {
  const scheduleList = ref<DoctorSchedule[]>([])
  const loading = ref(false)
  const currentDoctorId = ref<number | null>(null)
  const doctorName = ref('')
  const departmentName = ref('')

  /**
   * 根据医生ID获取排班信息
   */
  const getDoctorSchedule = async (doctorId: number) => {
    loading.value = true
    try {
      try {
        const res = await getDoctorAccount(doctorId)
        scheduleList.value = res.data?.doctorSchedules || []
        doctorName.value = res.data?.name || ''
        departmentName.value = res.data?.departmentName || ''
      } catch {
        // Fallback for existing admin schedule editor flow.
        const res = await adminApi.getDoctorSchedule(doctorId)
        scheduleList.value = res.data
        doctorName.value = ''
        departmentName.value = ''
      }
      currentDoctorId.value = doctorId
      return scheduleList.value
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新医生排班信息
   */
  const updateDoctorSchedule = async (data: UpdateDoctorScheduleDTO) => {
    loading.value = true
    try {
      const res = await adminApi.updateDoctorSchedule(data)
      return res
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新单个排班项的状态或最大叫号数
   */
  const updateSingleSchedule = (scheduleId: number, updates: { maxNumber?: number; status?: number }) => {
    const schedule = scheduleList.value.find(s => s.id === scheduleId)
    if (schedule) {
      if (updates.maxNumber !== undefined) {
        schedule.maxNumber = updates.maxNumber
      }
      if (updates.status !== undefined) {
        schedule.status = updates.status
      }
    }
  }

  /**
   * 获取格式化的周名称
   */
  const getWeekDayName = (weekDay: number): string => {
    const weekNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return weekNames[weekDay] || ''
  }

  /**
   * 获取时间段名称
   */
  const getTimeSlotName = (timeSlot: 'AM' | 'PM'): string => {
    return timeSlot === 'AM' ? '上午' : '下午'
  }

  /**
   * 获取状态名称
   */
  const getStatusName = (status: number): string => {
    return status === 1 ? '正常' : '停诊'
  }

  /**
   * 重置状态
   */
  const reset = () => {
    scheduleList.value = []
    currentDoctorId.value = null
    doctorName.value = ''
    departmentName.value = ''
    loading.value = false
  }

  return {
    scheduleList,
    loading,
    currentDoctorId,
    doctorName,
    departmentName,
    getDoctorSchedule,
    updateDoctorSchedule,
    updateSingleSchedule,
    getWeekDayName,
    getTimeSlotName,
    getStatusName,
    reset
  }
})