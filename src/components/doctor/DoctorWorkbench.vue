<template>
  <section class="doctor-workbench">
    <article class="alert-banner" :class="`risk-${currentAlert?.riskLevel || 2}`">
      <div class="alert-main">
        <el-icon class="alert-icon"><WarningFilled /></el-icon>
        <div>
          <h3>{{ alertTitle }}</h3>
          <p>{{ alertSubtitle }}</p>
        </div>
      </div>
      <div class="alert-actions">
        <el-button text type="primary" :loading="historyLoading" @click="openHistoryDialog">历史记录</el-button>
        <el-button type="danger" :disabled="!currentAlert" @click="openAlertDetail">
          查看详情
        </el-button>
      </div>
    </article>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-head">
          <span>今日待诊</span>
          <el-tag type="warning" effect="plain">{{ todayPendingCount }} 人</el-tag>
        </div>
        <p class="stat-value">{{ todayPendingCount }}</p>
        <button type="button" class="stat-link" @click="jumpTo('appointments')">进入候诊大厅</button>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <span>今日预约</span>
          <el-tag type="success" effect="plain">已加载</el-tag>
        </div>
        <p class="stat-value">{{ doctorTotal }}</p>
        <button type="button" class="stat-link" @click="jumpTo('appointments')">查看完整日程</button>
      </article>
    </section>

    <section class="quick-actions">
      <h4>快捷操作</h4>
      <div class="action-grid">
        <button class="action-card primary" type="button" @click="openPublishDialog">
          <el-icon><ChatDotRound /></el-icon>
          <div>
            <strong>发布宣教</strong>
            <p>在线科普与通知发布</p>
          </div>
        </button>
        <button class="action-card" type="button" @click="jumpTo('medical-visits')">
          <el-icon><Document /></el-icon>
          <div>
            <strong>问诊记录</strong>
            <p>在线接诊历史明细</p>
          </div>
        </button>
        <button class="action-card" type="button" @click="jumpTo('diagnosis-reports')">
          <el-icon><Calendar /></el-icon>
          <div>
            <strong>诊断记录</strong>
            <p>患者临床诊断档案</p>
          </div>
        </button>
        <button class="action-card" type="button" @click="jumpTo('my-patients')">
          <el-icon><User /></el-icon>
          <div>
            <strong>我的患者</strong>
            <p>管理您的患者名单</p>
          </div>
        </button>
      </div>
    </section>

    <section class="schedule-card">
      <header>
        <h4>接诊日程</h4>
        <el-button link type="primary" @click="jumpTo('appointments')">全部记录</el-button>
      </header>

      <DoctorAppointmentTable embedded :fixed-appointment-date="todayDate" />
    </section>

    <el-dialog v-model="historyVisible" title="疫情预警历史" width="760px" destroy-on-close>
      <el-table v-loading="historyLoading" :data="historyList" border>
        <el-table-column prop="region" label="地区" min-width="140" />
        <el-table-column label="风险等级" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.riskLevel)">{{ getRiskLabel(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" min-width="180">
          <template #default="{ row }">
            {{ formatPublishTime(row.publishTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" text @click="openAlertDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="historyTotal > 0" class="history-footer">
        <span>共 {{ historyTotal }} 条</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="historyTotal"
          :current-page="historyPage"
          :page-size="historyPageSize"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="疫情预警详情" width="620px" destroy-on-close>
      <div v-if="detailLoading">详情加载中...</div>
      <div v-else-if="detailData" class="alert-detail">
        <p><span>地区：</span>{{ detailData.region }}</p>
        <p>
          <span>风险等级：</span>
          <el-tag :type="getRiskTagType(detailData.riskLevel)">{{ getRiskLabel(detailData.riskLevel) }}</el-tag>
        </p>
        <p><span>发布时间：</span>{{ formatPublishTime(detailData.publishTime) }}</p>
        <p><span>预警内容：</span>{{ detailData.message }}</p>
      </div>
      <el-empty v-else description="暂无详情" />
    </el-dialog>

    <el-dialog
      v-model="publishVisible"
      title="发布健康宣教"
      width="600px"
      class="publish-dialog"
      destroy-on-close
      @close="resetPublishForm"
    >
      <el-form
        ref="publishFormRef"
        :model="publishForm"
        :rules="publishRules"
        label-width="80px"
        class="publish-form"
      >
        <el-form-item label="宣教类型" prop="type">
          <el-select v-model="publishForm.type" placeholder="请选择宣教类型" style="inline-size: 100%">
            <el-option label="政策解读" :value="HealthTipTypeConst.POLICY" />
            <el-option label="科普宣教" :value="HealthTipTypeConst.SCIENCE" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="publishForm.title" placeholder="请输入宣教标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="封面图片" prop="backgroundImage">
          <div class="image-upload-area">
            <div v-if="publishForm.backgroundImage" class="preview-image">
              <img :src="publishForm.backgroundImage" alt="封面预览" />
              <el-button class="remove-image-btn" type="danger" circle size="small" @click="removeImage">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <el-upload
              v-else
              class="image-uploader"
              :show-file-list="false"
              :http-request="handleImageUpload"
              accept="image/*"
            >
              <div class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>上传封面图片</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="publishForm.content"
            type="textarea"
            placeholder="请输入宣教内容"
            :rows="8"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" :loading="healthEducationStore.publishLoading" @click="handlePublish">
          发布
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Calendar, ChatDotRound, Close, Document, Plus, User, WarningFilled } from '@element-plus/icons-vue'
import DoctorAppointmentTable from '@/components/doctor/DoctorAppointmentTable.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'
import { useHealthEducationStore } from '@/stores/health-education.store'
import { adminApi } from '@/api/admin.api'
import { epidemicAlertApi } from '@/api/epidemic-alert.api'
import { ResponseCode } from '@/types/api.types'
import { APPOINTMENT_STATUS } from '@/types/appointment.types'
import type { PublishHealthTipDTO } from '@/types/health-education.types'
import { HealthTipType as HealthTipTypeConst } from '@/types/health-education.types'
import {
  getRiskLevelLabel,
  getRiskLevelTagType,
  type EpidemicAlert,
  type EpidemicAlertQuery,
  type RiskLevel,
} from '@/types/epidemic-alert.types'

type DoctorMenuKey =
  | 'appointments'
  | 'patients'
  | 'consultation'
  | 'schedule'
  | 'education'
  | 'medical-visits'
  | 'diagnosis-reports'
  | 'my-patients'

const authStore = useAuthStore()
const appointmentStore = useAppointmentStore()
const healthEducationStore = useHealthEducationStore()
const route = useRoute()
const router = useRouter()

const { doctorAppointments, doctorTotal } = storeToRefs(appointmentStore)

const currentAlert = ref<EpidemicAlert | null>(null)
const detailData = ref<EpidemicAlert | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)

const historyVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref<EpidemicAlert[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = ref(5)

const publishVisible = ref(false)
const publishFormRef = ref<FormInstance>()
const publishForm = reactive<PublishHealthTipDTO>({
  type: HealthTipTypeConst.SCIENCE,
  title: '',
  content: '',
  backgroundImage: '',
})

const publishRules: FormRules = {
  type: [{ required: true, message: '请选择宣教类型', trigger: 'change' }],
  title: [
    { required: true, message: '请输入宣教标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入宣教内容', trigger: 'blur' },
    { min: 10, max: 2000, message: '内容长度在 10 到 2000 个字符', trigger: 'blur' },
  ],
}

const todayDate = computed(() => {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
})

const todayPendingCount = computed(() => {
  return doctorAppointments.value.filter((item) => Number(item.appointmentStatus) === APPOINTMENT_STATUS.BOOKED).length
})

const alertTitle = computed(() => {
  if (!currentAlert.value) {
    return '疫情预警：暂无最新通知'
  }
  return `疫情预警：${currentAlert.value.region}风险提示`
})

const alertSubtitle = computed(() => {
  if (!currentAlert.value) {
    return '当前暂无疫情预警记录。'
  }

  return currentAlert.value.message
})

const getRiskLabel = (level: RiskLevel): string => getRiskLevelLabel(level)

const getRiskTagType = (level: RiskLevel): 'success' | 'warning' | 'danger' | 'info' => getRiskLevelTagType(level)

const formatPublishTime = (value?: string) => {
  if (!value) {
    return '-'
  }

  const normalized = value.replace('T', ' ').replace(/\.\d+$/, '')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return normalized
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

const jumpTo = (menuKey: DoctorMenuKey) => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: menuKey,
    },
  })
}

const openPublishDialog = () => {
  publishVisible.value = true
}

const resetPublishForm = () => {
  publishForm.type = HealthTipTypeConst.SCIENCE
  publishForm.title = ''
  publishForm.content = ''
  publishForm.backgroundImage = ''
  publishFormRef.value?.resetFields()
}

const handleImageUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await adminApi.uploadFile(options.file as File)
    if (res.code === ResponseCode.SUCCESS) {
      publishForm.backgroundImage = res.data
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.message || '图片上传失败')
    }
  } catch {
    ElMessage.error('图片上传失败，请稍后重试')
  }
}

const removeImage = () => {
  publishForm.backgroundImage = ''
}

const handlePublish = async () => {
  if (!publishFormRef.value) {
    return
  }

  try {
    const valid = await publishFormRef.value.validate()
    if (!valid) {
      return
    }

    const result = await healthEducationStore.publishHealthTip({
      type: publishForm.type,
      title: publishForm.title,
      content: publishForm.content,
      backgroundImage: publishForm.backgroundImage || undefined,
      publisherId: authStore.user?.id,
    })

    if (result.success) {
      ElMessage.success(result.message)
      publishVisible.value = false
      resetPublishForm()
      return
    }

    ElMessage.error(result.message)
  } catch {
    ElMessage.error('发布健康宣教异常，请稍后重试')
  }
}

const loadAlertPage = async (params?: Partial<EpidemicAlertQuery>) => {
  historyLoading.value = true
  try {
    const requestParams: EpidemicAlertQuery = {
      page: params?.page || historyPage.value,
      pageSize: params?.pageSize || historyPageSize.value,
      region: params?.region,
      riskLevel: params?.riskLevel,
      startTime: params?.startTime,
      endTime: params?.endTime,
    }

    const res = await epidemicAlertApi.getDoctorPage(requestParams)
    if (res.code === ResponseCode.SUCCESS && res.data) {
      historyList.value = res.data.dataList || []
      historyTotal.value = res.data.total || 0
      currentAlert.value = historyList.value[0] || null
    }
  } finally {
    historyLoading.value = false
  }
}

const openHistoryDialog = async () => {
  historyVisible.value = true
  await loadAlertPage({ page: historyPage.value, pageSize: historyPageSize.value })
}

const handleHistoryPageChange = async (page: number) => {
  historyPage.value = page
  await loadAlertPage({ page })
}

const openAlertDetail = async (id?: number) => {
  const targetId = id || currentAlert.value?.id
  if (!targetId) {
    return
  }

  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await epidemicAlertApi.getDoctorById(targetId)
    if (res.code === ResponseCode.SUCCESS) {
      detailData.value = res.data || null
    } else {
      detailData.value = null
    }
  } finally {
    detailLoading.value = false
  }
}

const refreshWorkbench = async () => {
  await loadAlertPage({ page: 1, pageSize: historyPageSize.value })
}

onMounted(async () => {
  await refreshWorkbench()
})
</script>

<style scoped>
.doctor-workbench {
  display: flex;
  flex-direction: column;
  gap: 16px;
  inline-size: 100%;
  block-size: 100%;
}

.alert-banner {
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: linear-gradient(100deg, #fff7f7, #fff1f2);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.alert-banner.risk-1 {
  border-color: #bbf7d0;
  background: linear-gradient(100deg, #f0fdf4, #ecfdf5);
}

.alert-banner.risk-2 {
  border-color: #fde68a;
  background: linear-gradient(100deg, #fffbeb, #fefce8);
}

.alert-banner.risk-3 {
  border-color: #fecaca;
  background: linear-gradient(100deg, #fff7f7, #fff1f2);
}

.alert-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.alert-icon {
  margin-block-start: 1px;
  color: #dc2626;
  font-size: 18px;
}

.alert-main h3 {
  margin: 0;
  font-size: 22px;
  color: #991b1b;
}

.alert-main p {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 13px;
}

.alert-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  padding: 16px;
  min-block-size: 126px;
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #54657d;
  font-size: 14px;
}

.stat-value {
  margin: 10px 0 8px;
  font-size: 48px;
  line-height: 1;
  font-weight: 700;
  color: #0f172a;
}

.stat-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #137fec;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.quick-actions h4,
.schedule-card h4 {
  margin: 0;
  font-size: 30px;
  color: #0f172a;
}

.action-grid {
  margin-block-start: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.action-card {
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  background: #fff;
  padding: 18px;
  min-block-size: 106px;
  display: flex;
  gap: 12px;
  align-items: center;
  text-align: start;
  cursor: pointer;
  color: #1e293b;
}

.action-card :deep(svg) {
  inline-size: 18px;
  block-size: 18px;
}

.action-card div strong {
  display: block;
  font-size: 17px;
}

.action-card div p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.action-card.primary {
  background: #fff;
  border-color: #dbe7f5;
  color: #1e293b;
}

.action-card.primary div p {
  color: #64748b;
}

.schedule-card {
  background: #fff;
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schedule-tabs {
  margin-block-end: 6px;
}

.schedule-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schedule-group-title h5 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.history-footer {
  margin-block-start: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-detail {
  display: grid;
  gap: 10px;
}

.alert-detail p {
  margin: 0;
  color: #334155;
}

.alert-detail span {
  color: #0f172a;
  font-weight: 700;
}

.image-upload-area {
  inline-size: 100%;
}

.preview-image {
  position: relative;
  inline-size: 180px;
  block-size: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dbe7f5;
}

.preview-image img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
}

.image-uploader {
  inline-size: 180px;
  block-size: 120px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.upload-placeholder {
  inline-size: 100%;
  block-size: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  gap: 8px;
  font-size: 13px;
}

.upload-icon {
  font-size: 20px;
}

@media (max-width: 1200px) {
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .alert-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .alert-actions {
    inline-size: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 680px) {
  .action-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 40px;
  }

  .quick-actions h4,
  .schedule-card h4,
  .alert-main h3 {
    font-size: 22px;
  }
}
</style>
