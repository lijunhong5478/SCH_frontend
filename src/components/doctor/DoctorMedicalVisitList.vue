<template>
  <section class="doctor-medical-visit-page">
    <header class="page-header">
      <div class="header-left">
        <el-button link type="primary" @click="goBackWorkbench">返回工作台</el-button>
        <h3>问诊记录</h3>
      </div>

      <div class="query-row">
        <el-input
          v-model="queryForm.patientName"
          clearable
          placeholder="按病人姓名查询"
          class="query-input"
          @keyup.enter="handleQuery"
        />
        <el-date-picker
          v-model="queryForm.createDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="按创建日期查询"
          clearable
        />
        <el-button type="primary" :loading="doctorMedicalVisitListLoading" @click="handleQuery">查询</el-button>
        <el-button :loading="doctorMedicalVisitListLoading" @click="handleReset">重置</el-button>
      </div>
    </header>

    <div class="table-card">
      <el-table v-loading="doctorMedicalVisitListLoading" :data="doctorMedicalVisitList" border stripe style="inline-size: 100%">
        <el-table-column prop="doctorName" label="医生姓名" min-width="100" align="center" />
        <el-table-column prop="residentName" label="病人姓名" min-width="100" align="center" />
        <el-table-column prop="chiefComplaint" label="主诉" min-width="220" show-overflow-tooltip />
        <el-table-column prop="treatmentAdvice" label="治疗建议" min-width="220" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!doctorMedicalVisitListLoading && doctorMedicalVisitList.length === 0" description="暂无问诊记录" />

      <footer class="page-footer">
        <span class="page-info">共 {{ doctorMedicalVisitTotal }} 条记录</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="doctorMedicalVisitTotal"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </footer>
    </div>

    <el-dialog v-model="detailVisible" title="问诊记录详情" width="640px" destroy-on-close @close="handleCloseDetail">
      <div v-if="doctorMedicalVisitDetailLoading">详情加载中...</div>
      <div v-else-if="doctorMedicalVisitDetail" class="detail-panel">
        <p><span>医生姓名：</span>{{ doctorMedicalVisitDetail.doctorName || '-' }}</p>
        <p><span>医生电话：</span>{{ doctorMedicalVisitDetail.doctorPhone || '-' }}</p>
        <p><span>科室：</span>{{ doctorMedicalVisitDetail.doctorDepartment || '-' }}</p>
        <p><span>病人姓名：</span>{{ doctorMedicalVisitDetail.residentName || '-' }}</p>
        <p><span>主诉：</span>{{ doctorMedicalVisitDetail.chiefComplaint || '-' }}</p>
        <p><span>治疗建议：</span>{{ doctorMedicalVisitDetail.treatmentAdvice || '-' }}</p>
        <p><span>创建时间：</span>{{ formatDateTime(doctorMedicalVisitDetail.createTime) }}</p>
      </div>
      <el-empty v-else description="暂无详情" />
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth.store'
import { useAppointmentStore } from '@/stores/appointment.store'

const authStore = useAuthStore()
const appointmentStore = useAppointmentStore()
const router = useRouter()
const route = useRoute()

const {
  doctorMedicalVisitListLoading,
  doctorMedicalVisitList,
  doctorMedicalVisitTotal,
  doctorMedicalVisitDetailLoading,
  doctorMedicalVisitDetail,
} = storeToRefs(appointmentStore)

const pageNum = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)

const queryForm = reactive<{
  patientName?: string
  createDate?: string
}>({})

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

  await appointmentStore.fetchDoctorMedicalVisitList({
    doctorId,
    patientName: queryForm.patientName?.trim() || undefined,
    createDate: queryForm.createDate,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  })
}

const handleQuery = async () => {
  pageNum.value = 1
  await fetchList()
}

const handleReset = async () => {
  queryForm.patientName = undefined
  queryForm.createDate = undefined
  await handleQuery()
}

const handlePageChange = async (page: number) => {
  pageNum.value = page
  await fetchList()
}

const openDetail = async (id: number) => {
  detailVisible.value = true
  await appointmentStore.fetchDoctorMedicalVisitById(id)
}

const handleCloseDetail = () => {
  appointmentStore.clearDoctorMedicalVisitDetail()
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

onUnmounted(() => {
  appointmentStore.clearDoctorMedicalVisitDetail()
})
</script>

<style scoped>
.doctor-medical-visit-page {
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
  gap: 12px;
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

.query-input {
  inline-size: 220px;
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

.detail-panel {
  display: grid;
  gap: 8px;
}

.detail-panel p {
  margin: 0;
  color: #334155;
}

.detail-panel span {
  color: #0f172a;
  font-weight: 700;
}
</style>
