<template>
<div class="doctor-dashboard">
<div class="dashboard-shell">
<aside class="sidebar">
<div class="sidebar-brand">
<div class="brand-icon">
<el-icon class="material-symbols-outlined"><FirstAidKit /></el-icon>
</div>
<div class="brand-text">
<h1>社区医疗服务</h1>
<p>Doctor Portal</p>
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
<span class="menu-label-wrap">
<span class="menu-label">{{ item.label }}</span>
<span v-if="item.key === 'consultation' && totalUnreadCount > 0" class="menu-unread-badge">{{ formatUnreadCount(totalUnreadCount) }}</span>
</span>
</button>
</nav>

<div class="sidebar-user" style="cursor: pointer;" @click="openProfileDialog">
<div class="avatar">
<img v-if="userAvatarUrl" :src="userAvatarUrl" alt="用户头像" class="avatar-image" />
<span v-else>{{ userInitial }}</span>
</div>
<div class="user-meta">
<p class="name">{{ userName }}</p>
<p class="role">{{ userRoleText }}</p>
</div>
</div>
</aside>

<div class="main-shell">
<header class="topbar">
<div>
<h2>社区医疗服务系统 · 医生端</h2>
</div>
<div class="topbar-actions">
<button class="plain-action password-btn" type="button" @click="openPasswordDialog">
<el-icon class="material-symbols-outlined"><Refresh /></el-icon>
修改密码
</button>
<button class="logout" type="button" @click="handleLogout">退出登录</button>
</div>
</header>

<main class="content" :class="{ 'content-full': activeMenu === 'workbench' || activeMenu === 'patients' || activeMenu === 'consultation' || activeMenu === 'appointments' || activeMenu === 'schedule' || activeMenu === 'medical-visits' || activeMenu === 'diagnosis-reports' || activeMenu === 'my-patients' }">
<transition name="fade-slide" mode="out-in">
<section
v-if="activeMenu === 'workbench'"
key="workbench"
class="module-section doctor-workbench-section"
>
<DoctorWorkbench />
</section>

<section
v-else-if="activeMenu === 'education'"
key="education"
class="module-section health-education-section"
>
<HealthEducation />
</section>

<section
v-else-if="activeMenu === 'appointments'"
key="appointments"
class="module-section doctor-appointment-section"
>
<DoctorAppointmentTable />
</section>

<section
v-else-if="activeMenu === 'patients'"
key="patients"
class="module-section patient-archive-section"
>
<PatientArchive />
</section>

<section
v-else-if="activeMenu === 'consultation'"
key="consultation"
class="module-section consultation-section"
>
<ConsultationPanel role="doctor" />
</section>

<section
v-else-if="activeMenu === 'schedule'"
key="schedule"
class="module-section doctor-schedule-section"
>
<DoctorSchedulePanel />
</section>

<section
v-else-if="activeMenu === 'medical-visits'"
key="medical-visits"
class="module-section doctor-medical-visit-section"
>
<DoctorMedicalVisitList />
</section>

<section
v-else-if="activeMenu === 'diagnosis-reports'"
key="diagnosis-reports"
class="module-section doctor-diagnosis-report-section"
>
<DoctorDiagnosisReportList />
</section>

<section
v-else-if="activeMenu === 'my-patients'"
key="my-patients"
class="module-section doctor-my-patients-section"
>
<DoctorMyPatients />
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

<div
v-if="showProfileDialog"
class="password-dialog-mask"
role="dialog"
aria-modal="true"
aria-label="个人信息修改"
@click.self="closeProfileDialog"
>
<div class="password-dialog">
<div class="dialog-header">
<h3>个人信息修改</h3>
<button
type="button"
class="icon-close"
:disabled="profileSubmitting || avatarUploading"
@click="closeProfileDialog"
>
<el-icon class="material-symbols-outlined"><Close /></el-icon>
</button>
</div>

<form class="password-form" @submit.prevent="submitProfileUpdate">
<label class="field">
<span>用户名</span>
<input v-model="profileForm.username" type="text" placeholder="请输入用户名" />
</label>

<label class="field">
<span>姓名</span>
<input v-model="profileForm.name" type="text" placeholder="请输入姓名" />
</label>

<label class="field">
<span>手机号</span>
<input v-model="profileForm.phone" type="text" placeholder="请输入手机号" />
</label>

<label class="field">
<span>紧急联系方式</span>
<input v-model="profileForm.contact" type="text" placeholder="请输入紧急联系方式" />
</label>

<label class="field">
<span>年龄</span>
<input v-model.number="profileForm.age" type="number" min="0" max="130" placeholder="请输入年龄" />
</label>

<label class="field">
<span>性别</span>
<select v-model.number="profileForm.gender" class="field-select">
<option :value="1">男</option>
<option :value="0">女</option>
</select>
</label>

<label class="field">
<span>头像</span>
<div class="avatar-upload-wrap">
<button
type="button"
class="avatar-upload-trigger"
:disabled="avatarUploading || profileLoading || profileSubmitting"
@click="triggerAvatarUpload"
>
<img
v-if="profileForm.avatarUrl"
:src="profileForm.avatarUrl"
alt="头像预览"
class="profile-avatar-preview"
/>
<span v-else>点击上传头像</span>
</button>
<input
ref="avatarFileInputRef"
type="file"
accept="image/*"
class="hidden-file-input"
@change="handleAvatarFileChange"
/>
<p class="avatar-upload-hint">点击头像选择图片，上传后自动更新</p>
</div>
</label>

<label class="field">
<span>地址</span>
<textarea v-model="profileForm.address" rows="3" class="field-textarea" placeholder="请输入地址" />
</label>

<p v-if="profileLoading" class="feedback">正在加载个人信息...</p>
<p v-else-if="profileFeedback" class="feedback" :class="{ success: profileFeedbackSuccess }">
{{ profileFeedback }}
</p>

<div class="dialog-actions">
<button type="button" class="outline-btn" :disabled="profileSubmitting || avatarUploading" @click="closeProfileDialog">
退出
</button>
<button type="submit" class="primary-action" :disabled="profileSubmitting || profileLoading || avatarUploading">
{{ profileSubmitting ? '保存中...' : '保存修改' }}
</button>
</div>
</form>
</div>
</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import type { Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
AlarmClock,
Calendar,
ChatDotRound,
Close,
FirstAidKit,
HomeFilled,
Menu,
Reading,
Refresh,
User,
} from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import { useConsultationStore } from '@/stores/consultation.store';
import { authApi } from '@/api/auth.api';
import { getDoctorAccount, updateDoctorAccount, uploadDoctorAvatar } from '@/api/doctor.api';
import type { UpdateDoctorProfileDTO } from '@/types/doctor.types';
import AppointmentWebSocket from '@/utils/appointment.websocket';
import HealthEducation from '@/components/admin/HealthEducation.vue';
import DoctorWorkbench from '@/components/doctor/DoctorWorkbench.vue';
import DoctorAppointmentTable from '@/components/doctor/DoctorAppointmentTable.vue';
import PatientArchive from '@/components/doctor/PatientArchive.vue';
import DoctorSchedulePanel from '@/components/doctor/DoctorSchedulePanel.vue';
import DoctorMedicalVisitList from '@/components/doctor/DoctorMedicalVisitList.vue';
import DoctorDiagnosisReportList from '@/components/doctor/DoctorDiagnosisReportList.vue';
import DoctorMyPatients from '@/components/doctor/DoctorMyPatients.vue';
import ConsultationPanel from '@/components/consultation/ConsultationPanel.vue';

type DoctorMenuKey = 'workbench' | 'appointments' | 'patients' | 'consultation' | 'education' | 'schedule' | 'medical-visits' | 'diagnosis-reports' | 'my-patients';

interface MenuItem {
key: DoctorMenuKey;
label: string;
icon: string;
description: string;
actionLabel: string;
colorClass: string;
}

const menuItems: MenuItem[] = [
{
key: 'workbench',
label: '工作台',
icon: 'home',
description: '查看今日工作概览、待处理事项与患者预约情况。',
actionLabel: '刷新工作台',
colorClass: 'blue',
},
{
key: 'appointments',
label: '预约管理',
icon: 'calendar',
description: '管理患者预约记录，查看接诊安排与候诊状态。',
actionLabel: '进入预约管理',
colorClass: 'cyan',
},
{
key: 'patients',
label: '患者档案',
icon: 'user',
description: '查阅与维护患者健康档案、就诊记录及病史信息。',
actionLabel: '查看患者档案',
colorClass: 'green',
},
{
key: 'consultation',
label: '在线问诊',
icon: 'chat',
description: '通过平台与患者进行在线交流，提供远程医疗咨询服务。',
actionLabel: '进入在线问诊',
colorClass: 'purple',
},
{
key: 'education',
label: '健康宣教',
icon: 'reading',
description: '查阅和发布社区健康资讯、宣教文章及科普活动内容。',
actionLabel: '查看健康宣教',
colorClass: 'orange',
},
{
key: 'schedule',
label: '日程安排',
icon: 'alarm',
description: '管理工作排班、会诊计划及其他日程安排事项。',
actionLabel: '查看日程安排',
colorClass: 'slate',
},
];

const menuIconMap: Record<string, Component> = {
home: HomeFilled,
calendar: Calendar,
user: User,
chat: ChatDotRound,
reading: Reading,
alarm: AlarmClock,
};

function resolveMenuIcon(iconName: string): Component {
return menuIconMap[iconName] || Menu;
}

const authStore = useAuthStore();
const consultationStore = useConsultationStore();
const route = useRoute();
const router = useRouter();
const doctorAppointmentSocket = ref<AppointmentWebSocket | null>(null);

function connectDoctorAppointmentSocket() {
	const userId = authStore.user?.id;
	if (!userId) {
		return;
	}

	doctorAppointmentSocket.value?.disconnect();
	const socket = new AppointmentWebSocket(userId, 'doctor', authStore.token);
	socket.on('notification', (payload) => {
		if (typeof payload !== 'object' || payload === null) {
			return;
		}

		const notification = payload as { title?: string; queueNo?: string; timestamp?: string };
		const title = notification.title || '预约通知';
		const queueNo = notification.queueNo || '-';
		const timestamp = notification.timestamp || '';

		ElNotification({
			title,
			message: `排队序号：${queueNo}${timestamp ? `\n时间：${timestamp}` : ''}`,
			type: 'info',
			duration: 4200,
		});

		// Notify appointment table to refresh when booking/cancel actions happen.
		if (title.includes('预约')) {
			window.dispatchEvent(new CustomEvent('appointment:doctor-refresh'));
		}
	});
	socket.connect();
	doctorAppointmentSocket.value = socket;
}

const validMenuKeys: DoctorMenuKey[] = [...menuItems.map((item) => item.key), 'medical-visits', 'diagnosis-reports', 'my-patients'];

const activeMenu = computed<DoctorMenuKey>(() => {
const tab = route.query.tab;
if (typeof tab === 'string' && validMenuKeys.includes(tab as DoctorMenuKey)) {
return tab as DoctorMenuKey;
}
return 'workbench';
});

const currentModule = computed<MenuItem>(() => {
return menuItems.find((item) => item.key === activeMenu.value) ?? menuItems[0]!;
});

const userName = computed(() => authStore.user?.username || '医生');
const userAvatarUrl = computed(() => authStore.user?.avatarUrl || '');

const userInitial = computed(() => {
const firstChar = userName.value.trim().charAt(0);
return firstChar || '医';
});

const userRoleText = computed(() => '执业医师');
const totalUnreadCount = computed(() => consultationStore.totalUnreadCount);

function formatUnreadCount(count: number) {
	if (count > 99) {
		return '99+';
	}
	return String(count);
}

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
const avatarUploading = ref(false);
const profileFeedback = ref('');
const profileFeedbackSuccess = ref(false);
const avatarFileInputRef = ref<HTMLInputElement | null>(null);
const profileForm = reactive({
userId: 0,
username: '',
phone: '',
avatarUrl: '',
name: '',
gender: 0,
age: 0,
contact: '',
address: '',
});

function switchMenu(key: DoctorMenuKey) {
router.replace({
path: route.path,
query: {
...route.query,
tab: key,
},
});
}

onMounted(async () => {
	try {
		await consultationStore.refreshUnread('doctor');
		await consultationStore.connectSocket('doctor');
	} catch {
		// Keep appointment notifications available even if consultation socket fails.
	}

	connectDoctorAppointmentSocket();
});

onUnmounted(() => {
	consultationStore.disconnectSocket();
	consultationStore.resetState();
	doctorAppointmentSocket.value?.disconnect();
	doctorAppointmentSocket.value = null;
});

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

function resetProfileState() {
profileLoading.value = false;
profileSubmitting.value = false;
avatarUploading.value = false;
profileFeedback.value = '';
profileFeedbackSuccess.value = false;
profileForm.userId = 0;
profileForm.username = '';
profileForm.phone = '';
profileForm.avatarUrl = '';
profileForm.name = '';
profileForm.gender = 0;
profileForm.age = 0;
profileForm.contact = '';
profileForm.address = '';
}

async function openProfileDialog() {
const userId = authStore.user?.id;
if (!userId) {
profileFeedback.value = '未获取到当前用户信息，请重新登录';
profileFeedbackSuccess.value = false;
showProfileDialog.value = true;
return;
}

showProfileDialog.value = true;
profileLoading.value = true;
profileFeedback.value = '';
profileFeedbackSuccess.value = false;

try {
const response = await getDoctorAccount(userId);
const data = response.data;
profileForm.userId = data.userId;
profileForm.username = data.username ?? '';
profileForm.phone = data.phone ?? '';
profileForm.avatarUrl = data.avatarUrl ?? '';
profileForm.name = data.name ?? '';
profileForm.gender = data.gender ?? 0;
profileForm.age = data.age ?? 0;
profileForm.contact = data.contact ?? '';
profileForm.address = data.address ?? '';
} catch {
profileFeedback.value = '加载个人信息失败，请稍后重试';
profileFeedbackSuccess.value = false;
}

profileLoading.value = false;
}

function triggerAvatarUpload() {
if (avatarUploading.value || profileLoading.value || profileSubmitting.value) {
return;
}
avatarFileInputRef.value?.click();
}

async function handleAvatarFileChange(event: Event) {
const inputEl = event.target as HTMLInputElement;
const file = inputEl.files?.[0];
if (!file) {
return;
}

avatarUploading.value = true;
profileFeedback.value = '';
profileFeedbackSuccess.value = false;

try {
const response = await uploadDoctorAvatar(file);
if (response.code === 1 && response.data) {
profileForm.avatarUrl = response.data;
profileFeedback.value = '头像上传成功';
profileFeedbackSuccess.value = true;
} else {
profileFeedback.value = response.message || '头像上传失败';
profileFeedbackSuccess.value = false;
}
} catch {
profileFeedback.value = '头像上传失败，请稍后重试';
profileFeedbackSuccess.value = false;
} finally {
avatarUploading.value = false;
inputEl.value = '';
}
}

function closeProfileDialog() {
if (profileSubmitting.value || avatarUploading.value) {
return;
}
showProfileDialog.value = false;
resetProfileState();
}

async function submitProfileUpdate() {
if (profileLoading.value) {
return;
}

profileFeedback.value = '';
profileFeedbackSuccess.value = false;

if (!profileForm.username.trim() || !profileForm.name.trim() || !profileForm.phone.trim()) {
profileFeedback.value = '用户名、姓名和手机号不能为空';
return;
}

const payload: UpdateDoctorProfileDTO = {
id: profileForm.userId,
username: profileForm.username.trim(),
name: profileForm.name.trim(),
phone: profileForm.phone.trim(),
contact: profileForm.contact.trim(),
avatarUrl: profileForm.avatarUrl.trim(),
address: profileForm.address.trim(),
age: Number(profileForm.age) || 0,
gender: Number(profileForm.gender) || 0,
};

profileSubmitting.value = true;
try {
const response = await updateDoctorAccount(payload);
profileFeedback.value = response.message || '个人信息更新成功';
profileFeedbackSuccess.value = response.code === 1;

if (profileFeedbackSuccess.value && authStore.user) {
authStore.setUser({
...authStore.user,
username: payload.username,
avatarUrl: payload.avatarUrl,
});
setTimeout(() => {
closeProfileDialog();
}, 600);
}
} catch {
profileFeedback.value = '保存失败，请稍后重试';
profileFeedbackSuccess.value = false;
} finally {
profileSubmitting.value = false;
}
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
.doctor-dashboard {
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
padding: 0 10px;
}

.menu-item {
border: 0;
background: transparent;
color: #a8b5c7;
border-radius: 10px;
display: flex;
align-items: center;
gap: 10px;
width: 100%;
padding: 10px 12px;
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

.menu-label-wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
}

.menu-unread-badge {
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 9px;
	background: #ff4d4f;
	color: #fff;
	font-size: 11px;
	font-weight: 700;
	line-height: 18px;
	text-align: center;
	position: absolute;
	top: -9px;
	right: -16px;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
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
.outline-btn {
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
max-height: calc(100vh - 32px);
overflow-y: auto;
overscroll-behavior: contain;
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

.field-select,
.field-textarea {
border-radius: 10px;
border: 1px solid #cbd5e1;
padding: 8px 12px;
font-size: 14px;
outline: none;
transition: border-color 0.2s ease;
background: #fff;
}

.field-select {
height: 40px;
}

.field-textarea {
resize: vertical;
}

.field-select:focus,
.field-textarea:focus {
border-color: #137fec;
}

.avatar-upload-wrap {
display: grid;
gap: 8px;
}

.avatar-upload-trigger {
inline-size: 92px;
block-size: 92px;
border-radius: 50%;
border: 1px dashed #94a3b8;
background: #f8fafc;
display: inline-flex;
align-items: center;
justify-content: center;
font-size: 12px;
color: #475569;
cursor: pointer;
overflow: hidden;
padding: 0;
}

.avatar-upload-trigger:disabled {
opacity: 0.6;
cursor: not-allowed;
}

.profile-avatar-preview {
inline-size: 100%;
block-size: 100%;
object-fit: cover;
}

.hidden-file-input {
display: none;
}

.avatar-upload-hint {
margin: 0;
font-size: 12px;
color: #64748b;
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

.outline-btn {
color: #137fec;
background: #fff;
border: 1px solid #137fec;
}

.content {
flex: 1;
padding: 24px;
overflow-y: auto;
display: flex;
flex-direction: column;
}

.content-full {
padding: 0;
}

.module-section {
height: 100%;
display: grid;
place-items: center;
}

.health-education-section {
display: flex;
flex-direction: column;
place-items: unset;
padding: 24px;
overflow: auto;
background-color: #fafafa;
}

.doctor-workbench-section {
display: block;
padding: 24px;
overflow: auto;
width: 100%;
height: 100%;
}

.patient-archive-section {
display: block;
padding: 0;
overflow: visible;
width: 100%;
height: 100%;
}

.doctor-appointment-section {
display: block;
padding: 0;
overflow: hidden;
width: 100%;
height: 100%;
}

.consultation-section {
display: block;
padding: 0;
overflow: hidden;
width: 100%;
height: 100%;
}

.doctor-schedule-section {
display: block;
padding: 0;
overflow: auto;
width: 100%;
height: 100%;
}

.doctor-medical-visit-section {
display: block;
padding: 24px;
overflow: auto;
width: 100%;
height: 100%;
}

.doctor-diagnosis-report-section {
display: block;
padding: 24px;
overflow: auto;
width: 100%;
height: 100%;
}

.doctor-my-patients-section {
display: block;
padding: 24px;
overflow: auto;
width: 100%;
height: 100%;
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

.module-icon.blue {
color: #137fec;
background: #e7f1fd;
}

.module-icon.cyan {
color: #0891b2;
background: #e4fbff;
}

.module-icon.green {
color: #059669;
background: #e8fbf3;
}

.module-icon.purple {
color: #7c3aed;
background: #f2eafe;
}

.module-icon.orange {
color: #f97316;
background: #fff0e8;
}

.module-icon.slate {
color: #334155;
background: #f1f5f9;
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

.plain-action,
.primary-action,
.logout,
.outline-btn {
height: 34px;
font-size: 12px;
}
}
</style>
