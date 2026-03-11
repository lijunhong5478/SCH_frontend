<template>
  <section class="resident-workbench-page">
    <header class="page-header">
      <h3>我的预约</h3>
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
      <el-table v-loading="loading" :data="residentAppointments" border stripe style="width: 100%">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'
import {
  APPOINTMENT_STATUS,
  VISIT_STATUS,
  appointmentStatusTextMap,
  visitStatusTextMap,
  type Appointment,
} from '@/types/appointment.types'

const authStore = useAuthStore()
const appointmentStore = useAppointmentStore()
const { loading, residentAppointments, residentTotal } = storeToRefs(appointmentStore)

const pageNum = ref(1)
const pageSize = ref(10)

const queryForm = reactive<{
  appointmentDate?: string
  visitStatus?: number
}>({})

const visitTagType = (visitStatus: number) => {
  if (visitStatus === VISIT_STATUS.WAITING) return 'info'
  if (visitStatus === VISIT_STATUS.CALLED) return 'warning'
  if (visitStatus === VISIT_STATUS.IN_VISIT) return 'success'
  if (visitStatus === VISIT_STATUS.DONE) return 'primary'
  return 'danger'
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

const fetchList = async () => {
  const residentId = authStore.user?.id
  if (!residentId) {
    ElMessage.error('用户信息异常，请重新登录后再试')
    return
  }

  await appointmentStore.fetchResidentAppointments({
    residentId,
    appointmentDate: queryForm.appointmentDate,
    visitStatus: queryForm.visitStatus,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  })
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
  await fetchList()
})

onUnmounted(() => {
  window.removeEventListener('appointment:resident-refresh', handleRealtimeRefresh)
})
</script>

<style scoped>
.resident-workbench-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-header h3 {
  margin: 0;
  color: #133d78;
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
  background: #fff;
  border: 1px solid #d8e4f1;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-muted {
  color: #7b8ca8;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-info {
  color: #5a6f8d;
  font-size: 13px;
}
</style>
