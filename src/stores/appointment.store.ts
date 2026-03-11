import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cancelResidentAppointmentAPI,
  callAppointmentAPI,
  checkResidentAppointedAPI,
  createResidentAppointmentAPI,
  finishAppointmentAPI,
  getDoctorAppointmentListAPI,
  getResidentAvailableTimeSlotsAPI,
  getResidentAppointmentListAPI,
  skipAppointmentAPI,
  startConsultAppointmentAPI,
} from '@/api/appointment.api'
import type {
  Appointment,
  AppointmentQueryDTO,
  ExactTimeAppointmentDTO,
} from '@/types/appointment.types'
import type { DoctorTimeSlot } from '@/types/resident-doctor.types'
import { ResponseCode } from '@/types/api.types'

export const useAppointmentStore = defineStore('appointment', () => {
  const loading = ref(false)
  const actionLoading = ref<Record<number, boolean>>({})

  const residentAppointments = ref<Appointment[]>([])
  const residentTotal = ref(0)

  const doctorAppointments = ref<Appointment[]>([])
  const doctorTotal = ref(0)

  const residentBooking = ref(false)

  const isDoctorEmpty = computed(() => !loading.value && doctorAppointments.value.length === 0)

  async function fetchResidentAppointments(query: AppointmentQueryDTO) {
    loading.value = true
    try {
      const res = await getResidentAppointmentListAPI(query)
      if (res.code === ResponseCode.SUCCESS && res.data) {
        residentAppointments.value = res.data.dataList || []
        residentTotal.value = res.data.total || 0
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchDoctorAppointments(query: AppointmentQueryDTO) {
    loading.value = true
    try {
      const res = await getDoctorAppointmentListAPI(query)
      if (res.code === ResponseCode.SUCCESS && res.data) {
        doctorAppointments.value = res.data.dataList || []
        doctorTotal.value = res.data.total || 0
      }
    } finally {
      loading.value = false
    }
  }

  async function bookAppointment(payload: ExactTimeAppointmentDTO): Promise<{ success: boolean; queueNo?: string; message: string }> {
    residentBooking.value = true
    try {
      const res = await createResidentAppointmentAPI(payload)
      if (res.code === ResponseCode.SUCCESS) {
        return {
          success: true,
          queueNo: res.data || '',
          message: res.message || '预约成功',
        }
      }

      return {
        success: false,
        message: res.message || '预约失败，请稍后重试',
      }
    } catch {
      return {
        success: false,
        message: '预约失败，请稍后重试',
      }
    } finally {
      residentBooking.value = false
    }
  }

  async function checkIsAppointed(query: AppointmentQueryDTO): Promise<boolean> {
    try {
      const res = await checkResidentAppointedAPI(query)
      if (res.code === ResponseCode.SUCCESS) {
        return Boolean(res.data)
      }
      return false
    } catch {
      return false
    }
  }

  async function fetchAvailableTimeSlots(date: string, doctorId: number): Promise<DoctorTimeSlot[]> {
    try {
      const res = await getResidentAvailableTimeSlotsAPI(date, doctorId)
      if (res.code !== ResponseCode.SUCCESS || !Array.isArray(res.data)) {
        return []
      }

      const normalized = new Set<DoctorTimeSlot>()
      res.data.forEach((slot) => {
        if (slot === 'AM' || slot === 'PM') {
          normalized.add(slot)
        }
      })
      return [...normalized]
    } catch {
      return []
    }
  }

  async function runDoctorAction(
    appointmentId: number,
    action: (id: number) => Promise<{ code: number; message: string }>,
  ): Promise<{ success: boolean; message: string }> {
    actionLoading.value = {
      ...actionLoading.value,
      [appointmentId]: true,
    }

    try {
      const res = await action(appointmentId)
      return {
        success: res.code === ResponseCode.SUCCESS,
        message: res.message || (res.code === ResponseCode.SUCCESS ? '操作成功' : '操作失败'),
      }
    } catch {
      return {
        success: false,
        message: '操作失败，请稍后重试',
      }
    } finally {
      actionLoading.value = {
        ...actionLoading.value,
        [appointmentId]: false,
      }
    }
  }

  async function cancelAppointment(
    appointmentId: number,
    cancelReason?: string,
  ): Promise<{ success: boolean; message: string }> {
    actionLoading.value = {
      ...actionLoading.value,
      [appointmentId]: true,
    }

    try {
      const res = await cancelResidentAppointmentAPI(appointmentId, cancelReason)
      return {
        success: res.code === ResponseCode.SUCCESS,
        message: res.message || (res.code === ResponseCode.SUCCESS ? '取消预约成功' : '取消预约失败'),
      }
    } catch {
      return {
        success: false,
        message: '取消预约失败，请稍后重试',
      }
    } finally {
      actionLoading.value = {
        ...actionLoading.value,
        [appointmentId]: false,
      }
    }
  }

  const callAppointment = (appointmentId: number) => runDoctorAction(appointmentId, callAppointmentAPI)

  const skipAppointment = (appointmentId: number) => runDoctorAction(appointmentId, skipAppointmentAPI)

  const startConsultAppointment = (appointmentId: number) => runDoctorAction(appointmentId, startConsultAppointmentAPI)

  const finishAppointment = (appointmentId: number) => runDoctorAction(appointmentId, finishAppointmentAPI)

  function isRowActionLoading(appointmentId: number) {
    return Boolean(actionLoading.value[appointmentId])
  }

  return {
    loading,
    residentBooking,
    residentAppointments,
    residentTotal,
    doctorAppointments,
    doctorTotal,
    isDoctorEmpty,
    fetchResidentAppointments,
    fetchDoctorAppointments,
    bookAppointment,
    cancelAppointment,
    checkIsAppointed,
    fetchAvailableTimeSlots,
    callAppointment,
    skipAppointment,
    startConsultAppointment,
    finishAppointment,
    isRowActionLoading,
  }
})
