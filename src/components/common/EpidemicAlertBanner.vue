<template>
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
      <el-button type="danger" :disabled="!currentAlert" @click="openAlertDetail">查看详情</el-button>
    </div>
  </article>

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
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { epidemicAlertApi } from '@/api/epidemic-alert.api'
import { ResponseCode } from '@/types/api.types'
import { getRiskLevelLabel, getRiskLevelTagType, type EpidemicAlert, type EpidemicAlertQuery, type RiskLevel } from '@/types/epidemic-alert.types'

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
    if ((res.code === ResponseCode.SUCCESS || res.code === 0) && res.data) {
      historyList.value = res.data.dataList || []
      historyTotal.value = res.data.total || 0
      currentAlert.value = historyList.value[0] || null
      return
    }

    historyList.value = []
    historyTotal.value = 0
    currentAlert.value = null
  } catch {
    historyList.value = []
    historyTotal.value = 0
    currentAlert.value = null
    ElMessage.error('加载疫情预警失败，请稍后重试')
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
    if (res.code === ResponseCode.SUCCESS || res.code === 0) {
      detailData.value = res.data || null
    } else {
      detailData.value = null
    }
  } catch {
    detailData.value = null
    ElMessage.error('加载预警详情失败，请稍后重试')
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadAlertPage({ page: 1, pageSize: historyPageSize.value })
})
</script>

<style scoped>
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

@media (max-width: 900px) {
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
  .alert-main h3 {
    font-size: 22px;
  }
}
</style>
