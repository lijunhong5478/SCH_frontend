<template>
  <div class="login-wrapper">
    <header class="page-header">
      <div class="logo-group">
        <div class="logo-shield">
          <el-icon class="material-symbols-outlined logo-icon"><FirstAidKit /></el-icon>
        </div>
        <span class="system-name">社区医疗服务系统</span>
      </div>
      <div class="header-actions">
        <button class="btn-text">注册账号</button>
        <button class="btn-ghost">帮助中心</button>
      </div>
    </header>

    <main class="main-content">
      <div class="content-container">
        <section class="visual-panel">
          <div class="image-box">
            <img src="../assets/background.png" alt="Medical Technology" />
            <div class="image-overlay">
              <div class="overlay-text">
                <span class="badge">安全门户</span>
                <h2>您的健康，<br/>数字化管理。</h2>
                <p>访问全面的家庭健康档案，预约挂号，并安全地连接您的社区医生。</p>
              </div>
            </div>
          </div>
        </section>

        <section class="form-panel">
          <div class="login-card">
            <div class="card-header">
              <h1>欢迎回来</h1>
              <p>请登录以访问您的医疗服务控制台。</p>
            </div>

            <form class="auth-form" @submit.prevent="handleLogin">
              <div class="form-item">
                <label class="item-label">登录方式</label>
                <div class="login-type-tags" role="tablist" aria-label="登录方式">
                  <button
                    v-for="role in roleOptions"
                    :key="role.value"
                    type="button"
                    class="login-type-tag"
                    :class="{ 'is-active': formData.loginType === role.value }"
                    role="tab"
                    :aria-selected="formData.loginType === role.value"
                    @click="selectLoginType(role.value)"
                  >
                    {{ role.label }}
                  </button>
                </div>
              </div>

              <div class="form-item">
                <label class="item-label">{{ accountLabel }}</label>
                <div class="input-group" :class="{ 'has-error': formErrors.account }">
                  <el-icon class="material-symbols-outlined input-icon"><User /></el-icon>
                  <input 
                    v-model="formData.account" 
                    type="text" 
                    :placeholder="accountPlaceholder"
                    class="main-input"
                  />
                </div>
                <transition name="shake">
                  <span v-if="formErrors.account" class="error-msg">{{ formErrors.account }}</span>
                </transition>
              </div>

              <div class="form-item">
                <div class="label-row">
                  <label class="item-label">密码</label>
                  <a href="#" class="link-small">忘记密码？</a>
                </div>
                <div class="input-group" :class="{ 'has-error': formErrors.password }">
                  <el-icon class="material-symbols-outlined input-icon"><Lock /></el-icon>
                  <input 
                    v-model="formData.password" 
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="请输入密码"
                    class="main-input"
                  />
                  <button type="button" class="toggle-btn" @click="togglePasswordVisibility">
                    <el-icon class="material-symbols-outlined toggle-icon">
                      <component :is="showPassword ? View : Hide" />
                    </el-icon>
                  </button>
                </div>
                <span v-if="formErrors.password" class="error-msg">{{ formErrors.password }}</span>
              </div>

              <button 
                type="submit" 
                class="submit-btn" 
                :disabled="isLoading || !isFormValid"
                :class="{ 'is-loading': isLoading }"
              >
                <span>{{ isLoading ? '验证中...' : '安全登录' }}</span>
                <el-icon v-if="!isLoading" class="material-symbols-outlined"><ArrowRight /></el-icon>
              </button>

              <div v-if="errorMessage" class="alert-box">
                <el-icon class="material-symbols-outlined"><WarningFilled /></el-icon>
                {{ errorMessage }}
              </div>

              <p class="policy-text">
                登录即表示您同意我们的 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>

    <div class="grid-bg"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, FirstAidKit, Hide, Lock, User, View, WarningFilled } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import authApi from '@/api/auth.api';
import { ResponseCode, type LoginDTO } from '@/types/api.types';

type LoginType = 1 | 2 | 3;

const router = useRouter();
const authStore = useAuthStore();

// 登录方式选项配置
const roleOptions = [
  {
    value: 1 as LoginType,
    label: '用户名登录',
    description: '使用用户名和密码登录',
  },
  {
    value: 2 as LoginType,
    label: '手机号登录',
    description: '使用手机号和密码登录',
  },
  {
    value: 3 as LoginType,
    label: '身份证登录',
    description: '使用身份证号和密码登录',
  },
];

// 表单数据
const formData = reactive<LoginDTO>({
  account: '',
  password: '',
  loginType: 1 as LoginType,
});

// 表单验证错误
const formErrors = reactive({
  account: '',
  password: '',
});

// 状态
const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

// 计算属性
const isFormValid = computed(() => {
  return (
    formData.loginType !== null &&
    formData.account.trim().length >= 3 &&
    formData.password.trim().length >= 6
  );
});

// 账号标签和占位符
const accountLabel = computed(() => {
  switch (formData.loginType) {
    case 1: return '用户名';
    case 2: return '手机号';
    case 3: return '身份证号';
    default: return '账号';
  }
});

const accountPlaceholder = computed(() => {
  switch (formData.loginType) {
    case 1: return '请输入用户名';
    case 2: return '请输入手机号';
    case 3: return '请输入身份证号';
    default: return '请输入账号';
  }
});

const validateForm = (): boolean => {
  let isValid = true;

  // 清空之前的错误
  clearErrors();

  // 验证账号
  if (!formData.account.trim()) {
    formErrors.account = '请输入账号';
    isValid = false;
  } else if (formData.account.trim().length < 3) {
    formErrors.account = '账号长度至少为3个字符';
    isValid = false;
  }

  // 验证密码
  if (!formData.password.trim()) {
    formErrors.password = '请输入密码';
    isValid = false;
  } else if (formData.password.trim().length < 6) {
    formErrors.password = '密码长度至少为6个字符';
    isValid = false;
  }

  // 验证登录方式选择
  if (formData.loginType === null) {
    errorMessage.value = '请选择登录方式';
    isValid = false;
  }

  return isValid;
};

const clearErrors = () => {
  formErrors.account = '';
  formErrors.password = '';
  errorMessage.value = '';
};

const selectLoginType = (type: LoginType) => {
  formData.loginType = type;
  clearErrors();
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const loginData = {
      account: formData.account.trim(),
      password: formData.password.trim(),
      loginType: formData.loginType,
    };
    console.log('登录请求数据:', { ...loginData, password: '***' });
    const response = await authApi.login(loginData);
    console.log('登录响应:', response);

    // 处理登录成功 - 后端成功码为ResponseCode.SUCCESS(1)
    // response现在直接是后端的ApiResponse对象（通过axios拦截器提取）
    if (response.code === ResponseCode.SUCCESS && response.data) {
      console.log('登录成功，存储token:', response.data.token);
      authStore.loginSuccess(response);

      // 登录成功，跳转到测试页面（管理员仪表盘）
      try {
        await router.push({ name: 'admin' });
        console.log('路由跳转成功');
      } catch (routerError) {
        console.error('路由跳转错误:', routerError);
        errorMessage.value = '跳转失败，请刷新页面重试';
      }
    } else {
      // 处理业务逻辑错误
      console.log('登录业务逻辑错误:', response.message);
      errorMessage.value = response.message || '登录失败，请检查账号密码';
    }
  } catch (error: unknown) {
    // 处理网络错误或服务器错误
    console.error('登录错误详情:', error);
    const requestError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    console.error('登录错误响应:', requestError.response);

    if (requestError.response?.data?.message) {
      errorMessage.value = requestError.response.data.message;
    } else if (requestError.message?.includes('Network Error')) {
      errorMessage.value = '网络连接失败，请检查网络设置';
    } else {
      errorMessage.value = '登录失败，请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
};

// 监听表单变化，清除错误
watch(
  () => [formData.account, formData.password, formData.loginType],
  () => {
    clearErrors();
  }
);
</script>

<style scoped>
/* 样式重构 */
.login-wrapper {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* 顶部导航 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 4rem;
  z-index: 10;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-shield {
  background: #3b82f6;
  color: white;
  width: 40px;  /* 添加固定宽度 */
  height: 40px; /* 添加固定高度 */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 22px;
}

.system-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 5;
}

.content-container {
  display: flex;
  width: 100%;
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 左侧海报区 */
.visual-panel {
  flex: 1;
  padding: 1.5rem;
  display: block;
}

.image-box {
  position: relative;
  height: 100%;
  min-height: 500px;
  border-radius: 24px;
  overflow: hidden;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent);
  display: flex;
  align-items: flex-end;
  padding: 3rem;
}

.overlay-text h2 {
  color: white;
  font-size: 2.25rem;
  line-height: 1.1;
  margin: 1rem 0;
}

.overlay-text p {
  color: rgba(255, 255, 255, 0.7);
  max-width: 320px;
}

.badge {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 右侧表单区 */
.form-panel {
  flex: 1;
  padding: 3rem;
  display: flex;
  align-items: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.card-header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.card-header p {
  color: #64748b;
  margin-bottom: 2.5rem;
}

/* 表单元素 */
.form-item {
  margin-bottom: 1.5rem;
}

.item-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.login-type-tags {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.login-type-tag {
  border: 1px solid #dbe6f3;
  background: #f8fbff;
  color: #334155;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-type-tag:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.login-type-tag.is-active {
  border-color: #3b82f6;
  background: #dbeafe;
  color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.main-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.main-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1; /* 确保图标在输入框上方 */
}

.toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.toggle-icon {
  font-size: 18px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  margin-top: 1rem;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.submit-btn.is-loading {
  opacity: 0.8;
  background: #60a5fa;
  cursor: wait;
}

/* 背景网格 */
.grid-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.5;
  mask-image: radial-gradient(ellipse at center, black, transparent 80%);
}

/* 响应式 */
@media (max-width: 900px) {
  .visual-panel { display: none; }
  .page-header { padding: 1.5rem; }
  .content-container { background: transparent; box-shadow: none; border: none; }
}

/* 错误提示动画 */
.error-msg {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

/* 修改后 */
.has-error .main-input,
.has-error .main-input {
  border-color: #ef4444 !important;
  background-color: #fffafb;
}
.alert-box {
  margin-top: 1.5rem;
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  color: #b91c1c;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>