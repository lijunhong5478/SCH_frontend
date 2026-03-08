<template>
	<div class="account-management-container">
		<el-card class="query-card">
			<el-form :inline="true" :model="query" class="demo-form-inline">
				<el-form-item label="用户名">
					<el-input v-model="query.username" placeholder="用户名"></el-input>
				</el-form-item>
				<el-form-item label="电话">
					<el-input v-model="query.phone" placeholder="电话"></el-input>
				</el-form-item>
				<el-form-item label="角色">
					<el-select v-model="query.role" placeholder="角色" style="width: 140px">
						<el-option label="全部" :value="undefined"></el-option>
						<el-option label="管理员" :value="0"></el-option>
						<el-option label="医生" :value="1"></el-option>
						<el-option label="社区居民" :value="2"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="状态">
					<el-radio-group v-model="query.isDeleted">
						<el-radio :label="0">未删除</el-radio>
						<el-radio :label="1">已删除</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="onQuery">查询</el-button>
					<el-button @click="onReset">重置</el-button>
					<el-button type="success" @click="openAddDoctorDialog">新增医生</el-button>
				</el-form-item>
			</el-form>
		</el-card>
		<el-card class="table-card">
			<el-table :data="accountList" style="width: 100%" height="100%">
				<el-table-column prop="username" label="用户名" min-width="100"></el-table-column>
				<el-table-column prop="phone" label="电话号码" min-width="130"></el-table-column>
				<el-table-column
					prop="idCard"
					label="身份证号码"
					min-width="180"
					:formatter="idCardFormatter"
				></el-table-column>
				<el-table-column label="图像" min-width="80">
					<template #default="{ row }">
						<el-image
							style="width: 50px; height: 50px"
							:src="getAvatarUrl(row)"
							:preview-src-list="getAvatarUrl(row) ? [getAvatarUrl(row)] : []"
							fit="cover"
						></el-image>
					</template>
				</el-table-column>
				<el-table-column prop="roleType" label="角色" min-width="90" :formatter="roleFormatter"></el-table-column>
				<el-table-column
					prop="createTime"
					label="创建时间"
					min-width="170"
					:formatter="timeFormatter"
				></el-table-column>
				<el-table-column
					prop="updateTime"
					label="更新时间"
					min-width="170"
					:formatter="timeFormatter"
				></el-table-column>
				<el-table-column label="操作" min-width="200">
					<template #default="{ row }">
						<div>
							<el-button type="primary" link @click="resetPassword(row)">重置密码</el-button>
							<template v-if="row.roleType === 1 || row.roleType === 2">
								<el-button :type="row.status === 1 ? 'warning' : 'success'" link @click="toggleStatus(row)">{{
									row.status === 1 ? '禁用' : '启用'
								}}</el-button>
								<el-button :type="row.isDeleted === 0 ? 'danger' : 'info'" link @click="toggleDelete(row)">{{
									row.isDeleted === 0 ? '删除' : '恢复'
								}}</el-button>
								<el-button v-if="row.roleType === 1" type="primary" link @click="schedule(row)"
									>排班</el-button
								>
							</template>
						</div>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				:current-page="query.pageNum"
				:page-sizes="[10, 20, 30, 40]"
				:page-size="query.pageSize"
				layout="total, sizes, prev, pager, next, jumper"
				:total="total"
				@size-change="handleSizeChange"
				@current-change="handleCurrentChange"
			>
			</el-pagination>
		</el-card>

		<!-- 新增医生对话框 -->
		<el-dialog
			v-model="addDoctorDialogVisible"
			title="新增医生"
			width="760px"
			@close="closeAddDoctorDialog"
		>
			<el-form
				ref="addDoctorFormRef"
				:model="addDoctorForm"
				:rules="addDoctorRules"
				label-width="100px"
			>
				<el-row :gutter="16">
					<el-col :xs="24" :sm="12">
						<el-form-item label="登录账号" prop="username">
							<el-input v-model="addDoctorForm.username" placeholder="请输入登录账号" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="登录密码" prop="password">
							<el-input
								v-model="addDoctorForm.password"
								type="password"
								show-password
								placeholder="请输入登录密码"
							/>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="姓名" prop="name">
							<el-input v-model="addDoctorForm.name" placeholder="请输入姓名" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="性别" prop="gender">
							<el-select v-model="addDoctorForm.gender" placeholder="请选择性别" style="width: 100%">
								<el-option label="男" :value="1" />
								<el-option label="女" :value="0" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="年龄" prop="age">
							<el-input-number v-model="addDoctorForm.age" :min="18" :max="100" style="width: 100%" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="手机号" prop="phone">
							<el-input v-model="addDoctorForm.phone" placeholder="请输入手机号" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="身份证号" prop="idCard">
							<el-input v-model="addDoctorForm.idCard" placeholder="请输入身份证号" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="所属科室" prop="departmentId">
							<el-select
								v-model="addDoctorForm.departmentId"
								placeholder="请选择科室"
								style="width: 100%"
								:loading="departmentLoading"
							>
								<el-option
									v-for="dept in departments"
									:key="dept.id"
									:label="dept.name"
									:value="dept.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12">
						<el-form-item label="医生职称" prop="title">
							<el-select v-model="addDoctorForm.title" placeholder="请选择职称" style="width: 100%">
								<el-option
									v-for="item in doctorTitleOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="擅长领域" prop="specialty">
							<el-input v-model="addDoctorForm.specialty" placeholder="请输入擅长领域" />
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="医生简介" prop="introduction">
							<el-input
								v-model="addDoctorForm.introduction"
								type="textarea"
								:rows="3"
								placeholder="请输入医生简介"
							/>
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="医生头像" prop="avatarUrl">
							<div
								class="doctor-avatar-upload-box"
								:class="{ uploading: addDoctorAvatarUploading }"
								@click="triggerAddDoctorAvatarUpload"
							>
								<el-image
									v-if="addDoctorForm.avatarUrl"
									:src="addDoctorForm.avatarUrl"
									fit="cover"
									:preview-src-list="[addDoctorForm.avatarUrl]"
									@click.stop
								/>
								<template v-else>
									<el-icon v-if="!addDoctorAvatarUploading" class="avatar-upload-icon"><Plus /></el-icon>
									<el-icon v-else class="avatar-upload-icon is-loading"><Loading /></el-icon>
								</template>
							</div>
							<input
								ref="addDoctorAvatarInputRef"
								type="file"
								accept="image/*"
								class="hidden-file-input"
								@change="handleAddDoctorAvatarSelected"
							/>
						</el-form-item>
					</el-col>
					<el-col :xs="24">
						<el-form-item label="初始排班" required>
							<div class="doctor-schedule-editor">
								<div
									v-for="(item, index) in addDoctorForm.doctorSchedules"
									:key="`schedule-${index}`"
									class="doctor-schedule-item"
								>
									<el-select v-model="item.weekDay" placeholder="选择星期" style="width: 110px">
										<el-option
											v-for="day in weekDayOptions"
											:key="day.value"
											:label="day.label"
											:value="day.value"
										/>
									</el-select>
									<el-select v-model="item.timeSlot" placeholder="时段" style="width: 100px">
										<el-option
											v-for="slot in timeSlotOptions"
											:key="slot.value"
											:label="slot.label"
											:value="slot.value"
										/>
									</el-select>
									<span class="schedule-label">最大预约量</span>
									<el-input-number v-model="item.maxNumber" :min="1" :max="50" style="width: 120px" />
									<el-button
										type="danger"
										:icon="Delete"
										circle
										plain
										:disabled="addDoctorForm.doctorSchedules.length === 1"
										@click="removeDoctorScheduleItem(index)"
									/>
								</div>
								<el-button type="primary" plain :icon="Plus" @click="addDoctorScheduleItem">新增排班</el-button>
							</div>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<el-button @click="closeAddDoctorDialog">取消</el-button>
				<el-button type="primary" :loading="addDoctorLoading" @click="submitAddDoctor">保存</el-button>
			</template>
		</el-dialog>
		
		<!-- 排班管理对话框 -->
		<el-dialog
			v-model="scheduleDialogVisible"
			:title="`${currentDoctor?.username} - 排班管理`"
			width="800px"
			@close="closeScheduleDialog"
		>
			<div v-loading="scheduleLoading" class="schedule-container">
				<el-table :data="scheduleList" style="width: 100%">
					<el-table-column prop="weekDay" label="星期" width="80">
						<template #default="{ row }">
							{{ doctorScheduleStore.getWeekDayName(row.weekDay) }}
						</template>
					</el-table-column>
					<el-table-column prop="timeSlot" label="时间段" width="100">
						<template #default="{ row }">
							{{ doctorScheduleStore.getTimeSlotName(row.timeSlot) }}
						</template>
					</el-table-column>
					<el-table-column prop="maxNumber" label="最大叫号数" width="120"></el-table-column>
					<el-table-column prop="currentNumber" label="当前叫号数" width="120"></el-table-column>
					<el-table-column prop="status" label="状态" width="80">
						<template #default="{ row }">
							<el-tag :type="row.status === 1 ? 'success' : 'danger'">
								{{ doctorScheduleStore.getStatusName(row.status) }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="createTime" label="创建时间" width="120">
						<template #default="{ row }">
							{{ dayjs(row.createTime).format('MM-DD HH:mm') }}
						</template>
					</el-table-column>
					<el-table-column label="操作" width="100">
						<template #default="{ row }">
							<el-button type="primary" size="small" @click="editScheduleItem(row)">
								编辑
							</el-button>
						</template>
					</el-table-column>
				</el-table>
			</div>
			<template #footer>
				<el-button @click="closeScheduleDialog">关闭</el-button>
			</template>
		</el-dialog>

		<!-- 编辑排班项对话框 -->
		<el-dialog
			v-model="editDialogVisible"
			title="编辑排班"
			width="400px"
			@close="closeEditDialog"
		>
			<el-form :model="editForm" label-width="100px">
				<el-form-item label="时间">
					<span v-if="editingSchedule">
						{{ doctorScheduleStore.getWeekDayName(editingSchedule.weekDay) }} 
						{{ doctorScheduleStore.getTimeSlotName(editingSchedule.timeSlot) }}
					</span>
				</el-form-item>
				<el-form-item label="最大叫号数" required>
					<el-input-number
						v-model="editForm.maxNumber"
						:min="1"
						:max="50"
						style="width: 100%"
					></el-input-number>
				</el-form-item>
				<el-form-item label="状态" required>
					<el-radio-group v-model="editForm.status">
						<el-radio :label="1">正常</el-radio>
						<el-radio :label="0">停诊</el-radio>
					</el-radio-group>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="closeEditDialog">取消</el-button>
				<el-button type="primary" @click="saveScheduleEdit">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Loading } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { adminApi } from '@/api/admin.api'
import { useAccountStore } from '@/stores/account.store'
import { useDoctorScheduleStore } from '@/stores/doctor-schedule.store'
import { storeToRefs } from 'pinia'
import type { Account, AccountQuery, AddDoctorDTO, DoctorTitle } from '@/types/account.types'
import type { DoctorSchedule } from '@/types/api.types'
import dayjs from 'dayjs'

const accountStore = useAccountStore()
const doctorScheduleStore = useDoctorScheduleStore()
const { accountList, total, departments } = storeToRefs(accountStore)
const { scheduleList, loading: scheduleLoading } = storeToRefs(doctorScheduleStore)

const doctorTitleOptions: Array<{ label: string; value: DoctorTitle }> = [
	{ label: '住院医师', value: 1 },
	{ label: '主治医师', value: 2 },
	{ label: '副主任医师', value: 3 },
	{ label: '主任医师', value: 4 },
]

const weekDayOptions = [
	{ label: '周一', value: 1 },
	{ label: '周二', value: 2 },
	{ label: '周三', value: 3 },
	{ label: '周四', value: 4 },
	{ label: '周五', value: 5 },
	{ label: '周六', value: 6 },
	{ label: '周日', value: 7 },
]

const timeSlotOptions: Array<{ label: string; value: 'AM' | 'PM' }> = [
	{ label: '上午', value: 'AM' },
	{ label: '下午', value: 'PM' },
]

const createDefaultDoctorSchedule = () => ({
	maxNumber: 10,
	timeSlot: 'AM' as '' | 'AM' | 'PM',
	weekDay: 1,
})

const createDefaultAddDoctorForm = (): AddDoctorDTO => ({
	age: 18,
	avatarUrl: '',
	departmentId: 0,
	doctorSchedules: [createDefaultDoctorSchedule()],
	gender: 1,
	idCard: '',
	introduction: '',
	name: '',
	password: '',
	phone: '',
	specialty: '',
	title: 1,
	username: '',
})

const addDoctorDialogVisible = ref(false)
const addDoctorLoading = ref(false)
const departmentLoading = ref(false)
const addDoctorAvatarUploading = ref(false)
const addDoctorAvatarInputRef = ref<HTMLInputElement | null>(null)
const addDoctorFormRef = ref<FormInstance>()
const addDoctorForm = ref<AddDoctorDTO>(createDefaultAddDoctorForm())
const addDoctorRules: FormRules<AddDoctorDTO> = {
	username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
	password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
	name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
	gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
	age: [{ required: true, message: '请输入年龄', trigger: 'change' }],
	phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
	idCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
	departmentId: [{ required: true, message: '请选择科室', trigger: 'change' }],
	title: [{ required: true, message: '请选择医生职称', trigger: 'change' }],
	specialty: [{ required: true, message: '请输入擅长领域', trigger: 'blur' }],
	introduction: [{ required: true, message: '请输入医生简介', trigger: 'blur' }],
	avatarUrl: [{ required: true, message: '请上传医生头像', trigger: 'change' }],
}

// 排班对话框相关状态
const scheduleDialogVisible = ref(false)
const currentDoctor = ref<Account | null>(null)
const editingSchedule = ref<DoctorSchedule | null>(null)
const editDialogVisible = ref(false)
const editForm = ref({
  maxNumber: 0,
  status: 1
})

const query = ref<AccountQuery>({
  pageNum: 1,
  pageSize: 10,
  isDeleted: 0,
  username: '',
  phone: '',
  role: undefined
})

const onQuery = () => {
	const queryParams: AccountQuery = {
    ...query.value,
		username: query.value.username?.trim() || null,
		phone: query.value.phone?.trim() || null
  }
  accountStore.queryAccount(queryParams)
}

const onReset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    isDeleted: 0,
    username: '',
    phone: '',
    role: undefined
  }
  onQuery()
}

const idCardFormatter = (row: Account) => {
  return row.idCard.replace(/^(.{3}).+(.{4})$/, '$1***********$2')
}

const getAvatarUrl = (row: Account) => {
	return row.avatarUrl || row.avatar || ''
}

const roleFormatter = (row: Account) => {
  switch (row.roleType) {
    case 0:
      return '管理员'
    case 1:
      return '医生'
    case 2:
      return '社区居民'
    default:
      return ''
  }
}

const timeFormatter = (_row: Account, _column: unknown, cellValue: string) => {
  return dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss')
}

const loadDepartments = async () => {
	departmentLoading.value = true
	try {
		await accountStore.getAllDepartments()
	} catch (error) {
		console.error('获取科室列表失败:', error)
		ElMessage.error('获取科室列表失败')
	} finally {
		departmentLoading.value = false
	}
}

const resetAddDoctorForm = () => {
	addDoctorForm.value = createDefaultAddDoctorForm()
}

const openAddDoctorDialog = async () => {
	resetAddDoctorForm()
	addDoctorDialogVisible.value = true
	if (!departments.value.length) {
		await loadDepartments()
	}
	// 默认选择内科
	const neike = departments.value.find((d) => d.name === '内科')
	if (neike) {
		addDoctorForm.value.departmentId = neike.id
	}
}

const closeAddDoctorDialog = () => {
	addDoctorDialogVisible.value = false
	addDoctorFormRef.value?.clearValidate()
}

const triggerAddDoctorAvatarUpload = () => {
	addDoctorAvatarInputRef.value?.click()
}

const handleAddDoctorAvatarSelected = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const selectedFile = input.files?.[0]
	input.value = ''

	if (!selectedFile) {
		return
	}

	addDoctorAvatarUploading.value = true
	try {
		const response = await adminApi.uploadFile(selectedFile)
		if (typeof response.data !== 'string' || !response.data.trim()) {
			ElMessage.error(response.message || '头像上传失败')
			return
		}

		addDoctorForm.value.avatarUrl = response.data.trim()
		ElMessage.success('头像上传成功')
		addDoctorFormRef.value?.validateField('avatarUrl')
	} catch (error) {
		console.error('新增医生头像上传失败:', error)
		ElMessage.error('头像上传失败')
	} finally {
		addDoctorAvatarUploading.value = false
	}
}

const addDoctorScheduleItem = () => {
	addDoctorForm.value.doctorSchedules.push(createDefaultDoctorSchedule())
}

const removeDoctorScheduleItem = (index: number) => {
	if (addDoctorForm.value.doctorSchedules.length === 1) {
		return
	}
	addDoctorForm.value.doctorSchedules.splice(index, 1)
}

const validateDoctorSchedules = () => {
	const schedules = addDoctorForm.value.doctorSchedules

	if (!schedules.length) {
		ElMessage.warning('请至少配置一条初始排班')
		return false
	}

	for (const [i, item] of schedules.entries()) {
		if (!item.weekDay || item.weekDay < 1 || item.weekDay > 7) {
			ElMessage.warning(`第 ${i + 1} 条排班请选择周几（周一到周日）`)
			return false
		}
		if (item.timeSlot !== 'AM' && item.timeSlot !== 'PM') {
			ElMessage.warning(`第 ${i + 1} 条排班请选择时间段（上午/下午）`)
			return false
		}
		if (!Number.isFinite(item.maxNumber) || item.maxNumber <= 0) {
			ElMessage.warning(`第 ${i + 1} 条排班请填写最大预约数（大于 0）`)
			return false
		}
	}

	return true
}

const submitAddDoctor = async () => {
	if (!addDoctorFormRef.value) {
		return
	}

	await addDoctorFormRef.value.validate()
	if (!validateDoctorSchedules()) {
		return
	}

	addDoctorLoading.value = true
	try {
		await accountStore.addDoctor({
			...addDoctorForm.value,
			doctorSchedules: addDoctorForm.value.doctorSchedules.map((item) => ({
				maxNumber: Number(item.maxNumber),
				timeSlot: item.timeSlot,
				weekDay: Number(item.weekDay),
			})),
		})

		ElMessage.success('新增医生成功')
		closeAddDoctorDialog()
		onQuery()
	} catch (error) {
		console.error('新增医生失败:', error)
		ElMessage.error('新增医生失败')
	} finally {
		addDoctorLoading.value = false
	}
}

const resetPassword = async (row: Account) => {
  try {
    await accountStore.resetPassword(row.id)
    ElMessage.success('密码重置成功')
	} catch {
    ElMessage.error('密码重置失败')
  }
}

const toggleStatus = async (row: Account) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    console.log('前端发送请求:', { id: row.id, status: newStatus })
    await accountStore.toggleStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(newStatus === 1 ? '启用成功' : '禁用成功')
  } catch (error) {
    console.error('启用禁用失败:', error)
    ElMessage.error('操作失败')
  }
}

const toggleDelete = async (row: Account) => {
  try {
    const newIsDeleted = row.isDeleted === 0 ? 1 : 0
    console.log('前端发送请求:', { id: row.id, isDeleted: row.isDeleted, newIsDeleted })
    await accountStore.toggleDelete(row.id, row.isDeleted)
    row.isDeleted = newIsDeleted
    ElMessage.success(newIsDeleted === 1 ? '删除成功' : '恢复成功')
  } catch (error) {
    console.error('删除/恢复失败:', error)
    ElMessage.error('操作失败')
  }
}

const schedule = async (row: Account) => {
  currentDoctor.value = row
  scheduleDialogVisible.value = true
  
  try {
    await doctorScheduleStore.getDoctorSchedule(row.id)
  } catch (error) {
    console.error('获取排班信息失败:', error)
    ElMessage.error('获取排班信息失败')
  }
}

// 编辑排班项
const editScheduleItem = (schedule: DoctorSchedule) => {
  editingSchedule.value = schedule
  editForm.value = {
    maxNumber: schedule.maxNumber,
    status: schedule.status
  }
  editDialogVisible.value = true
}

// 保存编辑的排班
const saveScheduleEdit = async () => {
  if (!editingSchedule.value || !currentDoctor.value) return
  
  try {
    // 更新本地状态
    doctorScheduleStore.updateSingleSchedule(editingSchedule.value.id, {
      maxNumber: editForm.value.maxNumber,
      status: editForm.value.status
    })
    
    // 准备更新数据
    const updateData = {
      doctorId: currentDoctor.value.id,
      doctorSchedules: [{
        id: editingSchedule.value.id,
        doctorId: currentDoctor.value.id,
        maxNumber: editForm.value.maxNumber,
        status: editForm.value.status
      }]
    }
    
    await doctorScheduleStore.updateDoctorSchedule(updateData)
    
    ElMessage.success('排班更新成功')
    editDialogVisible.value = false
    editingSchedule.value = null
  } catch (error) {
    console.error('排班更新失败:', error)
    ElMessage.error('排班更新失败')
  }
}

// 关闭排班对话框
const closeScheduleDialog = () => {
  scheduleDialogVisible.value = false
  currentDoctor.value = null
  doctorScheduleStore.reset()
}

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  editingSchedule.value = null
}

const handleSizeChange = (val: number) => {
  query.value.pageSize = val
  onQuery()
}

const handleCurrentChange = (val: number) => {
  query.value.pageNum = val
  onQuery()
}

onMounted(() => {
  onQuery()
	loadDepartments()
})
</script>

<style scoped>
.account-management-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}

.query-card {
	flex-shrink: 0;
}

.table-card {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	margin-top: 16px;
}

.table-card :deep(.el-card__body) {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
}

.table-card :deep(.el-pagination) {
	margin-top: 12px;
	justify-content: flex-end;
}

.schedule-container {
	min-height: 300px;
}

.schedule-container .el-table {
	border: 1px solid #ebeef5;
	border-radius: 4px;
}

.schedule-container .el-tag {
	font-size: 12px;
}

.doctor-avatar-upload-box {
	width: 100px;
	height: 100px;
	border: 1px dashed #d1d5db;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	overflow: hidden;
	transition: all 0.2s;
	background: #fafafa;
}

.doctor-avatar-upload-box:hover {
	border-color: #409eff;
	background: #f0f7ff;
}

.doctor-avatar-upload-box.uploading {
	cursor: wait;
	pointer-events: none;
	background: #f5f5f5;
}

.doctor-avatar-upload-box :deep(.el-image) {
	width: 100%;
	height: 100%;
}

.avatar-upload-icon {
	font-size: 28px;
	color: #c0c4cc;
}

.avatar-upload-icon.is-loading {
	animation: rotating 2s linear infinite;
}

@keyframes rotating {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.hidden-file-input {
	display: none;
}

.doctor-schedule-editor {
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
}

.doctor-schedule-item {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.schedule-label {
	font-size: 13px;
	color: #606266;
	margin-left: 4px;
}
</style>
