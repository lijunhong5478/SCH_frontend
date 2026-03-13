<template>
  <section class="doctor-diagnosis-page">
    <header class="page-header">
      <div class="header-left">
        <el-button link type="primary" @click="goBackWorkbench">返回工作台</el-button>
        <h3>诊断记录</h3>
      </div>

      <div class="query-row">
        <el-date-picker
          v-model="queryForm.createDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="按创建时间查询"
          clearable
        />
        <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
        <el-button :loading="loading" @click="handleReset">重置</el-button>
      </div>
    </header>

    <div class="table-card">
      <el-table v-loading="loading" :data="list" border stripe style="inline-size: 100%">
        <el-table-column prop="id" label="ID" width="90" align="center" />
        <el-table-column prop="healthRecordId" label="健康档案ID" min-width="120" align="center" />
        <el-table-column prop="diagnosisResult" label="诊断结果" min-width="180" />
        <el-table-column prop="diagnosisDetail" label="诊断细节" min-width="320" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" text :loading="submitting" @click="openEdit(row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && list.length === 0" description="暂无诊断记录" />

      <footer class="page-footer">
        <span class="page-info">共 {{ total }} 条记录</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </footer>
    </div>

    <el-dialog v-model="editVisible" title="修改诊断报告" width="560px" destroy-on-close @close="resetEditDialog">
      <el-form label-position="top">
        <el-form-item label="诊断结果">
          <el-input
            v-model="editForm.diagnosisResult"
            maxlength="100"
            show-word-limit
            placeholder="请输入诊断结果"
          />
        </el-form-item>
        <el-form-item label="诊断细节">
          <el-input
            v-model="editForm.diagnosisDetail"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入诊断细节"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth.store'
import { useDiagnosisReportStore } from '@/stores/diagnosis-report.store'
import type { DiagnosisReport } from '@/types/health-record.types'

const authStore = useAuthStore()
const diagnosisStore = useDiagnosisReportStore()
const route = useRoute()
const router = useRouter()

const { loading, list, total, submitting } = storeToRefs(diagnosisStore)

const pageNum = ref(1)
const pageSize = ref(10)
const editVisible = ref(false)
const editingRow = ref<DiagnosisReport | null>(null)

const queryForm = reactive<{ createDate?: string }>({})
const editForm = reactive({
  diagnosisResult: '',
  diagnosisDetail: '',
})

const formatDateTime = (value?: string) => {
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

const fetchList = async () => {
  const doctorId = authStore.user?.id
  if (!doctorId) {
    ElMessage.error('医生信息异常，请重新登录后再试')
    return
  }

  await diagnosisStore.queryList('doctor', {
    doctorId,
    createDate: queryForm.createDate || undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  })
}

const handleQuery = async () => {
  pageNum.value = 1
  await fetchList()
}

const handleReset = async () => {
  queryForm.createDate = undefined
  await handleQuery()
}

const handlePageChange = async (page: number) => {
  pageNum.value = page
  await fetchList()
}

const openEdit = (row: DiagnosisReport) => {
  editingRow.value = row
  editForm.diagnosisResult = row.diagnosisResult || ''
  editForm.diagnosisDetail = row.diagnosisDetail || ''
  editVisible.value = true
}

const resetEditDialog = () => {
  editingRow.value = null
  editForm.diagnosisResult = ''
  editForm.diagnosisDetail = ''
}

const submitEdit = async () => {
  if (!editingRow.value) {
    return
  }

  const diagnosisResult = editForm.diagnosisResult.trim()
  const diagnosisDetail = editForm.diagnosisDetail.trim()
  if (!diagnosisResult || !diagnosisDetail) {
    ElMessage.warning('请填写完整的诊断结果和诊断细节')
    return
  }

  try {
    const res = await diagnosisStore.updateDoctorDiagnosis({
      id: editingRow.value.id,
      diagnosisResult,
      diagnosisDetail,
    })

    if (res.code === 1) {
      ElMessage.success(res.message || '诊断报告修改成功')
      editVisible.value = false
      resetEditDialog()
      await fetchList()
      return
    }

    ElMessage.error(res.message || '诊断报告修改失败')
  } catch {
    ElMessage.error('诊断报告修改失败，请稍后重试')
  }
}

const goBackWorkbench = () => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: 'workbench',
    },
  })
}

onMounted(async () => {
  await fetchList()
})
</script>

<style scoped>
.doctor-diagnosis-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  inline-size: 100%;
  block-size: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h3 {
  margin: 0;
  color: #133d78;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
