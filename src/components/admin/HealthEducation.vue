<template>
	<div class="health-education-container">
		<!-- 页面头部 -->
		<div class="page-header">
			<h2 class="page-title">健康宣教</h2>
			<el-button v-if="canPublish" type="primary" class="publish-btn" @click="openPublishDialog">
				<el-icon><Plus /></el-icon>
				发布新宣教
			</el-button>
		</div>

		<!-- 搜索筛选区 -->
		<div class="filter-section">
			<div class="filter-row">
				<div class="filter-item search-input">
					<span class="filter-label">宣教标题搜索</span>
					<el-input
						v-model="searchTitle"
						placeholder="请输入宣教标题搜索"
						clearable
						@keyup.enter="handleSearch"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</div>

				<div class="filter-item">
					<span class="filter-label">宣教类型</span>
					<el-select v-model="searchType" placeholder="全部类型" clearable @change="handleSearch">
						<el-option label="全部类型" :value="undefined" />
						<el-option label="政策解读" :value="0" />
						<el-option label="科普宣教" :value="1" />
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

				<el-button class="reset-btn" @click="handleReset">重置</el-button>
			</div>
		</div>

		<!-- 内容区 loading -->
		<div v-if="store.loading" class="loading-container">
			<el-icon class="loading-icon"><Loading /></el-icon>
			<span>加载中...</span>
		</div>

		<!-- 空状态 -->
		<div v-else-if="store.isEmpty" class="empty-container">
			<el-icon class="empty-icon"><Document /></el-icon>
			<p>暂无健康宣教内容</p>
		</div>

		<!-- 卡片列表 -->
		<div v-else class="card-grid">
			<div
				v-for="item in store.healthTipList"
				:key="item.id"
				class="health-card"
				@click="openDetail(item)"
			>
				<div class="card-image">
					<img
						:src="item.backgroundImage || defaultImage"
						:alt="item.title"
						@error="handleImageError"
					/>
					<span class="type-tag" :class="getTypeClass(item.type)">
						{{ getTypeLabel(item.type) }}
					</span>
					<!-- 删除按钮（仅管理员可见） -->
					<el-button
						v-if="canDelete"
						class="delete-btn"
						type="danger"
						circle
						size="small"
						@click.stop="confirmDelete(item)"
					>
						<el-icon><Delete /></el-icon>
					</el-button>
				</div>
				<div class="card-content">
					<h3 class="card-title">{{ item.title }}</h3>
					<p class="card-desc">{{ truncateContent(item.content, 60) }}</p>
					<div class="card-footer">
						<span class="author">
							<el-icon><User /></el-icon>
							{{ item.publisherName }}
						</span>
						<span class="date">{{ formatDate(item.publishTime) }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 分页 -->
		<div v-if="!store.isEmpty && !store.loading" class="pagination-container">
			<span class="total-info">共 {{ store.total }} 条记录，显示第 {{ displayRange }} 条</span>
			<el-pagination
				v-model:current-page="currentPage"
				v-model:page-size="pageSize"
				:page-sizes="[15, 30, 45, 60]"
				:total="store.total"
				layout="prev, pager, next"
				@current-change="handlePageChange"
				@size-change="handleSizeChange"
			/>
		</div>

		<!-- 详情弹窗 -->
		<el-dialog
			v-model="detailVisible"
			:title="currentDetail?.title"
			width="700px"
			class="detail-dialog"
			destroy-on-close
		>
			<div v-if="store.detailLoading" class="detail-loading">
				<el-icon class="loading-icon"><Loading /></el-icon>
				<span>加载中...</span>
			</div>
			<div v-else-if="currentDetail" class="detail-content">
				<div class="detail-meta">
					<span class="type-tag" :class="getTypeClass(currentDetail.type)">
						{{ getTypeLabel(currentDetail.type) }}
					</span>
					<span class="meta-item">
						<el-icon><User /></el-icon>
						{{ currentDetail.publisherName }}
					</span>
					<span class="meta-item">
						<el-icon><Calendar /></el-icon>
						{{ formatDateTime(currentDetail.publishTime) }}
					</span>
				</div>
				<div class="detail-body">
					{{ currentDetail.content }}
				</div>
			</div>
		</el-dialog>

		<!-- 发布弹窗 -->
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
					<el-select v-model="publishForm.type" placeholder="请选择宣教类型" style="width: 100%">
						<el-option label="政策解读" :value="0" />
						<el-option label="科普宣教" :value="1" />
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
				<el-button type="primary" :loading="store.publishLoading" @click="handlePublish">
					发布
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Loading, Document, User, Calendar, Delete, Close } from '@element-plus/icons-vue'
import { useHealthEducationStore } from '@/stores/health-education.store'
import { useAuthStore } from '@/stores/auth.store'
import { adminApi } from '@/api/admin.api'
import type { HealthTip, HealthTipVO, HealthTipType, PublishHealthTipDTO } from '@/types/health-education.types'
import { HealthTipType as HealthTipTypeConst, getHealthTipTypeLabel, getHealthTipTypeClass } from '@/types/health-education.types'
import { ResponseCode } from '@/types/api.types'

const store = useHealthEducationStore()
const authStore = useAuthStore()

// 权限控制
const canPublish = computed(() => authStore.isAdmin || authStore.isDoctor)
const canDelete = computed(() => authStore.isAdmin)

// 默认图片
const defaultImage = 'https://via.placeholder.com/400x200?text=Health+Education'

// 搜索条件
const searchTitle = ref('')
const searchType = ref<HealthTipType | undefined>(undefined)
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(15)

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = ref<HealthTipVO | null>(null)

// 发布弹窗
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

// 计算属性
const displayRange = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value + 1
	const end = Math.min(currentPage.value * pageSize.value, store.total)
	return `${start}-${end}`
})

// 获取类型标签
const getTypeLabel = (type: HealthTipType): string => {
	return getHealthTipTypeLabel(type)
}

// 获取类型样式类
const getTypeClass = (type: HealthTipType): string => {
	return getHealthTipTypeClass(type)
}

// 截断内容
const truncateContent = (content: string, maxLen: number): string => {
	if (!content) return ''
	return content.length > maxLen ? content.slice(0, maxLen) + '...' : content
}

// 格式化日期
const formatDate = (dateStr: string): string => {
	if (!dateStr) return ''
	const date = new Date(dateStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
	if (!dateStr) return ''
	const date = new Date(dateStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
	const target = e.target as HTMLImageElement
	target.src = defaultImage
}

// 格式化日期为后端datetime格式
const formatDateToStartTime = (dateStr: string | null): string | undefined => {
	if (!dateStr) return undefined
	return `${dateStr} 00:00:00`
}

const formatDateToEndTime = (dateStr: string | null): string | undefined => {
	if (!dateStr) return undefined
	return `${dateStr} 23:59:59`
}

// 搜索
const handleSearch = () => {
	currentPage.value = 1
	store.updateQuery({
		title: searchTitle.value,
		type: searchType.value,
		startTime: formatDateToStartTime(startDate.value),
		endTime: formatDateToEndTime(endDate.value),
	})
}

// 重置
const handleReset = () => {
	searchTitle.value = ''
	searchType.value = undefined
	startDate.value = null
	endDate.value = null
	currentPage.value = 1
	store.resetQuery()
}

// 分页变化
const handlePageChange = (page: number) => {
	currentPage.value = page
	store.changePage(page)
}

const handleSizeChange = (size: number) => {
	pageSize.value = size
	currentPage.value = 1
	store.changePageSize(size)
}

// 打开详情
const openDetail = async (item: HealthTip) => {
	detailVisible.value = true
	const detail = await store.fetchHealthTipById(item.id)
	if (detail) {
		currentDetail.value = detail
	}
}

// 打开发布弹窗
const openPublishDialog = () => {
	publishVisible.value = true
}

// 重置发布表单
const resetPublishForm = () => {
	publishForm.type = HealthTipTypeConst.SCIENCE
	publishForm.title = ''
	publishForm.content = ''
	publishForm.backgroundImage = ''
	publishFormRef.value?.resetFields()
}

// 处理图片上传
const handleImageUpload = async (options: UploadRequestOptions) => {
	try {
		const res = await adminApi.uploadFile(options.file as File)
		if (res.code === ResponseCode.SUCCESS) {
			publishForm.backgroundImage = res.data
			ElMessage.success('图片上传成功')
		} else {
			ElMessage.error(res.message || '图片上传失败')
		}
	} catch (error) {
		console.error('图片上传异常:', error)
		ElMessage.error('图片上传失败，请稍后重试')
	}
}

// 移除图片
const removeImage = () => {
	publishForm.backgroundImage = ''
}

// 发布健康宣教
const handlePublish = async () => {
	if (!publishFormRef.value) return

	try {
		const valid = await publishFormRef.value.validate()
		if (!valid) return

		const result = await store.publishHealthTip({
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
		} else {
			ElMessage.error(result.message)
		}
	} catch (error) {
		console.error('发布健康宣教异常:', error)
	}
}

// 确认删除
const confirmDelete = (item: HealthTip) => {
	ElMessageBox.confirm(`确定要删除健康宣教「${item.title}」吗？`, '删除确认', {
		confirmButtonText: '确定删除',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(async () => {
		const result = await store.deleteHealthTip(item.id)
		if (result.success) {
			ElMessage.success(result.message)
		} else {
			ElMessage.error(result.message)
		}
	}).catch(() => {
		// 取消删除
	})
}

// 初始化
onMounted(() => {
	store.fetchHealthTips()
})
</script>

<style scoped>
.health-education-container {
	padding: 0;
	background-color: #fafafa;
	min-height: 100%;
}

/* 页面头部 */
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
	background: linear-gradient(135deg, #e07a3a 0%, #f5a623 100%);
	border: none;
	font-weight: 500;
	padding: 10px 20px;
	border-radius: 8px;
}

.publish-btn:hover {
	background: linear-gradient(135deg, #c96a2e 0%, #e09520 100%);
}

/* 筛选区 */
.filter-section {
	background: #fff;
	border-radius: 12px;
	padding: 20px 24px;
	margin-bottom: 24px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.filter-row {
	display: flex;
	align-items: flex-end;
	gap: 24px;
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
	flex: 1;
	min-width: 200px;
	max-width: 320px;
}

.search-input :deep(.el-input__wrapper) {
	border-radius: 8px;
}

.filter-item :deep(.el-select) {
	width: 140px;
}

.date-picker :deep(.el-date-editor) {
	width: 160px;
}

.reset-btn {
	background: #f0f2f5;
	border: none;
	color: #333;
	font-weight: 500;
	padding: 8px 24px;
	border-radius: 8px;
}

.reset-btn:hover {
	background: #e4e7ec;
}

/* 加载状态 */
.loading-container,
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	color: #999;
	gap: 12px;
}

.loading-icon {
	font-size: 32px;
	animation: spin 1s linear infinite;
}

.empty-icon {
	font-size: 48px;
	color: #ddd;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

/* 卡片网格 */
.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
}

.health-card {
	background: #fff;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
	cursor: pointer;
	transition: all 0.3s ease;
}

.health-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-image {
	position: relative;
	height: 160px;
	overflow: hidden;
}

.card-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.health-card:hover .card-image img {
	transform: scale(1.05);
}

.type-tag {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 4px 12px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	color: #fff;
}

.type-tag.type-science {
	background: linear-gradient(135deg, #52b4e5 0%, #3b9fd1 100%);
}

.type-tag.type-policy {
	background: linear-gradient(135deg, #f5a623 0%, #e08f1a 100%);
}

.card-content {
	padding: 16px;
}

.card-title {
	font-size: 15px;
	font-weight: 600;
	color: #333;
	margin: 0 0 10px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.card-desc {
	font-size: 13px;
	color: #888;
	line-height: 1.6;
	margin: 0 0 14px;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 12px;
	color: #999;
}

.author {
	display: flex;
	align-items: center;
	gap: 4px;
}

.author .el-icon {
	font-size: 14px;
}

/* 分页区 */
.pagination-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fff;
	border-radius: 12px;
	padding: 16px 24px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.total-info {
	font-size: 13px;
	color: #666;
}

/* 详情弹窗 */
.detail-dialog :deep(.el-dialog__header) {
	border-bottom: 1px solid #f0f0f0;
	padding-bottom: 16px;
}

.detail-dialog :deep(.el-dialog__title) {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.detail-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	color: #999;
	gap: 12px;
}

.detail-content {
	padding: 8px 0;
}

.detail-meta {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 20px;
	flex-wrap: wrap;
}

.detail-meta .type-tag {
	position: static;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 13px;
	color: #666;
}

.meta-item .el-icon {
	font-size: 14px;
	color: #999;
}

.detail-body {
	font-size: 14px;
	line-height: 1.8;
	color: #444;
	white-space: pre-wrap;
}

/* 删除按钮 */
.delete-btn {
	position: absolute;
	top: 12px;
	right: 12px;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.health-card:hover .delete-btn {
	opacity: 1;
}

/* 发布弹窗 */
.publish-dialog :deep(.el-dialog__header) {
	border-bottom: 1px solid #f0f0f0;
	padding-bottom: 16px;
}

.publish-dialog :deep(.el-dialog__title) {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.publish-form {
	padding: 16px 0;
}

.publish-form :deep(.el-form-item__label) {
	font-weight: 500;
	color: #333;
}

.publish-form :deep(.el-textarea__inner) {
	font-family: inherit;
	line-height: 1.6;
}

/* 图片上传区域 */
.image-upload-area {
	width: 100%;
}

.image-uploader {
	width: 200px;
}

.image-uploader :deep(.el-upload) {
	width: 200px;
	height: 120px;
	border: 1px dashed #dcdfe6;
	border-radius: 8px;
	cursor: pointer;
	transition: border-color 0.3s ease;
}

.image-uploader :deep(.el-upload:hover) {
	border-color: #e07a3a;
}

.upload-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: #909399;
	gap: 8px;
}

.upload-icon {
	font-size: 28px;
	color: #c0c4cc;
}

.upload-placeholder span {
	font-size: 13px;
}

.preview-image {
	position: relative;
	width: 200px;
	height: 120px;
	border-radius: 8px;
	overflow: hidden;
}

.preview-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.remove-image-btn {
	position: absolute;
	top: 8px;
	right: 8px;
}
</style>
