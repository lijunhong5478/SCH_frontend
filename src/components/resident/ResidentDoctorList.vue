<template>
  <section class="resident-doctor-page">
    <aside class="filter-panel">
      <div class="filter-header">
        <el-icon class="filter-icon"><Search /></el-icon>
        <span>筛选医生</span>
      </div>

      <el-form label-position="top" class="filter-form" @submit.prevent>
        <el-form-item label="科室名称">
          <el-select
            v-model="filterForm.departmentId"
            placeholder="全部科室"
            clearable
            class="full-width"
            :loading="departmentLoading"
          >
            <el-option
              v-for="department in departments"
              :key="department.id"
              :label="department.name"
              :value="department.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="医生姓名">
          <el-input v-model="filterForm.name" placeholder="输入姓名搜索" clearable />
        </el-form-item>

        <el-form-item label="就诊时段">
          <el-select v-model="filterForm.timeSlot" placeholder="不限" clearable class="full-width">
            <el-option label="上午" value="AM" />
            <el-option label="下午" value="PM" />
          </el-select>
        </el-form-item>

        <el-form-item label="职称">
          <el-select v-model="filterForm.title" placeholder="不限" clearable class="full-width">
            <el-option
              v-for="option in doctorTitleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.workDay"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            class="full-width"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <div class="filter-actions">
          <el-button type="primary" :loading="loading" @click="handleQuery">立即查询</el-button>
          <el-button :loading="loading" plain @click="handleReset">重置</el-button>
        </div>
      </el-form>
    </aside>

    <div class="doctor-panel">
      <el-skeleton :loading="loading" animated :count="3">
        <template #template>
          <div class="doctor-card-skeleton" />
        </template>

        <template #default>
          <div v-if="doctorList.length" class="doctor-list">
            <article v-for="doctor in doctorList" :key="doctor.userId" class="doctor-card">
              <div class="doctor-header">
                <img :src="doctor.avatarUrl || fallbackAvatar" alt="医生头像" class="doctor-avatar" />
                <div class="doctor-main">
                  <h4>{{ doctor.name }}</h4>
                  <p class="doctor-phone">{{ doctor.phone }}</p>
                  <p class="doctor-title">{{ residentDoctorStore.getDoctorTitleText(doctor.title) }}</p>
                </div>
              </div>

              <div class="doctor-meta">
                <p>
                  <span class="meta-label">科室</span>
                  <span>{{ doctor.departmentName }}</span>
                </p>
                <p>
                  <span class="meta-label">擅长</span>
                  <span>{{ doctor.specialty || '-' }}</span>
                </p>
                <p>
                  <span class="meta-label">信息</span>
                  <span>{{ residentDoctorStore.getGenderText(doctor.gender) }} | {{ doctor.age }}岁</span>
                </p>
                <p>
                  <span class="meta-label">出诊</span>
                  <span>{{ residentDoctorStore.getFullScheduleText(doctor) }}</span>
                </p>
              </div>

              <p class="doctor-intro" :title="doctor.introduction || ''">
                擅长介绍：{{ doctor.introduction || '暂无简介' }}
              </p>

              <div class="doctor-actions">
                <el-button type="primary" @click="handleReserve(doctor)">预约挂号</el-button>
                <el-button plain @click="handleConsult(doctor)">在线问诊</el-button>
              </div>
            </article>
          </div>

          <el-empty v-else description="暂无符合条件的医生" />
        </template>
      </el-skeleton>

      <footer class="panel-footer">
        <span class="total-text">共 {{ total }} 位医生</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageNumChange"
        />
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account.store'
import { useResidentDoctorStore } from '@/stores/resident-doctor.store'
import type { DoctorTitle } from '@/types/account.types'
import type { DoctorTimeSlot, ResidentDoctor } from '@/types/resident-doctor.types'

interface DoctorFilterForm {
  departmentId?: number
  name?: string
  timeSlot?: DoctorTimeSlot
  title?: DoctorTitle
  workDay?: string
}

const fallbackAvatar = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

const accountStore = useAccountStore()
const residentDoctorStore = useResidentDoctorStore()
const { departments } = storeToRefs(accountStore)
const { doctorList, total, loading } = storeToRefs(residentDoctorStore)

const departmentLoading = ref(false)

const pageNum = ref(1)
const pageSize = ref(8)

const filterForm = reactive<DoctorFilterForm>({})

const doctorTitleOptions: Array<{ label: string; value: DoctorTitle }> = [
  { label: '住院医师', value: 1 },
  { label: '主治医师', value: 2 },
  { label: '副主任医师', value: 3 },
  { label: '主任医师', value: 4 },
]

const normalizeQueryParams = () => {
  return {
    departmentId: filterForm.departmentId,
    name: filterForm.name ? filterForm.name.trim() : undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    timeSlot: filterForm.timeSlot,
    title: filterForm.title,
    workDay: filterForm.workDay,
  }
}

const disabledDate = (time: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)
  return time.getTime() < today.getTime() || time.getTime() > sevenDaysLater.getTime()
}

const queryDoctorList = async () => {
  await residentDoctorStore.queryDoctorList(normalizeQueryParams())
}

const handleQuery = async () => {
  pageNum.value = 1
  await queryDoctorList()
}

const handleReset = async () => {
  filterForm.departmentId = undefined
  filterForm.name = undefined
  filterForm.timeSlot = undefined
  filterForm.title = undefined
  filterForm.workDay = undefined
  await handleQuery()
}

const handlePageNumChange = async (value: number) => {
  pageNum.value = value
  await queryDoctorList()
}

const loadDepartments = async () => {
  departmentLoading.value = true
  try {
    await accountStore.getAllDepartments()
  } catch (error) {
    console.error('加载科室失败:', error)
    ElMessage.error('加载科室失败')
  } finally {
    departmentLoading.value = false
  }
}

const handleReserve = (doctor: ResidentDoctor) => {
  ElMessage.info(`已选择 ${doctor.name}，预约功能待接入`)
}

const handleConsult = (doctor: ResidentDoctor) => {
  ElMessage.info(`已选择 ${doctor.name}，在线问诊功能待接入`)
}

onMounted(async () => {
  if (!departments.value.length) {
    await loadDepartments()
  }
  await queryDoctorList()
})
</script>

<style scoped>
.resident-doctor-page {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 640px;
  min-width: 0;
}

.filter-panel {
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d9e3ef;
  padding: 14px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-weight: 700;
  color: #1f2a44;
}

.filter-icon {
  color: #1776e8;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.full-width {
  width: 100%;
}

.filter-actions {
  padding-top: 4px;
  display: flex;
  gap: 10px;
}

.filter-actions .el-button {
  flex: 1;
}

.doctor-panel {
  border-radius: 10px;
  border: 1px solid #d9e3ef;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.doctor-list {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  align-content: start;
}

.doctor-card {
  border: 1px solid #dce8f6;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doctor-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.doctor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  background: #f2f6fb;
}

.doctor-main h4 {
  margin: 0;
  color: #10213c;
  font-size: 18px;
  line-height: 1.2;
}

.doctor-phone {
  margin: 2px 0;
  color: #3f7fd7;
  font-size: 12px;
}

.doctor-title {
  margin: 0;
  color: #1b9a3e;
  font-weight: 600;
  font-size: 13px;
}

.doctor-meta {
  display: grid;
  gap: 5px;
  font-size: 13px;
  color: #2a3f63;
}

.doctor-meta p {
  margin: 0;
  display: flex;
  gap: 6px;
}

.meta-label {
  color: #6d7f9d;
  min-width: 32px;
}

.doctor-intro {
  margin: 0;
  font-size: 13px;
  color: #31486e;
  line-height: 1.4;
  min-height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.doctor-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.doctor-card-skeleton {
  height: 170px;
  margin: 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f2f6fb 0%, #e9f0f8 50%, #f2f6fb 100%);
}

.panel-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #edf3fa;
}

.total-text {
  color: #516887;
  font-size: 13px;
}

@media (max-width: 980px) {
  .resident-doctor-page {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .doctor-list {
    grid-template-columns: 1fr;
  }

  .panel-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
