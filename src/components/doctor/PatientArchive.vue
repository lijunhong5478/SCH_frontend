<template>
  <section class="patient-archive-page">
    <template v-if="activeRecord">
      <div class="report-toolbar no-export">
        <button type="button" class="toolbar-btn" @click="backToArchiveList">返回主界面</button>
        <button type="button" class="toolbar-btn primary" :disabled="exportingPdf" @click="exportPdf">
          {{ exportingPdf ? '导出中...' : '导出 PDF' }}
        </button>
      </div>

      <article ref="reportRef" class="record-report-sheet">
        <header class="report-header">
          <div>
            <h2>{{ activeRecord.title || `${activeRecord.name}健康档案` }}</h2>
            <p>Resident Health Record</p>
          </div>
          <div class="report-meta">
            <p>档案编号：HR-{{ activeRecord.id }}</p>
            <p>报告日期：{{ formatDateTime(new Date().toISOString()) }}</p>
          </div>
        </header>

        <section class="base-info-card">
          <img
            ref="reportAvatarRef"
            :src="reportAvatarSrc || fallbackAvatar"
            alt="居民头像"
            class="report-avatar"
          />
          <div class="base-info-grid">
            <p><span>姓名</span><strong>{{ activeRecord.name }}</strong></p>
            <p><span>性别</span><strong>{{ healthRecordStore.getGenderText(activeRecord.gender) }}</strong></p>
            <p><span>年龄</span><strong>{{ activeRecord.age }}岁</strong></p>
            <p><span>联系电话</span><strong>{{ activeRecord.phone || '-' }}</strong></p>
            <p><span>身份证号</span><strong>{{ maskIdCard(activeRecord.idCard) }}</strong></p>
            <p><span>紧急联系方式</span><strong>{{ activeRecord.contact || '-' }}</strong></p>
            <p class="full-line"><span>家庭住址</span><strong>{{ activeRecord.address || '-' }}</strong></p>
          </div>
        </section>

        <section class="report-section">
          <h3>病史详情</h3>
          <div class="history-grid">
            <article>
              <h4>慢性病史</h4>
              <p>{{ medicalHistory?.chronicDisease || '暂无记录' }}</p>
            </article>
            <article>
              <h4>既往病史</h4>
              <p>{{ medicalHistory?.pastMedicalHistory || '暂无记录' }}</p>
            </article>
            <article>
              <h4>过敏史</h4>
              <p class="highlight">{{ medicalHistory?.allergyHistory || '暂无记录' }}</p>
            </article>
            <article>
              <h4>手术史</h4>
              <p>{{ medicalHistory?.surgeryHistory || '暂无记录' }}</p>
            </article>
            <article class="full-width">
              <h4>家族史</h4>
              <p>{{ medicalHistory?.familyHistory || '暂无记录' }}</p>
            </article>
          </div>
        </section>

        <section class="report-section">
          <h3>诊断报告</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>诊断日期</th>
                <th>诊断结果</th>
                <th>详细说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in diagnosisRows" :key="item.id">
                <td>{{ formatDateTime(item.createTime) }}</td>
                <td>{{ item.diagnosisResult }}</td>
                <td>{{ item.diagnosisDetail }}</td>
              </tr>
              <tr v-if="!diagnosisRows.length">
                <td colspan="3" class="empty-cell">暂无诊断报告</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="report-section">
          <h3>检查报告（最近）</h3>
          <div class="exam-grid">
            <article v-for="item in examRows" :key="item.id" class="exam-item">
              <div class="exam-title">{{ getReportTypeText(item.reportType) }}</div>
              <div class="exam-time">{{ formatDateTime(item.createTime) }}</div>
              <p>{{ item.reportContent }}</p>
            </article>
            <p v-if="!examRows.length" class="empty-text">暂无检查报告</p>
          </div>
        </section>

        <section class="report-section">
          <h3>体检检查趋势</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>检查日期</th>
                <th>身高(cm)</th>
                <th>体重(kg)</th>
                <th>血压(mmHg)</th>
                <th>心率(bpm)</th>
                <th>空腹血糖(mmol/L)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in physicalRows" :key="item.id">
                <td>{{ formatDateTime(item.examTime) }}</td>
                <td>{{ formatNumber(item.height) }}</td>
                <td>{{ formatNumber(item.weight) }}</td>
                <td>{{ item.systolicBp }}/{{ item.diastolicBp }}</td>
                <td>{{ formatNumber(item.heartRate) }}</td>
                <td>{{ formatNumber(item.bloodSugar) }}</td>
              </tr>
              <tr v-if="!physicalRows.length">
                <td colspan="6" class="empty-cell">暂无体检记录</td>
              </tr>
            </tbody>
          </table>
        </section>
      </article>
    </template>

    <template v-else>
      <header class="page-header">
        <h3>患者档案</h3>
        <div class="query-row">
          <el-input v-model="queryForm.realName" placeholder="姓名" clearable class="query-input" />
          <el-input v-model="queryForm.phone" placeholder="手机号" clearable class="query-input" />
          <el-input v-model="queryForm.idCard" placeholder="身份证号" clearable class="query-input" />
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button :loading="loading" @click="handleReset">重置</el-button>
        </div>
      </header>

      <el-skeleton :loading="loading" animated :count="4">
        <template #template>
          <div class="archive-card-skeleton" />
        </template>

        <template #default>
          <div v-if="recordList.length" class="archive-grid">
            <article v-for="record in recordList" :key="record.id" class="archive-card">
              <h4 class="archive-title">{{ record.title || `${record.name}健康档案` }}</h4>

              <div class="patient-identity">
                <img
                  :src="record.avatarUrl || fallbackAvatar"
                  alt="居民头像"
                  class="patient-avatar"
                />
                <div class="patient-main">
                  <div class="name-line">
                    <span class="patient-name">{{ record.name }}</span>
                    <span class="patient-meta">{{ healthRecordStore.getGenderText(record.gender) }} · {{ record.age }}岁</span>
                  </div>
                  <p class="patient-phone">{{ record.phone || '-' }}</p>
                </div>
              </div>

              <div class="address-box">
                <span class="address-label">现居住址</span>
                <p class="address-text">{{ record.address || '暂无地址' }}</p>
              </div>

              <div class="card-actions">
                <button type="button" class="action-btn" @click="handleDetail(record)">查看详情</button>
                <button type="button" class="action-btn secondary" @click="handleExportReport(record)">导出报表</button>
              </div>
            </article>
          </div>

          <el-empty v-else description="暂无患者档案" />
        </template>
      </el-skeleton>

      <footer class="page-footer">
        <span class="page-info">显示第 {{ pageStart }} 到 {{ pageEnd }} 条，共 {{ total }} 条患者档案</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageNumChange"
        />
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useHealthRecordStore } from '@/stores/health-record.store'
import type {
  DiagnosisReport,
  DoctorHealthRecord,
  ExaminationReport,
  PhysicalExamRecord,
  ResidentMedicalHistory,
} from '@/types/health-record.types'

interface HealthRecordQueryForm {
  realName?: string
  phone?: string
  idCard?: string
}

const fallbackAvatar =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%2292%22 viewBox=%220 0 92 92%22%3E%3Crect width=%2292%22 height=%2292%22 rx=%228%22 fill=%22%23eef3f9%22/%3E%3Ccircle cx=%2246%22 cy=%2234%22 r=%2216%22 fill=%22%23c8d5e6%22/%3E%3Cpath d=%22M20 75c0-14.4 11.6-26 26-26s26 11.6 26 26%22 fill=%22%23c8d5e6%22/%3E%3C/svg%3E'

const reportTypeTextMap: Record<number, string> = {
  1: '血常规',
  2: '心电图',
  3: '尿常规',
  4: '血糖',
  5: '肝功能',
  6: '血压监测',
}

const healthRecordStore = useHealthRecordStore()
const { recordList, total, loading } = storeToRefs(healthRecordStore)

const queryForm = reactive<HealthRecordQueryForm>({})
const pageNum = ref(1)
const pageSize = ref(10)

const activeRecord = ref<DoctorHealthRecord | null>(null)
const reportRef = ref<HTMLElement | null>(null)
const reportAvatarRef = ref<HTMLImageElement | null>(null)
const reportAvatarSrc = ref(fallbackAvatar)
const exportingPdf = ref(false)

const pageStart = computed(() => {
  if (!total.value) {
    return 0
  }
  return (pageNum.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  if (!total.value) {
    return 0
  }
  return Math.min(pageNum.value * pageSize.value, total.value)
})

const medicalHistory = computed<ResidentMedicalHistory | null>(() => {
  return activeRecord.value?.residentMedicalHistories?.[0] ?? null
})

const diagnosisRows = computed<DiagnosisReport[]>(() => {
  return [...(activeRecord.value?.diagnosisReports || [])]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, 8)
})

const examRows = computed<ExaminationReport[]>(() => {
  return [...(activeRecord.value?.examinationReports || [])]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, 6)
})

const physicalRows = computed<PhysicalExamRecord[]>(() => {
  return [...(activeRecord.value?.physicalExamRecords || [])]
    .sort((a, b) => new Date(b.examTime).getTime() - new Date(a.examTime).getTime())
    .slice(0, 10)
})

const normalizeQuery = () => {
  return {
    realName: queryForm.realName?.trim() || undefined,
    phone: queryForm.phone?.trim() || undefined,
    idCard: queryForm.idCard?.trim() || undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  }
}

const queryRecordList = async () => {
  await healthRecordStore.queryRecordList(normalizeQuery())
}

const handleQuery = async () => {
  pageNum.value = 1
  await queryRecordList()
}

const handleReset = async () => {
  queryForm.realName = undefined
  queryForm.phone = undefined
  queryForm.idCard = undefined
  pageNum.value = 1
  healthRecordStore.resetQuery()
  await queryRecordList()
}

const handlePageNumChange = async (value: number) => {
  pageNum.value = value
  await queryRecordList()
}

const handleDetail = (record: DoctorHealthRecord) => {
  activeRecord.value = record
  reportAvatarSrc.value = record.avatarUrl || fallbackAvatar
}

const handleExportReport = (record: DoctorHealthRecord) => {
  activeRecord.value = record
  reportAvatarSrc.value = record.avatarUrl || fallbackAvatar
}

const backToArchiveList = () => {
  activeRecord.value = null
}

const getReportTypeText = (reportType: number) => {
  return reportTypeTextMap[reportType] || `检查类型${reportType}`
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
  return `${yyyy}-${mm}-${dd}`
}

const formatNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

const maskIdCard = (idCard?: string) => {
  if (!idCard) {
    return '-'
  }
  if (idCard.length <= 8) {
    return idCard
  }
  return `${idCard.slice(0, 4)}**********${idCard.slice(-4)}`
}

const buildProxyImageUrl = (url: string) => {
  return `/api/common/file/proxy-image?url=${encodeURIComponent(url)}`
}

const waitForImageReady = async () => {
  const img = reportAvatarRef.value
  if (!img) {
    return
  }

  if (img.complete && img.naturalWidth > 0) {
    return
  }

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', onError)
    }

    const onLoad = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      resolve()
    }

    img.addEventListener('load', onLoad)
    img.addEventListener('error', onError)

    setTimeout(() => {
      cleanup()
      resolve()
    }, 2500)
  })
}

const exportPdf = async () => {
  if (!activeRecord.value || !reportRef.value) {
    return
  }

  exportingPdf.value = true
  try {
    if (activeRecord.value.avatarUrl) {
      reportAvatarSrc.value = buildProxyImageUrl(activeRecord.value.avatarUrl)
      await nextTick()
      await waitForImageReady()
    }

    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imageWidth = pageWidth - margin * 2
    const imageHeight = (canvas.height * imageWidth) / canvas.width

    let heightLeft = imageHeight
    let position = margin

    pdf.addImage(imageData, 'JPEG', margin, position, imageWidth, imageHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = margin - (imageHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imageData, 'JPEG', margin, position, imageWidth, imageHeight)
      heightLeft -= pageHeight - margin * 2
    }

    pdf.save(`${activeRecord.value.name || '患者'}-健康档案报表.pdf`)
    ElMessage.success('PDF 已生成并开始下载')
  } catch {
    ElMessage.error('导出 PDF 失败，请稍后重试')
  } finally {
    reportAvatarSrc.value = activeRecord.value?.avatarUrl || fallbackAvatar
    exportingPdf.value = false
  }
}

onMounted(async () => {
  await queryRecordList()
})
</script>

<style scoped>
.patient-archive-page {
  width: 100%;
  min-height: 100%;
  padding: 18px 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f4f7fc;
}

.report-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar-btn {
  height: 38px;
  border: 1px solid #d0deef;
  border-radius: 20px;
  padding: 0 16px;
  background: #ffffff;
  color: #274566;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.toolbar-btn.primary {
  border: 0;
  background: #2d7bff;
  color: #ffffff;
}

.toolbar-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.record-report-sheet {
  width: min(980px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #dce4ef;
  border-radius: 6px;
  padding: 28px 34px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #5d9dff;
  padding-bottom: 12px;
}

.report-header h2 {
  margin: 0;
  font-size: 32px;
  color: #1c2e49;
}

.report-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #65758b;
}

.report-meta p {
  margin: 0;
  font-size: 13px;
  color: #445a77;
  text-align: right;
  line-height: 1.6;
}

.base-info-card {
  margin-top: 18px;
  background: #eef3f9;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.report-avatar {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #d5dfec;
  background: #ffffff;
}

.base-info-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.base-info-grid p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #dce4ef;
  padding-bottom: 4px;
  gap: 12px;
}

.base-info-grid .full-line {
  grid-column: 1 / -1;
}

.base-info-grid span {
  color: #51627b;
  font-size: 13px;
}

.base-info-grid strong {
  color: #20334f;
  font-size: 14px;
  font-weight: 600;
}

.report-section {
  margin-top: 18px;
}

.report-section h3 {
  margin: 0 0 10px;
  padding-left: 8px;
  border-left: 4px solid #2d7bff;
  color: #1f3455;
  font-size: 17px;
}

.history-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.history-grid article {
  border: 1px solid #e0e8f3;
  border-radius: 4px;
  padding: 10px;
  background: #ffffff;
}

.history-grid article.full-width {
  grid-column: 1 / -1;
}

.history-grid h4 {
  margin: 0;
  color: #233955;
  font-size: 14px;
}

.history-grid p {
  margin: 8px 0 0;
  color: #445975;
  font-size: 13px;
  line-height: 1.5;
}

.history-grid p.highlight {
  color: #d34040;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dfe8f3;
  background: #ffffff;
}

.report-table th,
.report-table td {
  border: 1px solid #dfe8f3;
  padding: 8px;
  text-align: left;
  font-size: 12px;
  color: #2a3f5d;
  vertical-align: top;
}

.report-table th {
  background: #f4f7fc;
  font-weight: 700;
}

.empty-cell {
  text-align: center;
  color: #7a8ba2;
}

.exam-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.exam-item {
  border-bottom: 1px dashed #dbe3ef;
  padding-bottom: 8px;
}

.exam-title {
  color: #1f3556;
  font-size: 14px;
  font-weight: 700;
}

.exam-time {
  color: #8b9aaf;
  font-size: 12px;
  margin-top: 2px;
}

.exam-item p {
  margin: 4px 0 0;
  color: #425b79;
  font-size: 13px;
  line-height: 1.45;
}

.empty-text {
  margin: 0;
  color: #7a8ba2;
  font-size: 13px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h3 {
  margin: 0;
  font-size: 20px;
  color: #12233f;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.query-input {
  width: 160px;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.archive-card,
.archive-card-skeleton {
  background: #fff;
  border: 1px solid #dce7f4;
  border-radius: 14px;
  padding: 16px;
}

.archive-card-skeleton {
  height: 280px;
}

.archive-title {
  margin: 0 0 16px;
  color: #1a2a44;
  font-size: 18px;
}

.patient-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.patient-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  background: #f1f5fb;
}

.patient-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.patient-name {
  color: #1a2a44;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.patient-meta {
  color: #637186;
  font-size: 14px;
}

.patient-phone {
  margin: 0;
  color: #3f4d64;
  font-size: 16px;
}

.address-box {
  border-radius: 12px;
  background: #f2f5fa;
  padding: 10px 12px;
  min-height: 84px;
}

.address-label {
  color: #8b96a8;
  font-size: 12px;
}

.address-text {
  margin: 6px 0 0;
  color: #3f4d64;
  font-size: 14px;
  line-height: 1.45;
}

.card-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: #eef3fa;
  color: #1b2c48;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn:hover {
  background: #e5edf8;
}

.action-btn.secondary {
  background: #e8f3ff;
  color: #0b63ce;
}

.action-btn.secondary:hover {
  background: #dbeeff;
}

.page-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.page-info {
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 960px) {
  .patient-archive-page {
    padding: 16px;
  }

  .record-report-sheet {
    padding: 18px;
  }

  .query-input {
    width: 140px;
  }
}

@media (max-width: 680px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .query-row {
    width: 100%;
  }

  .query-input {
    width: calc(50% - 5px);
  }

  .archive-grid,
  .history-grid,
  .exam-grid {
    grid-template-columns: 1fr;
  }

  .report-header {
    gap: 8px;
    flex-direction: column;
  }

  .report-meta p {
    text-align: left;
  }

  .base-info-card {
    flex-direction: column;
  }

  .base-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
