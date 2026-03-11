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
        <el-table-column label="居民姓名" min-width="120" align="center">
          <template #default="{ row }">
            {{ getResidentDisplayName(row.residentId) }}
          </template>
        </el-table-column>
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
              <template v-else-if="canViewVisitRecord(row)">
                <el-button
                  type="primary"
                  text
                  size="small"
                  :loading="visitDialogLoading"
                  @click="handleViewVisitRecord(row)"
                >
                  问诊记录
                </el-button>
                <el-button
                  v-if="hasDiagnosisAction(row.id)"
                  type="success"
                  text
                  size="small"
                  :loading="diagnosisDialogLoading"
                  @click="handleViewDiagnosisResult(row)"
                >
                  诊断结果
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

    <el-dialog
      v-model="visitDialogVisible"
      title="问诊记录"
      width="560px"
      destroy-on-close
    >
      <div v-if="medicalVisitDetail" class="visit-detail-panel">
        <p><span>医生姓名：</span>{{ medicalVisitDetail.doctorName || '-' }}</p>
        <p><span>医生电话：</span>{{ medicalVisitDetail.doctorPhone || '-' }}</p>
        <p><span>科室：</span>{{ medicalVisitDetail.doctorDepartment || '-' }}</p>
        <p><span>居民姓名：</span>{{ medicalVisitDetail.residentName || '-' }}</p>
        <p><span>主诉：</span>{{ medicalVisitDetail.chiefComplaint || '-' }}</p>
        <p><span>治疗建议：</span>{{ medicalVisitDetail.treatmentAdvice || '-' }}</p>
        <p><span>创建时间：</span>{{ formatDateTime(medicalVisitDetail.createTime) }}</p>
      </div>
      <el-empty v-else description="暂无问诊记录" />
    </el-dialog>

    <el-dialog
      v-model="visitCreateDialogVisible"
      title="新增问诊记录"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top" class="visit-create-form">
        <el-form-item label="主诉">
          <el-input
            v-model="visitCreateForm.chiefComplaint"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="请输入主诉"
          />
        </el-form-item>
        <el-form-item label="治疗建议">
          <el-input
            v-model="visitCreateForm.treatmentAdvice"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入治疗建议"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visitCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="visitDialogLoading" @click="handleCreateVisitRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="diagnosisViewDialogVisible"
      title="诊断结果"
      width="560px"
      destroy-on-close
    >
      <div v-if="diagnosisDetail" class="visit-detail-panel">
        <p><span>诊断结果：</span>{{ diagnosisDetail.diagnosisResult || '-' }}</p>
        <p><span>诊断细节：</span>{{ diagnosisDetail.diagnosisDetail || '-' }}</p>
        <p><span>创建时间：</span>{{ formatDateTime(diagnosisDetail.createTime) }}</p>
      </div>
      <el-empty v-else description="暂无诊断结果" />
    </el-dialog>

    <el-dialog
      v-model="diagnosisCreateDialogVisible"
      title="新增诊断结果"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top" class="visit-create-form">
        <el-form-item label="诊断结果">
          <el-input
            v-model="diagnosisCreateForm.diagnosisResult"
            maxlength="100"
            show-word-limit
            placeholder="请输入诊断结果"
          />
        </el-form-item>
        <el-form-item label="诊断细节">
          <el-input
            v-model="diagnosisCreateForm.diagnosisDetail"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入诊断细节"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diagnosisCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="diagnosisDialogLoading" @click="handleCreateDiagnosisResult">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
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
const {
  loading,
  doctorAppointments,
  doctorTotal,
  isDoctorEmpty,
  medicalVisitLoading,
  medicalVisitDetail,
  diagnosisLoading,
  diagnosisDetail,
} = storeToRefs(appointmentStore)

const queryForm = reactive<DoctorAppointmentQueryForm>({})
const pageNum = ref(1)
const pageSize = ref(10)
const visitDialogVisible = ref(false)
const visitCreateDialogVisible = ref(false)
const currentVisitAppointment = ref<Appointment | null>(null)
const visitExistsMap = ref<Record<number, boolean>>({})
const diagnosisStatusMap = ref<Record<number, { visitId: number | null; hasDiagnosis: boolean }>>({})
const diagnosisViewDialogVisible = ref(false)
const diagnosisCreateDialogVisible = ref(false)
const currentDiagnosisContext = ref<{ appointmentId: number; visitId: number; residentId: number } | null>(null)

const visitCreateForm = reactive({
  chiefComplaint: '',
  treatmentAdvice: '',
})

const diagnosisCreateForm = reactive({
  diagnosisResult: '',
  diagnosisDetail: '',
})

const visitDialogLoading = computed(() => medicalVisitLoading.value)
const diagnosisDialogLoading = computed(() => diagnosisLoading.value)

const getResidentDisplayName = (residentId: number) => {
  return appointmentStore.getResidentRealNameById(residentId)
}

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
  await preloadDiagnosisStatus()
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

const canViewVisitRecord = (row: Appointment) => {
  return row.visitStatus === VISIT_STATUS.DONE || row.appointmentStatus === APPOINTMENT_STATUS.FINISHED
}

const hasDiagnosisAction = (appointmentId: number) => {
  return Boolean(diagnosisStatusMap.value[appointmentId]?.visitId)
}

const preloadDiagnosisStatus = async () => {
  const completedRows = doctorAppointments.value.filter(canViewVisitRecord)
  if (!completedRows.length) {
    visitExistsMap.value = {}
    diagnosisStatusMap.value = {}
    return
  }

  const entries = await Promise.all(
    completedRows.map(async (row) => {
      try {
        const visit = await appointmentStore.queryMedicalVisitByAppointIdRaw(row.id)
        if (!visit) {
          return [row.id, { visitId: null, hasDiagnosis: false }] as const
        }

        const visitId = Number(visit.id)
        if (!Number.isFinite(visitId) || visitId <= 0) {
          return [row.id, { visitId: null, hasDiagnosis: false }] as const
        }

        const diagnosis = await appointmentStore.queryDiagnosisByVisitIdRaw(visitId)
        return [row.id, { visitId, hasDiagnosis: Boolean(diagnosis) }] as const
      } catch {
        return [row.id, { visitId: null, hasDiagnosis: false }] as const
      }
    }),
  )

  const map = Object.fromEntries(entries)
  diagnosisStatusMap.value = map
  visitExistsMap.value = Object.fromEntries(
    Object.entries(map).map(([appointId, status]) => [Number(appointId), Boolean(status.visitId)]),
  )
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

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const handleViewVisitRecord = async (row: Appointment) => {
  if (!authStore.user?.id) {
    ElMessage.error('医生信息异常，请重新登录后再试')
    return
  }

  try {
    const detail = await appointmentStore.getMedicalVisitByAppointId(row.id)
    if (detail) {
      const visitId = Number(detail.id)
      visitExistsMap.value = {
        ...visitExistsMap.value,
        [row.id]: true,
      }
      diagnosisStatusMap.value = {
        ...diagnosisStatusMap.value,
        [row.id]: {
          visitId: Number.isFinite(visitId) && visitId > 0 ? visitId : null,
          hasDiagnosis: diagnosisStatusMap.value[row.id]?.hasDiagnosis || false,
        },
      }
      visitDialogVisible.value = true
      return
    }

    currentVisitAppointment.value = row
    visitCreateForm.chiefComplaint = ''
    visitCreateForm.treatmentAdvice = ''
    visitCreateDialogVisible.value = true
  } catch {
    ElMessage.error('查询问诊记录失败，请稍后重试')
  }
}

const handleCreateVisitRecord = async () => {
  const target = currentVisitAppointment.value
  const doctorId = authStore.user?.id
  if (!target || !doctorId) {
    ElMessage.warning('未找到有效的预约记录')
    return
  }

  const chiefComplaint = visitCreateForm.chiefComplaint.trim()
  const treatmentAdvice = visitCreateForm.treatmentAdvice.trim()

  if (!chiefComplaint || !treatmentAdvice) {
    ElMessage.warning('请完整填写主诉与治疗建议')
    return
  }

  try {
    const createRes = await appointmentStore.createMedicalVisit({
      appointId: target.id,
      residentId: target.residentId,
      doctorId,
      chiefComplaint,
      treatmentAdvice,
    })

    if (createRes.code !== 1) {
      ElMessage.error(createRes.message || '问诊记录保存失败')
      return
    }

    const detail = await appointmentStore.getMedicalVisitByAppointId(target.id)
    if (!detail) {
      ElMessage.warning('问诊记录已保存，但未查询到详情')
      visitCreateDialogVisible.value = false
      return
    }

    visitExistsMap.value = {
      ...visitExistsMap.value,
      [target.id]: true,
    }
    diagnosisStatusMap.value = {
      ...diagnosisStatusMap.value,
      [target.id]: {
        visitId: Number(detail.id) || null,
        hasDiagnosis: false,
      },
    }
    ElMessage.success('问诊记录保存成功')
    visitCreateDialogVisible.value = false
    visitDialogVisible.value = true
  } catch {
    ElMessage.error('问诊记录保存失败，请稍后重试')
  }
}

const handleViewDiagnosisResult = async (row: Appointment) => {
  try {
    const preloaded = diagnosisStatusMap.value[row.id]
    const visitId = Number(preloaded?.visitId)
    if (!Number.isFinite(visitId) || visitId <= 0) {
      ElMessage.warning('请先补充问诊记录')
      visitExistsMap.value = {
        ...visitExistsMap.value,
        [row.id]: false,
      }
      return
    }

    visitExistsMap.value = {
      ...visitExistsMap.value,
      [row.id]: true,
    }

    currentDiagnosisContext.value = {
      appointmentId: row.id,
      visitId,
      residentId: row.residentId,
    }

    const diagnosis = await appointmentStore.getDiagnosisByVisitId(visitId)
    if (diagnosis) {
      diagnosisStatusMap.value = {
        ...diagnosisStatusMap.value,
        [row.id]: {
          visitId,
          hasDiagnosis: true,
        },
      }
      diagnosisViewDialogVisible.value = true
      return
    }

    diagnosisCreateForm.diagnosisResult = ''
    diagnosisCreateForm.diagnosisDetail = ''
    diagnosisCreateDialogVisible.value = true
  } catch {
    ElMessage.error('查询诊断结果失败，请稍后重试')
  }
}

const handleCreateDiagnosisResult = async () => {
  const context = currentDiagnosisContext.value
  if (!context) {
    ElMessage.warning('缺少诊断上下文信息')
    return
  }

  const diagnosisResult = diagnosisCreateForm.diagnosisResult.trim()
  const diagnosisDetail = diagnosisCreateForm.diagnosisDetail.trim()
  if (!diagnosisResult || !diagnosisDetail) {
    ElMessage.warning('请完整填写诊断结果和诊断细节')
    return
  }

  try {
    const createRes = await appointmentStore.createDiagnosisFromVisit({
      visitId: Number(context.visitId),
      residentLoginId: context.residentId,
      diagnosisResult,
      diagnosisDetail,
    })

    if (createRes.code !== 1) {
      ElMessage.error(createRes.message || '诊断结果保存失败')
      return
    }

    const diagnosis = await appointmentStore.getDiagnosisByVisitId(context.visitId)
    if (!diagnosis) {
      ElMessage.warning('诊断结果已保存，但未查询到详情')
      diagnosisCreateDialogVisible.value = false
      return
    }

    diagnosisStatusMap.value = {
      ...diagnosisStatusMap.value,
      [context.appointmentId]: {
        visitId: context.visitId,
        hasDiagnosis: true,
      },
    }

    ElMessage.success('诊断结果保存成功')
    diagnosisCreateDialogVisible.value = false
    diagnosisViewDialogVisible.value = true
  } catch {
    ElMessage.error('诊断结果保存失败，请稍后重试')
  }
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
  appointmentStore.clearMedicalVisitDetail()
  appointmentStore.clearDiagnosisDetail()
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

.visit-detail-panel {
  display: grid;
  gap: 8px;
}

.visit-detail-panel p {
  margin: 0;
  color: #2d4564;
  line-height: 1.5;
}

.visit-detail-panel span {
  color: #6f839f;
}

.visit-create-form {
  padding-top: 4px;
}

@media (max-width: 960px) {
  .page-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
