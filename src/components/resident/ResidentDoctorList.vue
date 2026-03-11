<template>
  <section class="resident-doctor-page">
    <aside class="filter-panel">
      <div class="filter-header">
        <el-icon class="filter-icon"><Search /></el-icon>
        <span>筛选医生</span>
      </div>

      <el-form label-position="top" class="filter-form" @submit.prevent>
        <el-form-item label="科室名称">
          <el-select
            v-model="filterForm.departmentId"
            placeholder="全部科室"
            clearable
            class="full-width"
            :loading="departmentLoading"
          >
            <el-option
              v-for="department in departments"
              :key="department.id"
              :label="department.name"
              :value="department.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="医生姓名">
          <el-input v-model="filterForm.name" placeholder="输入姓名搜索" clearable />
        </el-form-item>

        <el-form-item label="就诊时段">
          <el-select v-model="filterForm.timeSlot" placeholder="不限" clearable class="full-width">
            <el-option label="上午" value="AM" />
            <el-option label="下午" value="PM" />
          </el-select>
        </el-form-item>

        <el-form-item label="职称">
          <el-select v-model="filterForm.title" placeholder="不限" clearable class="full-width">
            <el-option
              v-for="option in doctorTitleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.workDay"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            class="full-width"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <div class="filter-actions">
          <el-button type="primary" :loading="loading" @click="handleQuery">立即查询</el-button>
          <el-button :loading="loading" plain @click="handleReset">重置</el-button>
        </div>
      </el-form>
    </aside>

    <div class="doctor-panel">
      <el-skeleton :loading="loading" animated :count="3">
        <template #template>
          <div class="doctor-card-skeleton" />
        </template>

        <template #default>
          <div v-if="doctorList.length" class="doctor-list">
            <article v-for="doctor in doctorList" :key="doctor.userId" class="doctor-card">
              <div class="doctor-header">
                <img :src="doctor.avatarUrl || fallbackAvatar" alt="医生头像" class="doctor-avatar" />
                <div class="doctor-main">
                  <h4>{{ doctor.name }}</h4>
                  <p class="doctor-phone">{{ doctor.phone }}</p>
                  <p class="doctor-title">{{ residentDoctorStore.getDoctorTitleText(doctor.title) }}</p>
                </div>
              </div>

              <div class="doctor-meta">
                <p>
                  <span class="meta-label">科室</span>
                  <span>{{ doctor.departmentName }}</span>
                </p>
                <p>
                  <span class="meta-label">擅长</span>
                  <span>{{ doctor.specialty || '-' }}</span>
                </p>
                <p>
                  <span class="meta-label">信息</span>
                  <span>{{ residentDoctorStore.getGenderText(doctor.gender) }} | {{ doctor.age }}岁</span>
                </p>
                <p>
                  <span class="meta-label">出诊</span>
                  <span>{{ residentDoctorStore.getFullScheduleText(doctor) }}</span>
                </p>
              </div>

              <p class="doctor-intro" :title="doctor.introduction || ''">
                擅长介绍：{{ doctor.introduction || '暂无简介' }}
              </p>

              <div class="doctor-actions">
                <el-button type="primary" @click="handleReserve(doctor)">预约挂号</el-button>
                <el-button plain @click="handleConsult(doctor)">在线问诊</el-button>
              </div>
            </article>
          </div>

          <el-empty v-else description="暂无符合条件的医生" />
        </template>
      </el-skeleton>

      <footer class="panel-footer">
        <span class="total-text">共 {{ total }} 位医生</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageNumChange"
        />
      </footer>
    </div>
    <el-dialog
      v-model="appointmentDialogVisible"
      title="预约挂号"
      width="420px"
      destroy-on-close
    >
      <el-form label-position="top" class="appointment-form">
        <el-form-item label="医生">
          <el-input :model-value="selectedDoctor?.name || ''" readonly />
        </el-form-item>

        <el-form-item label="预约日期" required>
          <el-date-picker
            v-model="appointmentForm.appointmentDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            class="full-width"
            :disabled-date="disabledDate"
            :disabled="isQueryDateLocked"
          />
        </el-form-item>

        <el-form-item label="预约时间" required>
          <el-select
            v-model="appointmentForm.appointmentTime"
            class="full-width"
            placeholder="请选择具体时间"
            :disabled="!appointmentTimeOptions.length || loadingAvailableSlots"
            :loading="loadingAvailableSlots"
          >
            <el-option
              v-for="time in appointmentTimeOptions"
              :key="time"
              :label="time"
              :value="time"
            />
          </el-select>
          <p class="time-tip">
            <template v-if="loadingAvailableSlots">正在加载可用时段...</template>
            <template v-else-if="!appointmentTimeOptions.length">当前日期无可用时段，请更换日期</template>
            <template v-else-if="isQueryDateLocked">查询时已指定预约日期，当前日期已锁定</template>
            <template v-else-if="isTodaySelected">今天仅可选择晚于当前时间的时段</template>
            <template v-else-if="filterForm.timeSlot">当前仅展示 {{ filterForm.timeSlot === 'AM' ? '上午' : '下午' }} 时段</template>
          </p>
        </el-form-item>

        <el-form-item label="症状描述（选填）">
          <el-input
            v-model="appointmentForm.symptom"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入主要症状"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="appointmentDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="residentBooking" @click="handleConfirmAppointment">
            {{ residentBooking ? '排号中，请稍等...' : '确认预约' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'
import { useConsultationStore } from '@/stores/consultation.store'
import { useResidentDoctorStore } from '@/stores/resident-doctor.store'
import type { DoctorTitle } from '@/types/account.types'
import {
  AFTERNOON_APPOINTMENT_TIMES,
  MORNING_APPOINTMENT_TIMES,
  type AppointmentTimeValue,
} from '@/types/appointment.types'
import type { DoctorTimeSlot, ResidentDoctor } from '@/types/resident-doctor.types'

interface DoctorFilterForm {
  departmentId?: number
  name?: string
  timeSlot?: DoctorTimeSlot
  title?: DoctorTitle
  workDay?: string
}

const fallbackAvatar = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

const accountStore = useAccountStore()
const authStore = useAuthStore()
const residentDoctorStore = useResidentDoctorStore()
const appointmentStore = useAppointmentStore()
const consultationStore = useConsultationStore()
const router = useRouter()
const { departments } = storeToRefs(accountStore)
const { doctorList, total, loading } = storeToRefs(residentDoctorStore)
const { residentBooking } = storeToRefs(appointmentStore)

const departmentLoading = ref(false)

const pageNum = ref(1)
const pageSize = ref(8)

const appointmentDialogVisible = ref(false)
const selectedDoctor = ref<ResidentDoctor | null>(null)
const loadingAvailableSlots = ref(false)
const loadedAvailableSlots = ref(false)
const availableTimeSlots = ref<DoctorTimeSlot[]>([])
const appointmentForm = reactive<{
  appointmentDate: string
  appointmentTime: AppointmentTimeValue | ''
  symptom: string
}>({
  appointmentDate: '',
  appointmentTime: '',
  symptom: '',
})

const filterForm = reactive<DoctorFilterForm>({})

const doctorTitleOptions: Array<{ label: string; value: DoctorTitle }> = [
  { label: '住院医师', value: 1 },
  { label: '主治医师', value: 2 },
  { label: '副主任医师', value: 3 },
  { label: '主任医师', value: 4 },
]

const normalizeQueryParams = () => {
  return {
    departmentId: filterForm.departmentId,
    name: filterForm.name ? filterForm.name.trim() : undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    timeSlot: filterForm.timeSlot,
    title: filterForm.title,
    workDay: filterForm.workDay,
  }
}

const disabledDate = (time: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)
  return time.getTime() < today.getTime() || time.getTime() > sevenDaysLater.getTime()
}

const getWeekDay = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00`)
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const isQueryDateLocked = computed(() => Boolean(filterForm.workDay))

const isTodaySelected = computed(() => {
  if (!appointmentForm.appointmentDate) {
    return false
  }

  const now = new Date()
  const todayText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return appointmentForm.appointmentDate === todayText
})

const matchSchedules = computed(() => {
  const doctor = selectedDoctor.value
  const appointmentDate = appointmentForm.appointmentDate
  if (!doctor || !appointmentDate) {
    return []
  }

  const weekDay = getWeekDay(appointmentDate)
  return (doctor.doctorSchedules || []).filter((schedule) => schedule.weekDay === weekDay && schedule.status === 1)
})

const availableSlotsFromSchedule = computed<DoctorTimeSlot[]>(() => {
  const slots = new Set<DoctorTimeSlot>()
  matchSchedules.value.forEach((schedule) => {
    if (schedule.timeSlot === 'AM' || schedule.timeSlot === 'PM') {
      slots.add(schedule.timeSlot)
    }
  })
  return [...slots]
})

const allowedTimeSlots = computed<DoctorTimeSlot[]>(() => {
  // If backend slots are loaded for selected date, use them as the source of truth.
  let slots = loadedAvailableSlots.value ? availableTimeSlots.value : availableSlotsFromSchedule.value

  const fromSearch = filterForm.timeSlot
  if (fromSearch) {
    slots = slots.filter((slot) => slot === fromSearch)
  }

  return slots
})

const toMinutes = (timeText: string) => {
  const [hours, minutes] = timeText.split(':').map((value) => Number(value))
  return (hours || 0) * 60 + (minutes || 0)
}

const appointmentTimeOptions = computed<AppointmentTimeValue[]>(() => {
  if (!appointmentForm.appointmentDate) {
    return []
  }

  const options: AppointmentTimeValue[] = []
  if (allowedTimeSlots.value.includes('AM')) {
    options.push(...MORNING_APPOINTMENT_TIMES)
  }
  if (allowedTimeSlots.value.includes('PM')) {
    options.push(...AFTERNOON_APPOINTMENT_TIMES)
  }

  if (!isTodaySelected.value) {
    return options
  }

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return options.filter((time) => toMinutes(time) > nowMinutes)
})

const refreshAvailableTimeSlots = async (showEmptyTip = true) => {
  const doctor = selectedDoctor.value
  const date = appointmentForm.appointmentDate
  if (!doctor || !date) {
    availableTimeSlots.value = []
    loadedAvailableSlots.value = false
    return
  }

  loadingAvailableSlots.value = true
  try {
    const slots = await appointmentStore.fetchAvailableTimeSlots(date, doctor.userId)
    availableTimeSlots.value = slots
    loadedAvailableSlots.value = true
    if (!slots.length && showEmptyTip) {
      ElMessage.warning('当前无可用时段，请更换日期')
    }
  } catch {
    availableTimeSlots.value = []
    loadedAvailableSlots.value = false
    ElMessage.error('加载可用时段失败，请稍后重试')
  } finally {
    loadingAvailableSlots.value = false
  }
}

watch(
  appointmentTimeOptions,
  (options) => {
    if (!options.includes(appointmentForm.appointmentTime as AppointmentTimeValue)) {
      appointmentForm.appointmentTime = ''
    }
  },
  { immediate: true },
)

watch(
  () => appointmentForm.appointmentDate,
  async (date, prevDate) => {
    if (!appointmentDialogVisible.value || !date || date === prevDate || isQueryDateLocked.value) {
      return
    }

    await refreshAvailableTimeSlots(Boolean(prevDate))
  },
)

const queryDoctorList = async () => {
  await residentDoctorStore.queryDoctorList(normalizeQueryParams())
}

const handleQuery = async () => {
  pageNum.value = 1
  await queryDoctorList()
}

const handleReset = async () => {
  filterForm.departmentId = undefined
  filterForm.name = undefined
  filterForm.timeSlot = undefined
  filterForm.title = undefined
  filterForm.workDay = undefined
  await handleQuery()
}

const handlePageNumChange = async (value: number) => {
  pageNum.value = value
  await queryDoctorList()
}

const loadDepartments = async () => {
  departmentLoading.value = true
  try {
    await accountStore.getAllDepartments()
  } catch (error) {
    console.error('加载科室失败:', error)
    ElMessage.error('加载科室失败')
  } finally {
    departmentLoading.value = false
  }
}

const handleReserve = async (doctor: ResidentDoctor) => {
  if (!doctor.doctorSchedules?.length) {
    ElMessage.warning('该医生暂无可预约排班')
    return
  }

  selectedDoctor.value = doctor
  appointmentForm.appointmentDate = filterForm.workDay || ''
  appointmentForm.appointmentTime = ''
  appointmentForm.symptom = ''
  loadedAvailableSlots.value = false
  availableTimeSlots.value = []
  appointmentDialogVisible.value = true

  if (appointmentForm.appointmentDate) {
    await refreshAvailableTimeSlots(true)
  }
}

const getTimeSlotByTime = (timeText: AppointmentTimeValue): DoctorTimeSlot => {
  return timeText < '12:00' ? 'AM' : 'PM'
}

const handleConfirmAppointment = async () => {
  if (!selectedDoctor.value) {
    ElMessage.warning('请选择医生后再预约')
    return
  }
  if (!appointmentForm.appointmentDate) {
    ElMessage.warning('请选择预约日期')
    return
  }
  if (!appointmentForm.appointmentTime) {
    ElMessage.warning('请选择预约时间')
    return
  }

  const residentId = authStore.user?.id
  if (!residentId) {
    ElMessage.error('用户信息异常，请重新登录后再试')
    return
  }

  const timeSlot = getTimeSlotByTime(appointmentForm.appointmentTime)
  const matchedSchedule = matchSchedules.value.find((schedule) => schedule.timeSlot === timeSlot)
  if (!matchedSchedule) {
    ElMessage.warning('所选日期/时段无有效排班，请重新选择')
    return
  }

  const appointed = await appointmentStore.checkIsAppointed({
    residentId,
    doctorId: selectedDoctor.value.userId,
    appointmentDate: appointmentForm.appointmentDate,
    appointmentTime: appointmentForm.appointmentTime,
  })

  if (appointed) {
    ElMessage.warning('该时段您已预约过该医生，请勿重复挂号')
    return
  }

  try {
    const result = await appointmentStore.bookAppointment({
      residentId,
      doctorId: selectedDoctor.value.userId,
      scheduleId: matchedSchedule.id,
      appointmentDate: appointmentForm.appointmentDate,
      appointmentTime: appointmentForm.appointmentTime,
      symptom: appointmentForm.symptom?.trim() || undefined,
    })

    if (result.success) {
      appointmentDialogVisible.value = false
      ElNotification({
        title: '预约成功',
        message: `您已预约成功，预约号：${result.queueNo || '-'}`,
        type: 'success',
        duration: 4200,
      })
      return
    }

    ElMessage.error(result.message)
  } catch {
    ElMessage.error('预约失败，请稍后重试')
  }
}

const handleConsult = async (doctor: ResidentDoctor) => {
  const sessionId = await consultationStore.startConsultation('resident', doctor.userId)
  if (!sessionId) {
    ElMessage.error('发起在线问诊失败，请稍后重试')
    return
  }

  await router.push({
    path: '/resident',
    query: {
      tab: 'consultation',
      sessionId: String(sessionId),
    },
  })
}

onMounted(async () => {
  if (!departments.value.length) {
    await loadDepartments()
  }
  await queryDoctorList()
})
</script>

<style scoped>
.resident-doctor-page {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 640px;
  min-width: 0;
}

.filter-panel {
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d9e3ef;
  padding: 14px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-weight: 700;
  color: #1f2a44;
}

.filter-icon {
  color: #1776e8;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.full-width {
  width: 100%;
}

.filter-actions {
  padding-top: 4px;
  display: flex;
  gap: 10px;
}

.filter-actions .el-button {
  flex: 1;
}

.doctor-panel {
  border-radius: 10px;
  border: 1px solid #d9e3ef;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.doctor-list {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  align-content: start;
}

.doctor-card {
  border: 1px solid #dce8f6;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doctor-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.doctor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  background: #f2f6fb;
}

.doctor-main h4 {
  margin: 0;
  color: #10213c;
  font-size: 18px;
  line-height: 1.2;
}

.doctor-phone {
  margin: 2px 0;
  color: #3f7fd7;
  font-size: 12px;
}

.doctor-title {
  margin: 0;
  color: #1b9a3e;
  font-weight: 600;
  font-size: 13px;
}

.doctor-meta {
  display: grid;
  gap: 5px;
  font-size: 13px;
  color: #2a3f63;
}

.doctor-meta p {
  margin: 0;
  display: flex;
  gap: 6px;
}

.meta-label {
  color: #6d7f9d;
  min-width: 32px;
}

.doctor-intro {
  margin: 0;
  font-size: 13px;
  color: #31486e;
  line-height: 1.4;
  min-height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.doctor-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.doctor-card-skeleton {
  height: 170px;
  margin: 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f2f6fb 0%, #e9f0f8 50%, #f2f6fb 100%);
}

.panel-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #edf3fa;
}

.appointment-form {
  padding-top: 6px;
}

.time-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #7487a4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.total-text {
  color: #516887;
  font-size: 13px;
}

@media (max-width: 980px) {
  .resident-doctor-page {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .doctor-list {
    grid-template-columns: 1fr;
  }

  .panel-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
