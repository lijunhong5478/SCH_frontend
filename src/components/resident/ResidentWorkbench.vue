<template>
  <section class="resident-workbench-page">
    <header class="page-header">
      <h3>工作台</h3>
      <span class="date-text">{{ todayText }}</span>
    </header>

    <EpidemicAlertBanner />

    <section class="quick-entry-grid">
      <button type="button" class="entry-card" @click="jumpTo('appointments')">
        <span class="entry-icon blue"><el-icon><Calendar /></el-icon></span>
        <strong>预约挂号</strong>
        <p>预约医生门诊</p>
      </button>
      <button type="button" class="entry-card" @click="jumpTo('health-record')">
        <span class="entry-icon green"><el-icon><Document /></el-icon></span>
        <strong>我的档案</strong>
        <p>查看个人健康档案</p>
      </button>
      <button type="button" class="entry-card" @click="jumpTo('consultation')">
        <span class="entry-icon purple"><el-icon><ChatDotRound /></el-icon></span>
        <strong>在线问诊</strong>
        <p>与医学专家在线交流</p>
      </button>
      <button type="button" class="entry-card" @click="jumpTo('education')">
        <span class="entry-icon orange"><el-icon><Reading /></el-icon></span>
        <strong>健康宣教</strong>
        <p>学习健康养生知识</p>
      </button>
    </section>

    <section class="section-card exam-card">
      <header class="section-header">
        <h4>最近一次体检结果</h4>
        <span>日期: {{ latestExamDate }}</span>
      </header>

      <el-skeleton :loading="examLoading" animated>
        <template #template>
          <div class="exam-skeleton" />
        </template>

        <template #default>
          <el-empty v-if="!latestExamRecord" description="暂无体检记录" :image-size="70" />

          <div v-else class="exam-grid">
            <article class="metric-item">
              <p class="metric-label">身高</p>
              <p class="metric-value">{{ formatNumber(latestExamRecord.height, 1) }} <span>cm</span></p>
            </article>
            <article class="metric-item">
              <p class="metric-label">体重</p>
              <p class="metric-value">{{ formatNumber(latestExamRecord.weight, 1) }} <span>kg</span></p>
            </article>
            <article class="metric-item">
              <p class="metric-label">血压</p>
              <p class="metric-value">
                {{ latestExamRecord.systolicBp || '-' }}/{{ latestExamRecord.diastolicBp || '-' }} <span>mmHg</span>
              </p>
            </article>
            <article class="metric-item">
              <p class="metric-label">心率</p>
              <p class="metric-value">{{ latestExamRecord.heartRate || '-' }} <span>bpm</span></p>
            </article>
            <article class="metric-item">
              <p class="metric-label">血糖</p>
              <p class="metric-value">{{ formatNumber(latestExamRecord.bloodSugar, 1) }} <span>mmol/L</span></p>
            </article>
            <article class="metric-item">
              <p class="metric-label">BMI指数</p>
              <p class="metric-value">{{ formatNumber(latestExamRecord.bmi, 2) }} <span>{{ bmiStatusText }}</span></p>
            </article>
          </div>
        </template>
      </el-skeleton>
    </section>

    <section class="section-card appointment-card">
      <header class="section-header">
        <h4>我的预约</h4>
        <div class="query-row">
          <el-date-picker
            v-model="queryForm.appointmentDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="预约日期"
            clearable
          />
          <el-select v-model="queryForm.visitStatus" placeholder="就诊状态" clearable class="status-select">
            <el-option label="排队中" :value="VISIT_STATUS.WAITING" />
            <el-option label="已叫号" :value="VISIT_STATUS.CALLED" />
            <el-option label="就诊中" :value="VISIT_STATUS.IN_VISIT" />
            <el-option label="已完成" :value="VISIT_STATUS.DONE" />
            <el-option label="过号" :value="VISIT_STATUS.SKIPPED" />
          </el-select>
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button :loading="loading" @click="handleReset">重置</el-button>
        </div>
      </header>

      <el-table v-loading="loading" :data="residentAppointments" border stripe style="inline-size: 100%">
        <el-table-column prop="queueNo" label="预约号" min-width="120" align="center" />
        <el-table-column prop="doctorId" label="医生ID" min-width="100" align="center" />
        <el-table-column prop="appointmentDate" label="预约日期" min-width="120" align="center" />
        <el-table-column prop="appointmentTime" label="预约时间" min-width="110" align="center" />
        <el-table-column label="预约状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ appointmentStatusTextMap[row.appointmentStatus] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="就诊状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="visitTagType(row.visitStatus)">{{ visitStatusTextMap[row.visitStatus] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提醒" min-width="240">
          <template #default="{ row }">
            <span v-if="isCalledWaitingForVisit(row)">医生已叫号，请尽快前往。</span>
            <span v-else-if="isSkipped(row)">医生已过号，请等待下一次叫号。</span>
            <span v-else-if="isFinished(row)">本次就诊已结束，请留意后续健康建议。</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canCancel(row)"
              type="danger"
              text
              size="small"
              :loading="appointmentStore.isRowActionLoading(row.id)"
              @click="handleCancel(row.id)"
            >
              取消预约
            </el-button>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !residentAppointments.length" description="暂无预约记录" />

      <footer class="page-footer">
        <span class="page-info">共 {{ residentTotal }} 条预约</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="residentTotal"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, ChatDotRound, Document, Reading } from '@element-plus/icons-vue'
import { getResidentHealthRecordIdAPI } from '@/api/health-record.api'
import { getResidentLatestPhysicalExamRecordAPI } from '@/api/physical-exam-record.api'
import EpidemicAlertBanner from '@/components/common/EpidemicAlertBanner.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'
import { ResponseCode } from '@/types/api.types'
import {
  APPOINTMENT_STATUS,
  VISIT_STATUS,
  appointmentStatusTextMap,
  visitStatusTextMap,
  type Appointment,
} from '@/types/appointment.types'
import type { PhysicalExamRecord } from '@/types/health-record.types'

type ResidentMenuKey = 'appointments' | 'health-record' | 'consultation' | 'education'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appointmentStore = useAppointmentStore()

const { loading, residentAppointments, residentTotal } = storeToRefs(appointmentStore)

const pageNum = ref(1)
const pageSize = ref(5)
const queryForm = ref<{
  appointmentDate?: string
  visitStatus?: number
}>({})

const examLoading = ref(false)
const latestExamRecord = ref<PhysicalExamRecord | null>(null)

const todayText = computed(() => {
  const date = new Date()
  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}年${mm}月${dd}日 ${weekMap[date.getDay()]}`
})

const latestExamDate = computed(() => {
  return formatDate(latestExamRecord.value?.examTime)
})

const bmiStatusText = computed(() => {
  const bmi = Number(latestExamRecord.value?.bmi)
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return '暂无'
  }
  if (bmi < 18.5) {
    return '偏低'
  }
  if (bmi < 24) {
    return '正常'
  }
  if (bmi < 28) {
    return '偏高'
  }
  return '肥胖'
})

const visitTagType = (visitStatus: number) => {
  if (visitStatus === VISIT_STATUS.WAITING) return 'info'
  if (visitStatus === VISIT_STATUS.CALLED) return 'warning'
  if (visitStatus === VISIT_STATUS.IN_VISIT) return 'success'
  if (visitStatus === VISIT_STATUS.DONE) return 'primary'
  return 'danger'
}

const jumpTo = (menuKey: ResidentMenuKey) => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: menuKey,
    },
  })
}

const canCancel = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.WAITING
}

const isCalledWaitingForVisit = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.CALLED
}

const isSkipped = (row: Appointment) => {
  return row.visitStatus === VISIT_STATUS.SKIPPED
}

const isFinished = (row: Appointment) => {
  return row.visitStatus === VISIT_STATUS.DONE
}

const formatDate = (value?: string) => {
  if (!value) {
    return '-'
  }
  const normalized = value.replace('T', ' ').replace(/\.\d+$/, '')
  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return normalized.slice(0, 10)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatNumber = (value: number | undefined, digits = 1) => {
  if (!Number.isFinite(value)) {
    return '--'
  }
  return Number(value).toFixed(digits)
}

const fetchList = async () => {
  const residentId = authStore.user?.id
  if (!residentId) {
    ElMessage.error('用户信息异常，请重新登录后再试')
    return
  }

  await appointmentStore.fetchResidentAppointments({
    residentId,
    appointmentDate: queryForm.value.appointmentDate,
    visitStatus: queryForm.value.visitStatus,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  })
}

const handleQuery = async () => {
  pageNum.value = 1
  await fetchList()
}

const handleReset = async () => {
  queryForm.value.appointmentDate = undefined
  queryForm.value.visitStatus = undefined
  await handleQuery()
}

const fetchLatestExamRecord = async () => {
  const residentId = authStore.user?.id
  if (!residentId) {
    latestExamRecord.value = null
    return
  }

  examLoading.value = true
  try {
    const idRes = await getResidentHealthRecordIdAPI(residentId)
    const healthRecordId = Number(idRes.data)
    if (!Number.isFinite(healthRecordId) || healthRecordId <= 0) {
      latestExamRecord.value = null
      return
    }

    const latestRes = await getResidentLatestPhysicalExamRecordAPI(healthRecordId)
    if ((latestRes.code === ResponseCode.SUCCESS || latestRes.code === 0) && latestRes.data) {
      latestExamRecord.value = latestRes.data
      return
    }
    latestExamRecord.value = null
  } catch {
    latestExamRecord.value = null
  } finally {
    examLoading.value = false
  }
}

const handlePageChange = async (nextPage: number) => {
  pageNum.value = nextPage
  await fetchList()
}

const handleCancel = async (appointmentId: number) => {
  const { value, action } = await ElMessageBox.prompt('请输入取消原因（可选）', '取消预约', {
    confirmButtonText: '确认取消',
    cancelButtonText: '返回',
    inputPlaceholder: '例如：临时有事',
    inputValue: '居民主动取消',
  }).catch(() => ({ value: '', action: 'cancel' as const }))

  if (action !== 'confirm') {
    return
  }

  const result = await appointmentStore.cancelAppointment(appointmentId, (value || '').trim() || '居民主动取消')
  if (result.success) {
    ElMessage.success(result.message)
    await fetchList()
    return
  }

  ElMessage.error(result.message)
}

const handleRealtimeRefresh = async () => {
  await fetchList()
}

onMounted(async () => {
  window.addEventListener('appointment:resident-refresh', handleRealtimeRefresh)
  await Promise.all([fetchList(), fetchLatestExamRecord()])
})

onUnmounted(() => {
  window.removeEventListener('appointment:resident-refresh', handleRealtimeRefresh)
})
</script>

<style scoped>
.resident-workbench-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  inline-size: 100%;
  block-size: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 28px;
}

.date-text {
  font-size: 14px;
  color: #64748b;
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.entry-card {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  text-align: start;
  display: grid;
  gap: 8px;
  cursor: pointer;
}

.entry-card strong {
  color: #1f2937;
  font-size: 18px;
}

.entry-card p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.entry-icon {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.entry-icon :deep(svg) {
  inline-size: 18px;
  block-size: 18px;
}

.entry-icon.blue {
  background: #e0efff;
  color: #2563eb;
}

.entry-icon.green {
  background: #dcfce7;
  color: #0f766e;
}

.entry-icon.purple {
  background: #f3e8ff;
  color: #9333ea;
}

.entry-icon.orange {
  background: #ffedd5;
  color: #ea580c;
}

.section-card {
  background: #fff;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 14px;
  gap: 10px;
  flex-wrap: wrap;
}

.section-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
}

.exam-skeleton {
  block-size: 88px;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.metric-item {
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 10px;
}

.metric-label {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.metric-value {
  margin: 6px 0 0;
  color: #1f2937;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.1;
}

.metric-value span {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-select {
  inline-size: 140px;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.text-muted {
  color: #7b8ca8;
}

@media (max-width: 1200px) {
  .quick-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .exam-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .quick-entry-grid,
  .exam-grid {
    grid-template-columns: 1fr;
  }

  .page-header,
  .section-header,
  .page-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .metric-value {
    font-size: 22px;
  }
}
</style>
