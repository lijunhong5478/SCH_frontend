<template>
	<div class="operation-log-container">
		<!-- 页面头部 -->
		<div class="page-header">
			<h2 class="page-title">操作日志</h2>
		</div>

		<!-- 搜索筛选区 -->
		<div class="filter-section">
			<div class="filter-row">
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

				<el-button type="primary" @click="handleSearch">
					<el-icon><Search /></el-icon>
					查询
				</el-button>
				<el-button class="reset-btn" @click="handleReset">重置</el-button>
			</div>
		</div>

		<!-- 表格区域 -->
		<div class="table-section">
			<el-table
				v-loading="store.loading"
				:data="store.logList"
				stripe
				border
				style="width: 100%"
				max-height="calc(100vh - 340px)"
			>
				<el-table-column prop="userId" label="用户ID" width="100" align="center" />
				<el-table-column prop="userName" label="用户名" width="130" align="center">
					<template #default="{ row }">
						{{ row.userName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="roleType" label="角色类型" width="120" align="center">
					<template #default="{ row }">
						<el-tag :type="getRoleTagType(row.roleType)" size="default">
							{{ getRoleLabel(row.roleType) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="moduleName" label="操作模块" width="160" align="center">
					<template #default="{ row }">
						{{ row.moduleName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="methodName" label="调用方法" min-width="280" align="center" show-overflow-tooltip>
					<template #default="{ row }">
						<span class="method-name">{{ row.methodName || '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="createTime" label="操作时间" width="200" align="center">
					<template #default="{ row }">
						{{ formatDateTime(row.createTime) }}
					</template>
				</el-table-column>
				<el-table-column label="操作" width="100" align="center" fixed="right">
					<template #default="{ row }">
						<el-button
							type="danger"
							text
							size="small"
							:loading="store.deleteLoading"
							@click="confirmDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 分页 -->
		<div v-if="!store.isEmpty && !store.loading" class="pagination-container">
			<span class="total-info">共 {{ store.total }} 条记录</span>
			<el-pagination
				v-model:current-page="currentPage"
				v-model:page-size="pageSize"
				:page-sizes="[15, 30, 50, 100]"
				:total="store.total"
				layout="sizes, prev, pager, next, jumper"
				@current-change="handlePageChange"
				@size-change="handleSizeChange"
			/>
		</div>

		<!-- 空状态 -->
		<div v-if="store.isEmpty && !store.loading" class="empty-container">
			<el-icon class="empty-icon"><Document /></el-icon>
			<p>暂无操作日志记录</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { useOperationLogStore } from '@/stores/operation-log.store'
import type { OperationLog } from '@/types/operation-log.types'
import { getRoleTypeLabel, getRoleTypeTagType } from '@/types/operation-log.types'

const store = useOperationLogStore()

// 搜索条件
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(15)

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
	if (!dateStr) return '-'
	const date = new Date(dateStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 获取角色标签
const getRoleLabel = (roleType: number): string => {
	return getRoleTypeLabel(roleType)
}

// 获取角色标签类型
const getRoleTagType = (roleType: number): string => {
	return getRoleTypeTagType(roleType)
}

// 搜索
const handleSearch = () => {
	currentPage.value = 1
	store.updateQuery({
		startDate: startDate.value || undefined,
		endDate: endDate.value || undefined,
	})
}

// 重置
const handleReset = () => {
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

// 确认删除
const confirmDelete = (item: OperationLog) => {
	ElMessageBox.confirm(`确定要删除该条操作日志吗？`, '删除确认', {
		confirmButtonText: '确定删除',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(async () => {
		const result = await store.deleteLog(item.id)
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
	store.fetchLogs()
})
</script>

<style scoped>
.operation-log-container {
	padding: 0;
	background-color: #fafafa;
	min-height: 100%;
	display: flex;
	flex-direction: column;
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

/* 筛选区 */
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

.date-picker :deep(.el-date-editor) {
	width: 180px;
}

.reset-btn {
	background: #f0f2f5;
	border: none;
	color: #333;
	font-weight: 500;
}

.reset-btn:hover {
	background: #e4e7ec;
}

/* 表格区域 */
.table-section {
	background: #fff;
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.table-section :deep(.el-table) {
	border-radius: 8px;
	font-size: 15px;
}

.table-section :deep(.el-table th) {
	background-color: #f5f7fa;
	font-weight: 600;
	color: #333;
	font-size: 15px;
}

.table-section :deep(.el-table td) {
	padding: 14px 0;
}

.table-section :deep(.el-tag) {
	font-size: 14px;
	padding: 6px 12px;
}

.method-name {
	font-family: 'Consolas', 'Monaco', monospace;
	color: #606266;
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
	margin-top: 20px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.total-info {
	font-size: 13px;
	color: #666;
}

/* 空状态 */
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	color: #999;
	gap: 12px;
	background: #fff;
	border-radius: 12px;
	margin-top: 20px;
}

.empty-icon {
	font-size: 48px;
	color: #ddd;
}
</style>
