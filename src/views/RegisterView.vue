<template>
  <div class="register-wrapper">
    <header class="page-header">
      <div class="logo-group">
        <div class="logo-shield">
          <el-icon class="material-symbols-outlined logo-icon"><FirstAidKit /></el-icon>
        </div>
        <span class="system-name">社区健康服务平台</span>
      </div>
      <div class="header-actions">
        <button class="btn-text" type="button" @click="goLogin">登录</button>
      </div>
    </header>

    <main class="main-content">
      <div class="register-card">
        <div class="card-header">
          <h1>居民用户注册</h1>
          <p>创建您的个人健康档案账户，即刻享受便捷社区医疗记录。</p>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <section class="form-section">
            <h2>个人基本信息</h2>

            <label class="field avatar-field">
              <span>头像</span>
              <div class="avatar-upload-wrap">
                <button
                  type="button"
                  class="avatar-upload-trigger"
                  :disabled="avatarUploading || submitting"
                  @click="triggerAvatarUpload"
                >
                  <img
                    v-if="form.avatarUrl"
                    :src="form.avatarUrl"
                    alt="头像预览"
                    class="avatar-preview"
                  />
                  <span v-else>点击上传</span>
                </button>
                <input
                  ref="avatarInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file-input"
                  @change="handleAvatarChange"
                />
                <p class="hint">支持 JPG、PNG、JPEG、GIF</p>
              </div>
            </label>

            <div class="row three-col">
              <label class="field">
                <span>姓名</span>
                <input v-model="form.name" type="text" placeholder="例如：张三" required />
              </label>
              <label class="field">
                <span>年龄</span>
                <input v-model.number="form.age" type="number" min="1" max="130" placeholder="25" required />
              </label>
              <label class="field">
                <span>性别</span>
                <select v-model.number="form.gender" required>
                  <option :value="-1" disabled>请选择</option>
                  <option :value="1">男</option>
                  <option :value="0">女</option>
                </select>
              </label>
            </div>

            <label class="field">
              <span>住址</span>
              <input v-model="form.address" type="text" placeholder="请输入完整住址（含门牌号）" required />
            </label>
          </section>

          <section class="form-section">
            <h2>联系方式与身份认证</h2>
            <div class="row two-col">
              <label class="field">
                <span>电话号码</span>
                <input v-model="form.phone" type="text" placeholder="请输入手机号" required />
              </label>
              <label class="field">
                <span>身份证号</span>
                <input v-model="form.idCard" type="text" placeholder="请输入18位身份证号" required />
              </label>
            </div>
            <label class="field">
              <span>紧急联系方式</span>
              <input v-model="form.contact" type="text" placeholder="请输入紧急联系人电话" required />
            </label>
          </section>

          <section class="form-section">
            <h2>账户安全设置</h2>
            <label class="field">
              <span>用户名</span>
              <input v-model="form.username" type="text" placeholder="请设置唯一用户名" required />
            </label>
            <div class="row two-col">
              <label class="field">
                <span>密码</span>
                <input v-model="form.password" type="password" placeholder="请输入密码" required />
              </label>
              <label class="field">
                <span>确认密码</span>
                <input v-model="confirmPassword" type="password" placeholder="请再次输入密码" required />
              </label>
            </div>
          </section>

          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

          <div class="actions">
            <button type="submit" class="primary-btn" :disabled="submitting">
              {{ submitting ? '提交中...' : '完成注册' }}
            </button>
            <button type="button" class="ghost-btn" @click="goLogin">取消</button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { FirstAidKit } from '@element-plus/icons-vue';
import { uploadResidentAvatar } from '@/api/resident.api';
import { useAuthStore } from '@/stores/auth.store';
import type { ResidentRegisterDTO } from '@/types/resident.types';

const router = useRouter();
const authStore = useAuthStore();
const submitting = ref(false);
const avatarUploading = ref(false);
const errorMessage = ref('');
const confirmPassword = ref('');
const avatarInputRef = ref<HTMLInputElement | null>(null);

const form = reactive<ResidentRegisterDTO>({
  address: '',
  age: 0,
  avatarUrl: '',
  contact: '',
  gender: -1,
  idCard: '',
  name: '',
  password: '',
  phone: '',
  username: '',
});

function goLogin() {
  router.push({ name: 'login' });
}

function triggerAvatarUpload() {
  if (avatarUploading.value || submitting.value) {
    return;
  }
  avatarInputRef.value?.click();
}

async function handleAvatarChange(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const file = inputEl.files?.[0];
  if (!file) {
    return;
  }

  avatarUploading.value = true;
  try {
    const response = await uploadResidentAvatar(file);
    if (response.code === 1 && response.data) {
      form.avatarUrl = response.data;
      ElMessage.success('头像上传成功');
    } else {
      ElMessage.error(response.message || '头像上传失败');
    }
  } catch {
    ElMessage.error('头像上传失败，请稍后重试');
  } finally {
    avatarUploading.value = false;
    inputEl.value = '';
  }
}

function validateForm(): boolean {
  errorMessage.value = '';

  if (!form.avatarUrl.trim()) {
    errorMessage.value = '请上传头像';
    return false;
  }
  if (
    !form.name.trim() ||
    !form.username.trim() ||
    !form.phone.trim() ||
    !form.password.trim() ||
    !confirmPassword.value.trim() ||
    !form.address.trim() ||
    !form.contact.trim() ||
    !form.idCard.trim()
  ) {
    errorMessage.value = '请完整填写所有必填项';
    return false;
  }
  if (!Number.isFinite(form.age) || form.age <= 0) {
    errorMessage.value = '请输入有效年龄';
    return false;
  }
  if (form.gender !== 0 && form.gender !== 1) {
    errorMessage.value = '请选择性别';
    return false;
  }
  if (form.password.length < 6) {
    errorMessage.value = '密码长度至少为6位';
    return false;
  }
  if (form.password !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致';
    return false;
  }

  return true;
}

async function handleRegister() {
  if (!validateForm()) {
    return;
  }

  submitting.value = true;
  const result = await authStore.registerResident({
    ...form,
    name: form.name.trim(),
    username: form.username.trim(),
    phone: form.phone.trim(),
    contact: form.contact.trim(),
    address: form.address.trim(),
    idCard: form.idCard.trim(),
    password: form.password.trim(),
  });
  submitting.value = false;

  if (result.success) {
    ElMessage.success('注册成功，请登录！');
    router.push({ name: 'login' });
    return;
  }

  errorMessage.value = result.message;
}
</script>

<style scoped>
.register-wrapper {
  min-height: 100vh;
  background: #f3f4f6;
  color: #0f172a;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-shield {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.system-name {
  font-weight: 700;
}

.btn-text {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.main-content {
  display: flex;
  justify-content: center;
  padding: 10px 16px 30px;
}

.register-card {
  width: min(980px, 100%);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
}

.card-header h1 {
  margin: 0;
  font-size: 38px;
  text-align: center;
}

.card-header p {
  margin: 10px 0 20px;
  text-align: center;
  color: #64748b;
}

.register-form {
  display: grid;
  gap: 18px;
}

.form-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 14px;
  display: grid;
  gap: 12px;
}

.form-section h2 {
  margin: 0;
  font-size: 18px;
}

.row {
  display: grid;
  gap: 12px;
}

.three-col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  padding: 0 12px;
  font-size: 14px;
}

.field textarea {
  height: auto;
  padding: 10px 12px;
}

.avatar-field {
  align-items: start;
}

.avatar-upload-wrap {
  display: grid;
  gap: 8px;
}

.avatar-upload-trigger {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 1px dashed #94a3b8;
  background: #f8fafc;
  cursor: pointer;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-file-input {
  display: none;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.error-msg {
  margin: 0;
  color: #b91c1c;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-btn,
.ghost-btn {
  height: 40px;
  border-radius: 10px;
  padding: 0 18px;
  cursor: pointer;
}

.primary-btn {
  border: 0;
  background: #3b82f6;
  color: #fff;
}

.ghost-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

@media (max-width: 860px) {
  .three-col,
  .two-col {
    grid-template-columns: 1fr;
  }

  .card-header h1 {
    font-size: 30px;
  }
}
</style>
