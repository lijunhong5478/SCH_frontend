<template>
  <div class="epidemic-alert-container">
    <div class="page-header">
      <h2 class="page-title">疫情预警</h2>
      <el-button type="primary" class="publish-btn" @click="publishVisible = true">
        发布预警
      </el-button>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item search-input">
          <span class="filter-label">地区搜索</span>
          <el-input
            v-model="searchRegion"
            placeholder="请输入地区名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="filter-item">
          <span class="filter-label">风险等级</span>
          <el-select v-model="searchRiskLevel" placeholder="全部风险" clearable @change="handleSearch">
            <el-option
              v-for="option in riskLevelOptions"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="filter-item date-picker">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="年 / 月 / 日"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleSearch"
          />
        </div>

        <div class="filter-item date-picker">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="年 / 月 / 日"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleSearch"
          />
        </div>

        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div v-loading="store.loading" class="notice-section">
      <article
        v-for="item in store.alertList"
        :key="item.id"
        class="notice-card"
        role="button"
        tabindex="0"
        @click="openDetail(item.id)"
        @keyup.enter="openDetail(item.id)"
      >
        <div class="notice-cover" :class="`risk-${item.riskLevel}`">
          <div class="cover-topline">
            <span class="region">{{ item.region }}</span>
            <el-tag effect="dark" :type="getRiskTagType(item.riskLevel)">
              {{ getRiskLabel(item.riskLevel) }}
            </el-tag>
          </div>
          <p class="publish-time">发布时间 {{ formatDateTime(item.publishTime) }}</p>
        </div>

        <div class="notice-body">
          <p class="notice-message">{{ item.message }}</p>
          <div class="notice-actions">
            <button class="text-btn" type="button" @click.stop="openDetail(item.id)">查看详情</button>
            <button class="text-btn danger" type="button" @click.stop="confirmDelete(item)">删除</button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="!store.isEmpty && !store.loading" class="pagination-container">
      <span class="total-info">共 {{ store.total }} 条记录</span>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[2]"
        :total="store.total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <div v-if="store.isEmpty && !store.loading" class="empty-container">
      <el-icon class="empty-icon"><WarningFilled /></el-icon>
      <p>暂无疫情预警记录</p>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="疫情预警详情"
      width="720px"
      destroy-on-close
      @close="store.clearDetail"
    >
      <div v-if="store.detailLoading" class="detail-loading">详情加载中...</div>
      <template v-else-if="store.currentDetail">
        <div class="detail-cover" :class="`risk-${store.currentDetail.riskLevel}`">
          <h3>{{ store.currentDetail.region }}</h3>
          <div class="detail-meta">
            <el-tag effect="dark" :type="getRiskTagType(store.currentDetail.riskLevel)">
              {{ getRiskLabel(store.currentDetail.riskLevel) }}
            </el-tag>
            <span>{{ formatDateTime(store.currentDetail.publishTime) }}</span>
          </div>
        </div>

        <div class="detail-content">
          {{ store.currentDetail.message }}
        </div>
      </template>
      <div v-else class="detail-loading">未查询到详情信息</div>
    </el-dialog>

    <el-dialog
      v-model="publishVisible"
      title="发布疫情预警"
      width="620px"
      destroy-on-close
      @close="resetPublishForm"
    >
      <el-form
        ref="publishFormRef"
        :model="publishForm"
        :rules="publishRules"
        label-width="90px"
        class="publish-form"
      >
        <el-form-item label="地区" prop="region">
          <el-input v-model="publishForm.region" placeholder="请输入地区，如：上海市浦东新区" maxlength="100" />
        </el-form-item>

        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="publishForm.riskLevel" placeholder="请选择风险等级" style="width: 100%">
            <el-option label="低风险" :value="RiskLevelConst.LOW" />
            <el-option label="中风险" :value="RiskLevelConst.MEDIUM" />
            <el-option label="高风险" :value="RiskLevelConst.HIGH" />
          </el-select>
        </el-form-item>

        <el-form-item label="预警内容" prop="message">
          <el-input
            v-model="publishForm.message"
            type="textarea"
            :rows="6"
            maxlength="1000"
            show-word-limit
            placeholder="请输入疫情预警通知内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" :loading="store.publishLoading" @click="handlePublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, WarningFilled } from '@element-plus/icons-vue'
import { useEpidemicAlertStore } from '@/stores/epidemic-alert.store'
import type { EpidemicAlert, PublishEpidemicAlertDTO, RiskLevel } from '@/types/epidemic-alert.types'
import {
  RiskLevel as RiskLevelConst,
  getRiskLevelLabel,
  getRiskLevelTagType,
  riskLevelOptions,
} from '@/types/epidemic-alert.types'

const store = useEpidemicAlertStore()

const searchRegion = ref('')
const searchRiskLevel = ref<RiskLevel | undefined>(undefined)
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

const currentPage = ref(1)
const pageSize = ref(2)
const detailVisible = ref(false)

const publishVisible = ref(false)
const publishFormRef = ref<FormInstance>()
const publishForm = reactive<PublishEpidemicAlertDTO>({
  region: '',
  riskLevel: RiskLevelConst.MEDIUM,
  message: '',
})

const publishRules: FormRules = {
  region: [
    { required: true, message: '请输入地区', trigger: 'blur' },
    { min: 2, max: 100, message: '地区长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  message: [
    { required: true, message: '请输入预警内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
}

const getRiskLabel = (level: RiskLevel): string => {
  return getRiskLevelLabel(level)
}

const getRiskTagType = (level: RiskLevel): 'success' | 'warning' | 'danger' | 'info' => {
  return getRiskLevelTagType(level)
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

const openDetail = async (id: number) => {
  detailVisible.value = true
  await store.fetchAlertById(id)
}

const formatDateToStartTime = (dateStr: string | null): string | undefined => {
  if (!dateStr) return undefined
  return `${dateStr} 00:00:00`
}

const formatDateToEndTime = (dateStr: string | null): string | undefined => {
  if (!dateStr) return undefined
  return `${dateStr} 23:59:59`
}

const handleSearch = () => {
  currentPage.value = 1
  store.updateQuery({
    region: searchRegion.value,
    riskLevel: searchRiskLevel.value,
    startTime: formatDateToStartTime(startDate.value),
    endTime: formatDateToEndTime(endDate.value),
  })
}

const handleReset = () => {
  searchRegion.value = ''
  searchRiskLevel.value = undefined
  startDate.value = null
  endDate.value = null
  currentPage.value = 1
  pageSize.value = 2
  store.resetQuery()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  store.changePage(page)
}

const resetPublishForm = () => {
  publishForm.region = ''
  publishForm.riskLevel = RiskLevelConst.MEDIUM
  publishForm.message = ''
  publishFormRef.value?.resetFields()
}

const handlePublish = async () => {
  if (!publishFormRef.value) return

  try {
    const valid = await publishFormRef.value.validate()
    if (!valid) {
      return
    }

    const result = await store.publishAlert({
      region: publishForm.region.trim(),
      riskLevel: publishForm.riskLevel,
      message: publishForm.message.trim(),
    })

    if (result.success) {
      ElMessage.success(result.message)
      publishVisible.value = false
      resetPublishForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('发布疫情预警异常:', error)
  }
}

const confirmDelete = (item: EpidemicAlert) => {
  ElMessageBox.confirm(`确定要删除疫情预警「${item.region}」吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      const result = await store.deleteAlert(item.id)
      if (result.success) {
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
    })
    .catch(() => {
      // 取消删除
    })
}

onMounted(() => {
  store.fetchAlerts()
})
</script>

<style scoped>
.epidemic-alert-container {
  width: 100%;
  height: 100%;
  padding: 0;
  background-color: #fafafa;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #e07a3a;
  margin: 0;
}

.publish-btn {
  font-weight: 500;
}

.filter-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.search-input {
  min-width: 260px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.filter-item :deep(.el-select) {
  width: 140px;
}

.date-picker :deep(.el-date-editor) {
  width: 180px;
}

.reset-btn {
  background: #f0f2f5;
  border: none;
  color: #333;
  font-weight: 500;
}

.notice-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: auto;
  display: grid;
  gap: 14px;
  align-content: start;
  flex: 1;
}

.notice-card {
  border: 1px solid #e6ecf5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notice-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  border-color: #bfd9f8;
}

.notice-cover {
  padding: 14px 16px;
  color: #fff;
}

.notice-cover.risk-1 {
  background: linear-gradient(90deg, #1d976c, #34c792);
}

.notice-cover.risk-2 {
  background: linear-gradient(90deg, #f59e0b, #f8bb48);
}

.notice-cover.risk-3 {
  background: linear-gradient(90deg, #dc2626, #f87171);
}

.cover-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.region {
  font-size: 18px;
  font-weight: 700;
}

.publish-time {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.92;
}

.notice-body {
  padding: 14px 16px;
}

.notice-message {
  margin: 0;
  line-height: 1.7;
  color: #334155;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.text-btn {
  border: 0;
  background: transparent;
  padding: 0;
  color: #137fec;
  font-size: 14px;
  cursor: pointer;
}

.text-btn.danger {
  color: #e5484d;
}

.detail-cover {
  border-radius: 12px;
  padding: 18px;
  color: #fff;
}

.detail-cover h3 {
  margin: 0;
  font-size: 24px;
}

.detail-cover.risk-1 {
  background: linear-gradient(90deg, #1d976c, #34c792);
}

.detail-cover.risk-2 {
  background: linear-gradient(90deg, #f59e0b, #f8bb48);
}

.detail-cover.risk-3 {
  background: linear-gradient(90deg, #dc2626, #f87171);
}

.detail-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.detail-content {
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  padding: 16px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-top: 20px;
}

.total-info {
  font-size: 14px;
  color: #666;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #999;
  gap: 12px;
}

.empty-icon {
  font-size: 42px;
  color: #d7d7d7;
}

.detail-loading {
  min-height: 140px;
  display: grid;
  place-items: center;
  color: #64748b;
}

@media (max-width: 768px) {
  .epidemic-alert-container {
    min-height: auto;
  }

  .filter-row {
    gap: 14px;
  }

  .search-input {
    width: 100%;
    min-width: 100%;
  }

  .filter-item :deep(.el-select),
  .date-picker :deep(.el-date-editor) {
    width: 100%;
  }

  .cover-topline {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
