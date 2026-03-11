<template>
  <section class="doctor-appointment-page">
    <header class="page-header">
      <h3>预约管理</h3>
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

    <div class="table-card">
      <div class="table-wrap">
        <el-table v-loading="loading" :data="doctorAppointments" border stripe style="width: 100%; height: 100%">
        <el-table-column prop="queueNo" label="排队号" min-width="110" align="center" />
        <el-table-column prop="residentId" label="居民ID" min-width="100" align="center" />
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
        <el-table-column prop="symptom" label="症状" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" min-width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <template v-if="canCallOrSkip(row)">
                <el-button
                  type="primary"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleCall(row.id)"
                >
                  叫号
                </el-button>
                <el-button
                  type="warning"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleSkip(row.id)"
                >
                  过号
                </el-button>
              </template>
              <template v-else-if="canRecall(row)">
                <el-button
                  type="primary"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleCall(row.id)"
                >
                  重新叫号
                </el-button>
              </template>
              <template v-else-if="canStartOrSkip(row)">
                <el-button
                  type="success"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleStartConsult(row.id)"
                >
                  开始咨询
                </el-button>
                <el-button
                  type="warning"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleSkip(row.id)"
                >
                  过号
                </el-button>
              </template>
              <template v-else-if="canFinishConsult(row)">
                <el-button
                  type="danger"
                  text
                  size="small"
                  :loading="isRowActionLoading(row.id)"
                  @click="handleFinish(row.id)"
                >
                  结束咨询
                </el-button>
              </template>
              <span v-else class="no-action">-</span>
            </div>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="isDoctorEmpty" description="暂无预约记录" class="table-empty" />

      <footer class="page-footer">
        <span class="page-info">共 {{ doctorTotal }} 条预约</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="doctorTotal"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageNumChange"
        />
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'
import {
  APPOINTMENT_STATUS,
  VISIT_STATUS,
  appointmentStatusTextMap,
  visitStatusTextMap,
  type Appointment,
} from '@/types/appointment.types'

interface DoctorAppointmentQueryForm {
  appointmentDate?: string
  visitStatus?: number
}

const authStore = useAuthStore()
const appointmentStore = useAppointmentStore()
const { loading, doctorAppointments, doctorTotal, isDoctorEmpty } = storeToRefs(appointmentStore)

const queryForm = reactive<DoctorAppointmentQueryForm>({})
const pageNum = ref(1)
const pageSize = ref(10)

const visitTagType = (visitStatus: number) => {
  if (visitStatus === VISIT_STATUS.WAITING) return 'info'
  if (visitStatus === VISIT_STATUS.CALLED) return 'warning'
  if (visitStatus === VISIT_STATUS.IN_VISIT) return 'success'
  if (visitStatus === VISIT_STATUS.DONE) return 'primary'
  return 'danger'
}

const normalizeQuery = () => {
  return {
    doctorId: authStore.user?.id,
    appointmentDate: queryForm.appointmentDate,
    visitStatus: queryForm.visitStatus,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  }
}

const fetchList = async () => {
  if (!authStore.user?.id) {
    ElMessage.error('医生信息异常，请重新登录后再试')
    return
  }
  await appointmentStore.fetchDoctorAppointments(normalizeQuery())
}

const canCallOrSkip = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.WAITING
}

const canRecall = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.SKIPPED
}

const canStartOrSkip = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.CALLED
}

const canFinishConsult = (row: Appointment) => {
  return row.appointmentStatus === APPOINTMENT_STATUS.BOOKED && row.visitStatus === VISIT_STATUS.IN_VISIT
}

const isRowActionLoading = (appointmentId: number) => appointmentStore.isRowActionLoading(appointmentId)

const doAction = async (executor: (id: number) => Promise<{ success: boolean; message: string }>, appointmentId: number) => {
  const result = await executor(appointmentId)
  if (result.success) {
    ElMessage.success(result.message || '操作成功')
    await fetchList()
    return
  }
  ElMessage.error(result.message || '操作失败')
}

const handleCall = async (appointmentId: number) => {
  await doAction(appointmentStore.callAppointment, appointmentId)
}

const handleSkip = async (appointmentId: number) => {
  await doAction(appointmentStore.skipAppointment, appointmentId)
}

const handleStartConsult = async (appointmentId: number) => {
  await doAction(appointmentStore.startConsultAppointment, appointmentId)
}

const handleFinish = async (appointmentId: number) => {
  await doAction(appointmentStore.finishAppointment, appointmentId)
}

const handleQuery = async () => {
  pageNum.value = 1
  await fetchList()
}

const handleReset = async () => {
  queryForm.appointmentDate = undefined
  queryForm.visitStatus = undefined
  await handleQuery()
}

const handlePageNumChange = async (nextPageNum: number) => {
  pageNum.value = nextPageNum
  await fetchList()
}

const handleRealtimeRefresh = async () => {
  await fetchList()
}

onMounted(async () => {
  window.addEventListener('appointment:doctor-refresh', handleRealtimeRefresh)
  await fetchList()
})

onUnmounted(() => {
  window.removeEventListener('appointment:doctor-refresh', handleRealtimeRefresh)
})
</script>

<style scoped>
.doctor-appointment-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 16px 18px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h3 {
  margin: 0;
  color: #123a73;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-select {
  width: 140px;
}

.table-card {
  background: #ffffff;
  border: 1px solid #d8e4f1;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-wrap {
  flex: 1;
  min-height: 0;
}

.table-wrap :deep(.el-table) {
  height: 100%;
}

.table-empty {
  margin: 0;
}

.action-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.no-action {
  color: #7c8ea8;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.page-info {
  color: #5a6f8d;
  font-size: 13px;
}

@media (max-width: 960px) {
  .page-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
