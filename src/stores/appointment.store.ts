import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cancelResidentAppointmentAPI,
  callAppointmentAPI,
  checkResidentAppointedAPI,
  createDoctorDiagnosisReportAPI,
  createDoctorMedicalVisitAPI,
  createResidentAppointmentAPI,
  finishAppointmentAPI,
  getDoctorDiagnosisByVisitIdAPI,
  getDoctorAppointmentListAPI,
  getDoctorAppointmentRealNameAPI,
  getDoctorMedicalVisitByIdAPI,
  getDoctorMedicalVisitByAppointIdAPI,
  getDoctorMedicalVisitListAPI,
  getResidentAvailableTimeSlotsAPI,
  getResidentAppointmentListAPI,
  skipAppointmentAPI,
  startConsultAppointmentAPI,
} from '@/api/appointment.api'
import { getResidentHealthRecordIdAPI } from '@/api/health-record.api'
import type {
  Appointment,
  AppointmentQueryDTO,
  CreateDiagnosisReportDTO,
  CreateMedicalVisitDTO,
  DoctorMedicalVisitQueryDTO,
  DoctorMedicalVisitRecord,
  ExactTimeAppointmentDTO,
  MedicalVisit,
} from '@/types/appointment.types'
import type { DoctorTimeSlot } from '@/types/resident-doctor.types'
import { ResponseCode } from '@/types/api.types'
import type { DiagnosisReport } from '@/types/health-record.types'

export const useAppointmentStore = defineStore('appointment', () => {
  const loading = ref(false)
  const actionLoading = ref<Record<number, boolean>>({})

  const residentAppointments = ref<Appointment[]>([])
  const residentTotal = ref(0)

  const doctorAppointments = ref<Appointment[]>([])
  const doctorTotal = ref(0)
  const residentRealNameMap = ref<Record<number, string>>({})
  const medicalVisitLoading = ref(false)
  const medicalVisitDetail = ref<MedicalVisit | null>(null)
  const doctorMedicalVisitListLoading = ref(false)
  const doctorMedicalVisitList = ref<DoctorMedicalVisitRecord[]>([])
  const doctorMedicalVisitTotal = ref(0)
  const doctorMedicalVisitDetailLoading = ref(false)
  const doctorMedicalVisitDetail = ref<DoctorMedicalVisitRecord | null>(null)
  const diagnosisLoading = ref(false)
  const diagnosisDetail = ref<DiagnosisReport | null>(null)

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
        await resolveDoctorAppointmentResidentNames(doctorAppointments.value)
      }
    } finally {
      loading.value = false
    }
  }

  async function resolveDoctorAppointmentResidentNames(appointments: Appointment[]) {
    const residentIds = [...new Set(appointments.map((item) => Number(item.residentId)).filter((id) => Number.isFinite(id) && id > 0))]
    const unresolvedIds = residentIds.filter((id) => !residentRealNameMap.value[id])

    if (!unresolvedIds.length) {
      return
    }

    const pairs = await Promise.all(
      unresolvedIds.map(async (residentId) => {
        try {
          const res = await getDoctorAppointmentRealNameAPI(residentId)
          return [residentId, res.data || `居民${residentId}`] as const
        } catch {
          return [residentId, `居民${residentId}`] as const
        }
      }),
    )

    residentRealNameMap.value = {
      ...residentRealNameMap.value,
      ...Object.fromEntries(pairs),
    }
  }

  function getResidentRealNameById(residentId: number) {
    return residentRealNameMap.value[residentId] || `居民${residentId}`
  }

  async function getMedicalVisitByAppointId(appointId: number) {
    medicalVisitLoading.value = true
    try {
      const res = await getDoctorMedicalVisitByAppointIdAPI(appointId)
      medicalVisitDetail.value = res.data || null
      return medicalVisitDetail.value
    } finally {
      medicalVisitLoading.value = false
    }
  }

  async function queryMedicalVisitByAppointIdRaw(appointId: number) {
    const res = await getDoctorMedicalVisitByAppointIdAPI(appointId)
    return res.data || null
  }

  async function createMedicalVisit(payload: CreateMedicalVisitDTO) {
    medicalVisitLoading.value = true
    try {
      const res = await createDoctorMedicalVisitAPI(payload)
      return res
    } finally {
      medicalVisitLoading.value = false
    }
  }

  async function fetchDoctorMedicalVisitList(query: DoctorMedicalVisitQueryDTO) {
    doctorMedicalVisitListLoading.value = true
    try {
      const res = await getDoctorMedicalVisitListAPI(query)
      if (res.code === ResponseCode.SUCCESS && res.data) {
        doctorMedicalVisitList.value = res.data.dataList || []
        doctorMedicalVisitTotal.value = res.data.total || 0
      }
    } finally {
      doctorMedicalVisitListLoading.value = false
    }
  }

  async function fetchDoctorMedicalVisitById(id: number) {
    doctorMedicalVisitDetailLoading.value = true
    try {
      const res = await getDoctorMedicalVisitByIdAPI(id)
      doctorMedicalVisitDetail.value = res.code === ResponseCode.SUCCESS ? (res.data || null) : null
      return doctorMedicalVisitDetail.value
    } finally {
      doctorMedicalVisitDetailLoading.value = false
    }
  }

  function clearDoctorMedicalVisitDetail() {
    doctorMedicalVisitDetail.value = null
  }

  async function ensureMedicalVisitByAppointment(appointment: Appointment, doctorId: number) {
    medicalVisitLoading.value = true
    try {
      const existed = await getMedicalVisitByAppointId(appointment.id)
      if (existed) {
        return existed
      }

      const createPayload: CreateMedicalVisitDTO = {
        appointId: appointment.id,
        residentId: appointment.residentId,
        doctorId,
        chiefComplaint: '',
        treatmentAdvice: '',
      }

      const createRes = await createMedicalVisit(createPayload)
      if (createRes.code !== ResponseCode.SUCCESS) {
        return null
      }

      return await getMedicalVisitByAppointId(appointment.id)
    } finally {
      medicalVisitLoading.value = false
    }
  }

  function clearMedicalVisitDetail() {
    medicalVisitDetail.value = null
  }

  async function getDiagnosisByVisitId(visitId: number) {
    diagnosisLoading.value = true
    try {
      const res = await getDoctorDiagnosisByVisitIdAPI(visitId)
      diagnosisDetail.value = res.data || null
      return diagnosisDetail.value
    } finally {
      diagnosisLoading.value = false
    }
  }

  async function queryDiagnosisByVisitIdRaw(visitId: number) {
    const res = await getDoctorDiagnosisByVisitIdAPI(visitId)
    return res.data || null
  }

  async function createDiagnosisReport(payload: CreateDiagnosisReportDTO) {
    diagnosisLoading.value = true
    try {
      return await createDoctorDiagnosisReportAPI(payload)
    } finally {
      diagnosisLoading.value = false
    }
  }

  async function createDiagnosisFromVisit(params: {
    visitId: number
    residentLoginId: number
    diagnosisResult: string
    diagnosisDetail: string
  }) {
    const normalizedVisitId = Number(params.visitId)
    if (!Number.isFinite(normalizedVisitId) || normalizedVisitId <= 0) {
      return {
        code: 0,
        message: '问诊记录ID无效',
        data: null,
      }
    }

    const recordIdRes = await getResidentHealthRecordIdAPI(params.residentLoginId)
    const healthRecordId = Number(recordIdRes.data)
    if (!Number.isFinite(healthRecordId) || healthRecordId <= 0) {
      return {
        code: 0,
        message: '未查询到居民健康档案ID',
        data: null,
      }
    }

    return await createDiagnosisReport({
      visitId: normalizedVisitId,
      healthRecordId,
      diagnosisResult: params.diagnosisResult,
      diagnosisDetail: params.diagnosisDetail,
    })
  }

  function clearDiagnosisDetail() {
    diagnosisDetail.value = null
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
    residentRealNameMap,
    medicalVisitLoading,
    medicalVisitDetail,
    doctorMedicalVisitListLoading,
    doctorMedicalVisitList,
    doctorMedicalVisitTotal,
    doctorMedicalVisitDetailLoading,
    doctorMedicalVisitDetail,
    diagnosisLoading,
    diagnosisDetail,
    isDoctorEmpty,
    fetchResidentAppointments,
    fetchDoctorAppointments,
    resolveDoctorAppointmentResidentNames,
    getMedicalVisitByAppointId,
    queryMedicalVisitByAppointIdRaw,
    createMedicalVisit,
    fetchDoctorMedicalVisitList,
    fetchDoctorMedicalVisitById,
    clearDoctorMedicalVisitDetail,
    ensureMedicalVisitByAppointment,
    clearMedicalVisitDetail,
    getDiagnosisByVisitId,
    queryDiagnosisByVisitIdRaw,
    createDiagnosisReport,
    createDiagnosisFromVisit,
    clearDiagnosisDetail,
    bookAppointment,
    cancelAppointment,
    checkIsAppointed,
    fetchAvailableTimeSlots,
    callAppointment,
    skipAppointment,
    startConsultAppointment,
    finishAppointment,
    isRowActionLoading,
    getResidentRealNameById,
  }
})
