<template>
	<div class="admin-dashboard">
		<div class="dashboard-shell">
			<aside class="sidebar">
				<div class="sidebar-brand">
					<div class="brand-icon">
						<el-icon class="material-symbols-outlined"><FirstAidKit /></el-icon>
					</div>
					<div class="brand-text">
						<h1>社区医疗管理</h1>
						<p>Healthcare Service</p>
					</div>
				</div>

				<nav class="menu-list">
					<button
						v-for="item in menuItems"
						:key="item.key"
						class="menu-item"
						:class="{ active: item.key === activeMenu }"
						type="button"
						@click="switchMenu(item.key)"
					>
						<el-icon class="material-symbols-outlined menu-icon">
							<component :is="resolveMenuIcon(item.icon)" />
						</el-icon>
						<span class="menu-label">{{ item.label }}</span>
					</button>
				</nav>

				<button class="sidebar-user sidebar-user-link" type="button" @click="openProfileDialog">
					<div class="avatar">
						<img v-if="userAvatarUrl" :src="userAvatarUrl" alt="用户头像" class="avatar-image" />
						<span v-else>{{ userInitial }}</span>
					</div>
					<div class="user-meta">
						<p class="name">{{ userName }}</p>
						<p class="role">{{ userRoleText }}</p>
					</div>
				</button>
			</aside>

			<div class="main-shell">
				<header class="topbar">
					<div>
						<h2>社区医疗服务系统管理平台</h2>
					</div>
					<div class="topbar-actions">
						<button class="plain-action password-btn" type="button" @click="openPasswordDialog">
							<el-icon class="material-symbols-outlined"><Refresh /></el-icon>
							修改密码
						</button>
						<button class="logout" type="button" @click="handleLogout">退出登录</button>
					</div>
				</header>

				<main class="content">
					<transition name="fade-slide" mode="out-in">
						<section v-if="activeMenu === 'overview'" key="overview" class="overview-section">
							<SystemVisualization />

							<footer class="page-footer">© 2026 社区医疗服务系统管理平台. 保留所有权利。</footer>
						</section>

						<section
							v-else-if="activeMenu === 'account'"
							key="account"
							class="module-section account-management-section"
						>
							<AccountManagement />
						</section>

						<section
							v-else-if="activeMenu === 'education'"
							key="education"
							class="module-section health-education-section"
						>
							<HealthEducation />
						</section>

						<section
							v-else-if="activeMenu === 'logs'"
							key="logs"
							class="module-section operation-log-section"
						>
							<OperationLog />
						</section>

						<section
							v-else-if="activeMenu === 'alert'"
							key="alert"
							class="module-section epidemic-alert-section"
						>
							<EpidemicAlert />
						</section>

						<section
							v-else-if="activeMenu === 'settings'"
							key="settings"
							class="module-section system-config-section"
						>
							<SystemConfig />
						</section>

						<section v-else :key="activeMenu" class="module-section">
							<div class="module-card">
								<div class="module-icon" :class="currentModule.colorClass">
									<el-icon class="material-symbols-outlined module-symbol">
										<component :is="resolveMenuIcon(currentModule.icon)" />
									</el-icon>
								</div>
								<h3>{{ currentModule.label }}</h3>
								<p>{{ currentModule.description }}</p>
								<button type="button" class="primary-action">{{ currentModule.actionLabel }}</button>
							</div>
						</section>
					</transition>
				</main>
			</div>
		</div>

		<div
			v-if="showProfileDialog"
			class="profile-dialog-mask"
			role="dialog"
			aria-modal="true"
			aria-label="管理员信息"
			@click.self="exitProfileDialog"
		>
			<div class="profile-dialog">
				<div class="dialog-header">
					<h3>管理员信息</h3>
					<button type="button" class="icon-close" :disabled="profileSubmitting" @click="exitProfileDialog">
						<el-icon class="material-symbols-outlined"><Close /></el-icon>
					</button>
				</div>

				<div v-if="profileLoading" class="profile-loading">正在加载管理员信息...</div>

				<div v-else class="profile-summary">
					<div class="avatar-editor">
						<button type="button" class="avatar-upload" :disabled="profileSubmitting" @click="triggerAvatarUpload">
							<img
								v-if="profileForm.avatarUrl"
								:src="profileForm.avatarUrl"
								alt="管理员头像"
								class="avatar-upload-image"
							/>
							<span v-else>{{ userInitial }}</span>
						</button>
						<p>点击头像上传新图像</p>
						<input
							ref="avatarInputRef"
							type="file"
							accept="image/*"
							class="hidden-file-input"
							@change="handleAvatarSelected"
						/>
					</div>

					<div class="profile-form-grid single-column">
						<label class="field">
							<span>用户名</span>
							<input v-model="profileForm.username" type="text" :disabled="profileSubmitting" />
						</label>

						<label class="field">
							<span>手机号</span>
							<input v-model="profileForm.phone" type="text" :disabled="profileSubmitting" />
						</label>
					</div>

					<p v-if="profileFeedback" class="feedback" :class="{ success: profileFeedbackSuccess }">
						{{ profileFeedback }}
					</p>

					<div class="dialog-actions">
						<button type="button" class="outline-btn" :disabled="profileSubmitting" @click="exitProfileDialog">
							退出
						</button>
						<button type="button" class="primary-action" :disabled="profileSubmitting" @click="saveProfile">
							{{ profileSubmitting ? '保存中...' : '保存修改' }}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="showPasswordDialog"
			class="password-dialog-mask"
			role="dialog"
			aria-modal="true"
			aria-label="修改密码"
			@click.self="closePasswordDialog"
		>
			<div class="password-dialog">
				<div class="dialog-header">
					<h3>修改密码</h3>
					<button
						type="button"
						class="icon-close"
						:disabled="passwordSubmitting"
						@click="closePasswordDialog"
					>
						<el-icon class="material-symbols-outlined"><Close /></el-icon>
					</button>
				</div>

				<form class="password-form" @submit.prevent="submitPasswordChange">
					<label class="field">
						<span>旧密码</span>
						<input
							v-model="passwordForm.oldPassword"
							type="password"
							autocomplete="current-password"
							placeholder="请输入旧密码"
						/>
					</label>

					<label class="field">
						<span>新密码</span>
						<input
							v-model="passwordForm.newPassword"
							type="password"
							autocomplete="new-password"
							placeholder="请输入新密码（至少6位）"
						/>
					</label>

					<label class="field">
						<span>确认新密码</span>
						<input
							v-model="passwordForm.confirmPassword"
							type="password"
							autocomplete="new-password"
							placeholder="请再次输入新密码"
						/>
					</label>

					<p v-if="passwordFeedback" class="feedback" :class="{ success: passwordFeedbackSuccess }">
						{{ passwordFeedback }}
					</p>

					<div class="dialog-actions">
						<button type="button" class="outline-btn" :disabled="passwordSubmitting" @click="closePasswordDialog">
							取消
						</button>
						<button type="submit" class="primary-action" :disabled="passwordSubmitting">
							{{ passwordSubmitting ? '提交中...' : '确认修改' }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
	Close,
	DataAnalysis,
	Document,
	FirstAidKit,
	Management,
	Menu,
	Reading,
	Refresh,
	Setting,
	WarningFilled,
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';
import { adminApi } from '@/api/admin.api';
import { ResponseCode } from '@/types/api.types';
import SystemVisualization from '@/components/admin/SystemVisualization.vue';
import AccountManagement from '@/components/admin/AccountManagement.vue';
import HealthEducation from '@/components/admin/HealthEducation.vue';
import OperationLog from '@/components/admin/OperationLog.vue';
import EpidemicAlert from '@/components/admin/EpidemicAlert.vue';
import SystemConfig from '@/components/admin/SystemConfig.vue';

type AdminMenuKey =
	| 'overview'
	| 'account'
	| 'education'
	| 'logs'
	| 'alert'
	| 'settings';

interface MenuItem {
	key: AdminMenuKey;
	label: string;
	icon: string;
	description: string;
	actionLabel: string;
	colorClass: string;
}

const menuItems: MenuItem[] = [
	{
		key: 'overview',
		label: '系统数据',
		icon: 'bar_chart',
		description: '查看平台核心数据、服务趋势及运营状态。',
		actionLabel: '刷新概览',
		colorClass: 'blue',
	},
	{
		key: 'account',
		label: '账户管理',
		icon: 'manage_accounts',
		description: '管理员、医生、居民账户的创建与权限配置。',
		actionLabel: '进入账户管理',
		colorClass: 'cyan',
	},
	{
		key: 'education',
		label: '健康宣教',
		icon: 'reading',
		description: '发布社区健康资讯、宣教文章和科普活动。',
		actionLabel: '发布宣教内容',
		colorClass: 'green',
	},
	{
		key: 'logs',
		label: '操作日志',
		icon: 'assignment',
		description: '查看关键操作审计日志与系统行为追踪记录。',
		actionLabel: '查看日志记录',
		colorClass: 'orange',
	},
	{
		key: 'alert',
		label: '疫情预警',
		icon: 'warning',
		description: '监控辖区异常病例，统一管理预警阈值和通知。',
		actionLabel: '查看预警中心',
		colorClass: 'red',
	},
	{
		key: 'settings',
		label: '系统配置',
		icon: 'settings',
		description: '统一维护平台参数、字典配置和接口开关。',
		actionLabel: '打开系统配置',
		colorClass: 'slate',
	},
];

const menuIconMap: Record<string, Component> = {
	bar_chart: DataAnalysis,
	manage_accounts: Management,
	reading: Reading,
	assignment: Document,
	warning: WarningFilled,
	settings: Setting,
};

function resolveMenuIcon(iconName: string): Component {
	return menuIconMap[iconName] || Menu;
}

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const validMenuKeys = menuItems.map((item) => item.key);

const activeMenu = computed<AdminMenuKey>(() => {
	const tab = route.query.tab;
	if (typeof tab === 'string' && validMenuKeys.includes(tab as AdminMenuKey)) {
		return tab as AdminMenuKey;
	}
	return 'overview';
});

const currentModule = computed<MenuItem>(() => {
	return menuItems.find((item) => item.key === activeMenu.value) ?? menuItems[0]!;
});

const userName = computed(() => authStore.user?.username || '管理员');
const userAvatarUrl = computed(() => authStore.user?.avatarUrl || '');

const userInitial = computed(() => {
	const firstChar = userName.value.trim().charAt(0);
	return firstChar || '管';
});

const userRoleText = computed(() => '系统管理员');
const showPasswordDialog = ref(false);
const passwordSubmitting = ref(false);
const passwordFeedback = ref('');
const passwordFeedbackSuccess = ref(false);
const passwordForm = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: '',
});
const showProfileDialog = ref(false);
const profileLoading = ref(false);
const profileSubmitting = ref(false);
const profileFeedback = ref('');
const profileFeedbackSuccess = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const profileForm = reactive({
	id: 0,
	username: '',
	phone: '',
	avatarUrl: '',
});
const originalProfile = ref({
	id: 0,
	username: '',
	phone: '',
	avatarUrl: '',
});

function switchMenu(key: AdminMenuKey) {
	router.replace({
		path: route.path,
		query: {
			...route.query,
			tab: key,
		},
	});
}

async function openProfileDialog() {
	resetProfileFeedback();
	showProfileDialog.value = true;
	await loadProfileById();
}

function closeProfileDialog() {
	showProfileDialog.value = false;
}

function applyProfile(profile: { id: number; username: string; phone: string; avatarUrl: string }) {
	profileForm.id = profile.id;
	profileForm.username = profile.username;
	profileForm.phone = profile.phone;
	profileForm.avatarUrl = profile.avatarUrl;
}

function resetProfileFeedback() {
	profileFeedback.value = '';
	profileFeedbackSuccess.value = false;
}

async function loadProfileById() {
	resetProfileFeedback();
	const currentUserId = authStore.user?.id;

	if (!currentUserId) {
		profileFeedback.value = '无法识别当前管理员ID，请重新登录后重试';
		return;
	}

	profileLoading.value = true;
	try {
		const response = await adminApi.getProfileById(currentUserId);
		if (response.code !== ResponseCode.SUCCESS || !response.data) {
			profileFeedback.value = response.message || '加载管理员信息失败';
			return;
		}

		const data = response.data;
		const normalizedProfile = {
			id: Number(data.id || currentUserId),
			username: data.username || '',
			phone: data.phone || '',
			avatarUrl: data.avatarUrl || '',
		};

		applyProfile(normalizedProfile);
		originalProfile.value = { ...normalizedProfile };
	} catch {
		profileFeedback.value = '获取管理员信息失败，请稍后重试';
	} finally {
		profileLoading.value = false;
	}
}

function triggerAvatarUpload() {
	avatarInputRef.value?.click();
}

async function handleAvatarSelected(event: Event) {
	const target = event.target as HTMLInputElement;
	const selectedFile = target.files?.[0];
	target.value = '';

	if (!selectedFile) {
		return;
	}

	resetProfileFeedback();
	profileSubmitting.value = true;
	try {
		const response = await adminApi.uploadFile(selectedFile);
		const hasUploadedUrl = typeof response.data === 'string' && response.data.trim().length > 0;
		const numericCode = Number(response.code);
		const isSuccessCode = Number.isFinite(numericCode)
			? numericCode === Number(ResponseCode.SUCCESS) || numericCode === 0 || numericCode === 200
			: false;

		// 对上传接口，返回有效文件地址即视为成功，避免后端success code定义差异导致误判
		if (!hasUploadedUrl && !isSuccessCode) {
			profileFeedback.value = response.message || '头像上传失败';
			return;
		}

		profileForm.avatarUrl = response.data.trim();
		profileFeedback.value = '头像上传成功，请点击“保存修改”完成更新';
		profileFeedbackSuccess.value = true;
	} catch (error) {
		console.log(error);
		profileFeedback.value = '头像上传失败，请稍后重试';
	} finally {
		profileSubmitting.value = false;
	}
}

function exitProfileDialog() {
	if (profileSubmitting.value) {
		return;
	}
	applyProfile(originalProfile.value);
	resetProfileFeedback();
	closeProfileDialog();
}

async function saveProfile() {
	if (!profileForm.id) {
		profileFeedback.value = '管理员信息缺失，请重新打开弹窗';
		return;
	}

	resetProfileFeedback();
	profileSubmitting.value = true;
	try {
		const response = await adminApi.updateProfile({
			id: profileForm.id,
			username: profileForm.username.trim(),
			phone: profileForm.phone.trim(),
			avatarUrl: profileForm.avatarUrl.trim(),
		});

		if (response.code !== ResponseCode.SUCCESS) {
			profileFeedback.value = response.message || '保存失败，请稍后重试';
			return;
		}

		originalProfile.value = {
			id: profileForm.id,
			username: profileForm.username.trim(),
			phone: profileForm.phone.trim(),
			avatarUrl: profileForm.avatarUrl.trim(),
		};

		if (authStore.user) {
			authStore.setUser({
				...authStore.user,
				username: originalProfile.value.username,
				avatarUrl: originalProfile.value.avatarUrl,
			});
		}

		profileFeedback.value = response.message || '信息已保存';
		profileFeedbackSuccess.value = true;

		// 保存成功后，延迟一段时间自动关闭弹窗
		setTimeout(() => {
			closeProfileDialog();
			resetProfileFeedback();
		}, 800);
	} catch {
		profileFeedback.value = '保存失败，请稍后重试';
	} finally {
		profileSubmitting.value = false;
	}
}

function resetPasswordState() {
	passwordForm.oldPassword = '';
	passwordForm.newPassword = '';
	passwordForm.confirmPassword = '';
	passwordFeedback.value = '';
	passwordFeedbackSuccess.value = false;
}

function openPasswordDialog() {
	resetPasswordState();
	showPasswordDialog.value = true;
}

function closePasswordDialog() {
	if (passwordSubmitting.value) {
		return;
	}
	showPasswordDialog.value = false;
	resetPasswordState();
}

async function submitPasswordChange() {
	passwordFeedback.value = '';
	passwordFeedbackSuccess.value = false;

	if (!passwordForm.oldPassword.trim() || !passwordForm.newPassword.trim()) {
		passwordFeedback.value = '请输入旧密码和新密码';
		return;
	}

	if (passwordForm.newPassword.trim().length < 6) {
		passwordFeedback.value = '新密码长度至少为6个字符';
		return;
	}

	if (passwordForm.newPassword !== passwordForm.confirmPassword) {
		passwordFeedback.value = '两次输入的新密码不一致';
		return;
	}

	passwordSubmitting.value = true;
	const result = await authStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
	passwordSubmitting.value = false;

	passwordFeedback.value = result.message;
	passwordFeedbackSuccess.value = result.success;

	if (result.success) {
		setTimeout(() => {
			showPasswordDialog.value = false;
			resetPasswordState();
		}, 800);
	}
}

async function handleLogout() {
	try {
		await authApi.logout();
	} catch {
		// 接口失败时仍继续本地登出
	}
	authStore.logout();
	router.push('/login');
}
</script>

<style lang="scss" scoped>
.admin-dashboard {
	height: 100vh;
	overflow: hidden;
	background:
		radial-gradient(circle at 12% 20%, rgba(19, 127, 236, 0.1), transparent 38%),
		radial-gradient(circle at 85% 5%, rgba(14, 165, 233, 0.09), transparent 32%),
		#f4f8fc;
	color: #0f172a;
}

.dashboard-shell {
	height: 100%;
	display: flex;
}

.sidebar {
	width: 190px;
	background: linear-gradient(180deg, #0f172a, #1e293b 40%, #0f172a 100%);
	color: #fff;
	padding: 20px 0;
	display: flex;
	flex-direction: column;
	border-right: 1px solid #1f334f;
	flex-shrink: 0;
	overflow-y: auto;
}

.sidebar-brand {
	display: flex;
	gap: 12px;
	align-items: center;
	padding: 8px 16px 20px;
}

.brand-icon {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: #137fec;
	display: flex;
	align-items: center;
	justify-content: center;
}

.brand-text h1 {
	margin: 0;
	font-size: 15px;
	color: #fff;
}

.brand-text p {
	margin: 2px 0 0;
	font-size: 12px;
	color: #94a3b8;
}

.menu-list {
	display: grid;
	gap: 4px;
	margin-top: 8px;
	padding: 0;
}

.menu-item {
	border: 0;
	background: transparent;
	color: #a8b5c7;
	border-radius: 10px;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 0px;
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;
}

.menu-item:hover {
	background: rgba(255, 255, 255, 0.08);
	color: #fff;
}

.menu-item.active {
	background: linear-gradient(90deg, #137fec, #3b9cf8);
	color: #fff;
	box-shadow: 0 8px 20px rgba(19, 127, 236, 0.35);
}

.menu-label {
	font-size: 15px;
	font-weight: 600;
}

.menu-icon {
	font-size: 20px;
}

.sidebar-user {
	margin-top: auto;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	border-top: 1px solid rgba(148, 163, 184, 0.3);
}

.sidebar-user-link {
	width: 100%;
	background: transparent;
	border: 0;
	color: inherit;
	text-align: left;
	cursor: pointer;
	transition: background 0.2s ease;
}

.sidebar-user-link:hover {
	background: rgba(255, 255, 255, 0.06);
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	background: rgba(255, 255, 255, 0.18);
	overflow: hidden;
}

.avatar-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.user-meta .name {
	margin: 0;
	font-size: 13px;
}

.user-meta .role {
	margin: 2px 0 0;
	font-size: 12px;
	color: #94a3b8;
}

.main-shell {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.topbar {
	min-height: 64px;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(6px);
	border-bottom: 1px solid #e2e8f0;
	padding: 12px 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.topbar h2 {
	margin: 0;
	font-size: 18px;
	color: #0f172a;
}

.topbar-actions {
	display: flex;
	align-items: center;
	gap: 10px;
}

.plain-action,
.primary-action,
.logout,
.secondary-btn,
.outline-btn,
.notify {
	border: 0;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	height: 38px;
	padding: 0 12px;
}

.plain-action {
	background: #fff;
	border: 1px solid #dbe5f1;
	color: #334155;
}

.primary-action {
	background: #137fec;
	color: #fff;
	box-shadow: 0 8px 16px rgba(19, 127, 236, 0.28);
}

.password-btn {
	padding: 0 14px;
}

.notify {
	position: relative;
	width: 38px;
	justify-content: center;
	background: #eef3fa;
	color: #475569;
}

.dot {
	position: absolute;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #ef4444;
	top: 8px;
	right: 8px;
}

.logout {
	background: #fee2e2;
	color: #b91c1c;
}

.password-dialog-mask {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.45);
	backdrop-filter: blur(2px);
	display: grid;
	place-items: center;
	padding: 16px;
	z-index: 100;
}

.password-dialog {
	width: min(460px, 100%);
	background: #fff;
	border-radius: 16px;
	border: 1px solid #dbe5f1;
	box-shadow: 0 18px 36px rgba(15, 23, 42, 0.2);
	padding: 18px;
}

.dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.dialog-header h3 {
	margin: 0;
	font-size: 20px;
	color: #0f172a;
}

.icon-close {
	border: 0;
	background: #f1f5f9;
	color: #334155;
	width: 34px;
	height: 34px;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.password-form {
	display: grid;
	gap: 12px;
}

.field {
	display: grid;
	gap: 6px;
	font-size: 13px;
	font-weight: 600;
	color: #334155;
}

.field input {
	height: 40px;
	border-radius: 10px;
	border: 1px solid #cbd5e1;
	padding: 0 12px;
	font-size: 14px;
	outline: none;
	transition: border-color 0.2s ease;
}

.field input:focus {
	border-color: #137fec;
}

.feedback {
	margin: 0;
	font-size: 13px;
	color: #b91c1c;
}

.feedback.success {
	color: #047857;
}

.dialog-actions {
	margin-top: 6px;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.content {
	flex: 1;
	padding: 24px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}

.blank-card {
	max-width: 560px;
	text-align: center;
}

.profile-section {
	animation: rise-in 0.28s ease;
}

.profile-dialog-mask {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.45);
	backdrop-filter: blur(2px);
	display: grid;
	place-items: center;
	padding: 16px;
	z-index: 101;
}

.profile-dialog {
	width: min(420px, 100%);
	background: #fff;
	border-radius: 16px;
	border: 1px solid #dbe5f1;
	box-shadow: 0 18px 36px rgba(15, 23, 42, 0.2);
	padding: 18px;
}

.profile-summary {
	display: grid;
	gap: 14px;
}

.profile-summary-avatar {
	width: 88px;
	height: 88px;
	border-radius: 999px;
	margin: 4px auto;
	overflow: hidden;
	background: #f1f5f9;
	display: grid;
	place-items: center;
	font-size: 30px;
	font-weight: 700;
	color: #475569;
}

.readonly-list {
	display: grid;
	gap: 10px;
}

.readonly-item {
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 10px 12px;
	display: grid;
	gap: 4px;
}

.readonly-item span {
	font-size: 12px;
	color: #64748b;
}

.readonly-item strong {
	font-size: 14px;
	color: #0f172a;
}

.profile-card {
	background: #fff;
	border: 1px solid #dbe5f1;
	border-radius: 16px;
	padding: 20px;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.profile-header h3 {
	margin: 0;
	font-size: 24px;
	color: #0f172a;
}

.profile-header p {
	margin: 8px 0 0;
	color: #64748b;
}

.profile-body {
	margin-top: 16px;
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 20px;
}

.avatar-editor {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding-top: 8px;
}

.avatar-upload {
	width: 112px;
	height: 112px;
	border-radius: 999px;
	border: 2px dashed #94a3b8;
	background: #f8fafc;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 28px;
	font-weight: 700;
	color: #475569;
	overflow: hidden;
	cursor: pointer;
	transition: border-color 0.2s ease, transform 0.2s ease;
}

.avatar-upload:hover {
	border-color: #137fec;
	transform: translateY(-1px);
}

.avatar-upload-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.avatar-editor p {
	margin: 0;
	font-size: 12px;
	color: #64748b;
}

.hidden-file-input {
	display: none;
}

.profile-form-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.profile-form-grid.single-column {
	grid-template-columns: 1fr;
}

.profile-form-grid .field.full {
	grid-column: 1 / -1;
}

.profile-loading {
	margin-top: 18px;
	padding: 22px;
	border-radius: 12px;
	background: #f8fafc;
	color: #64748b;
}

.profile-actions {
	margin-top: 16px;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.overview-section {
	animation: rise-in 0.28s ease;
}

.title-row h3 {
	margin: 0;
	font-size: 26px;
	color: #0f172a;
}

.title-row p {
	margin: 8px 0 0;
	color: #64748b;
}

.metric-grid {
	margin-top: 22px;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
}

.metric-card {
	background: #fff;
	border-radius: 14px;
	border: 1px solid #e2e8f0;
	padding: 16px;
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
}

.metric-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.metric-icon {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.metric-icon.blue {
	color: #137fec;
	background: #e7f1fd;
}

.metric-icon.orange {
	color: #f97316;
	background: #fff0e8;
}

.metric-icon.green {
	color: #059669;
	background: #e8fbf3;
}

.metric-icon.purple {
	color: #7c3aed;
	background: #f2eafe;
}

.metric-icon.cyan {
	color: #0891b2;
	background: #e4fbff;
}

.metric-icon.red {
	color: #dc2626;
	background: #ffecec;
}

.metric-icon.slate {
	color: #334155;
	background: #f1f5f9;
}

.metric-tag {
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
}

.metric-tag.up {
	color: #047857;
	background: #dcfce7;
}

.metric-tag.down {
	color: #b91c1c;
	background: #fee2e2;
}

.metric-tag.neutral {
	color: #64748b;
	background: #f1f5f9;
}

.metric-title {
	margin: 14px 0 10px;
	color: #64748b;
	font-size: 13px;
}

.metric-value {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	color: #0f172a;
}

.skeleton {
	height: 28px;
	border-radius: 6px;
	background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 45%, #e2e8f0 65%);
	background-size: 300% 100%;
	animation: shimmer 1.4s infinite;
}

.skeleton.sm {
	width: 70%;
	height: 14px;
	margin-bottom: 8px;
}

.empty-panel {
	margin-top: 20px;
	background: #fff;
	border-radius: 16px;
	border: 1px dashed #cbd5e1;
	min-height: 320px;
	padding: 30px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
}

.empty-icon-wrap {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	background: #f8fafc;
	display: grid;
	place-items: center;
	color: #94a3b8;
}

.empty-panel h4 {
	margin: 14px 0 8px;
	font-size: 22px;
}

.empty-panel p {
	margin: 0;
	max-width: 420px;
	color: #64748b;
}

.empty-actions {
	margin-top: 20px;
	display: flex;
	gap: 10px;
}

.secondary-btn {
	color: #1e293b;
	background: #e2e8f0;
}

.outline-btn {
	color: #137fec;
	background: #fff;
	border: 1px solid #137fec;
}

.page-footer {
	margin-top: 20px;
	text-align: center;
	color: #94a3b8;
	font-size: 12px;
}

.module-section {
	height: 100%;
	display: grid;
	place-items: center;
}

.account-management-section {
	display: flex;
	flex-direction: column;
	place-items: unset;
	padding: 0;
	overflow: hidden;
}

.health-education-section {
	display: flex;
	flex-direction: column;
	place-items: unset;
	padding: 24px;
	overflow: auto;
	background-color: #fafafa;
}

.operation-log-section {
	display: flex;
	flex-direction: column;
	place-items: unset;
	padding: 24px;
	overflow: auto;
	background-color: #fafafa;
}

.epidemic-alert-section {
	display: flex;
	flex-direction: column;
	place-items: unset;
	padding: 24px;
	overflow: hidden;
	background-color: #fafafa;
}

.system-config-section {
	display: flex;
	flex-direction: column;
	place-items: unset;
	padding: 24px;
	overflow: hidden;
	background-color: #fafafa;
}

.module-card {
	width: min(560px, 100%);
	background: #fff;
	border-radius: 20px;
	padding: 32px;
	border: 1px solid #e2e8f0;
	text-align: center;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.module-icon {
	width: 64px;
	height: 64px;
	border-radius: 16px;
	display: grid;
	place-items: center;
	margin: 0 auto;
}

.module-symbol {
	font-size: 30px;
}

.module-card h3 {
	margin: 14px 0 8px;
	font-size: 24px;
}

.module-card p {
	margin: 0 0 20px;
	color: #64748b;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
	transition: all 0.22s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
	opacity: 0;
	transform: translateY(8px);
}

@keyframes shimmer {
	0% {
		background-position: 100% 0;
	}
	100% {
		background-position: 0 0;
	}
}

@keyframes rise-in {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (max-width: 1200px) {
	.metric-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 980px) {
	.dashboard-shell {
		flex-direction: column;
	}

	.sidebar {
		width: 100%;
		padding-bottom: 14px;
	}

	.menu-list {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.sidebar-user {
		margin-top: 14px;
	}
}

@media (max-width: 680px) {
	.content {
		padding: 16px;
	}

	.menu-list {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.topbar {
		flex-direction: column;
		align-items: flex-start;
		padding: 12px 16px;
	}

	.topbar-actions {
		width: 100%;
		flex-wrap: wrap;
	}

	.metric-grid {
		grid-template-columns: 1fr;
	}

	.profile-body {
		grid-template-columns: 1fr;
	}

	.profile-form-grid {
		grid-template-columns: 1fr;
	}

	.plain-action,
	.primary-action,
	.logout,
	.outline-btn {
		height: 34px;
		font-size: 12px;
	}
}


.material-symbols-outlined {
	font-variation-settings:
		'FILL' 0,
		'wght' 500,
		'GRAD' 0,
		'opsz' 24;
}
</style>