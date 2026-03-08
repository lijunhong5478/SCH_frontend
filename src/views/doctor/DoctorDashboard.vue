<template>
  <div class="doctor-dashboard">
    <!-- 页面头部 -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">医生工作台</h1>
        <p class="dashboard-subtitle">专业医疗服务平台</p>
      </div>
      <div class="header-right">
        <div class="doctor-info">
          <div class="avatar-placeholder">👨‍⚕️</div>
          <div class="doctor-details">
            <span class="doctor-name">医生 {{ user?.username }}</span>
            <span class="doctor-id">工号: D{{ user?.id?.toString().padStart(4, '0') || '0000' }}</span>
          </div>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="dashboard-main">
      <!-- 今日工作概览 -->
      <div class="overview-section">
        <h2 class="section-title">今日工作概览</h2>
        <div class="overview-cards">
          <div class="overview-card">
            <div class="overview-icon">⏰</div>
            <div class="overview-content">
              <h3 class="overview-title">待接诊</h3>
              <p class="overview-value">8 人</p>
              <p class="overview-time">预计时间: 2.5小时</p>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon">✅</div>
            <div class="overview-content">
              <h3 class="overview-title">已完成</h3>
              <p class="overview-value">12 人</p>
              <p class="overview-time">今日已完成</p>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon">📋</div>
            <div class="overview-content">
              <h3 class="overview-title">待写病历</h3>
              <p class="overview-value">5 份</p>
              <p class="overview-time">需要完成</p>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon">💊</div>
            <div class="overview-content">
              <h3 class="overview-title">处方待发</h3>
              <p class="overview-value">3 份</p>
              <p class="overview-time">等待处理</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="function-section">
        <h2 class="section-title">常用功能</h2>
        <div class="function-grid">
          <div class="function-card" @click="navigateTo('appointment-list')">
            <div class="function-icon">📅</div>
            <h3 class="function-title">预约管理</h3>
            <p class="function-desc">查看和管理患者预约</p>
          </div>

          <div class="function-card" @click="navigateTo('patient-records')">
            <div class="function-icon">📋</div>
            <h3 class="function-title">病历管理</h3>
            <p class="function-desc">患者病历查看和编辑</p>
          </div>

          <div class="function-card" @click="navigateTo('prescription')">
            <div class="function-icon">💊</div>
            <h3 class="function-title">开处方</h3>
            <p class="function-desc">为患者开具电子处方</p>
          </div>

          <div class="function-card" @click="navigateTo('medical-advice')">
            <div class="function-icon">💡</div>
            <h3 class="function-title">医疗建议</h3>
            <p class="function-desc">给患者提供医疗建议</p>
          </div>

          <div class="function-card" @click="navigateTo('work-schedule')">
            <div class="function-icon">🗓️</div>
            <h3 class="function-title">工作排班</h3>
            <p class="function-desc">查看和安排工作日程</p>
          </div>

          <div class="function-card" @click="navigateTo('medical-knowledge')">
            <div class="function-icon">📚</div>
            <h3 class="function-title">医学知识库</h3>
            <p class="function-desc">查阅医学资料和指南</p>
          </div>
        </div>
      </div>

      <!-- 今日待办事项 -->
      <div class="todo-section">
        <h2 class="section-title">今日待办事项</h2>
        <div class="todo-list">
          <div class="todo-item">
            <div class="todo-checkbox">
              <input type="checkbox" id="todo1" />
              <label for="todo1"></label>
            </div>
            <div class="todo-content">
              <h3 class="todo-title">完成李女士的复诊病历</h3>
              <p class="todo-time">预约时间: 10:30 AM</p>
            </div>
            <span class="todo-status pending">待处理</span>
          </div>

          <div class="todo-item">
            <div class="todo-checkbox">
              <input type="checkbox" id="todo2" />
              <label for="todo2"></label>
            </div>
            <div class="todo-content">
              <h3 class="todo-title">审核王先生的检查报告</h3>
              <p class="todo-time">截止时间: 今天下午</p>
            </div>
            <span class="todo-status in-progress">进行中</span>
          </div>

          <div class="todo-item">
            <div class="todo-checkbox">
              <input type="checkbox" id="todo3" />
              <label for="todo3"></label>
            </div>
            <div class="todo-content">
              <h3 class="todo-title">参加科室病例讨论会</h3>
              <p class="todo-time">时间: 15:00 - 16:00</p>
            </div>
            <span class="todo-status scheduled">已安排</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部导航 -->
    <footer class="dashboard-footer">
      <p>社区医疗服务系统 | 医生工作台版本 1.0</p>
      <p>如有任何问题，请联系系统管理员</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const user = computed(() => authStore.user);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const navigateTo = (page: string) => {
  console.log(`导航到: ${page}`);
  alert(`功能开发中: ${page}`);
};
</script>

<style scoped>
.doctor-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.header-left .dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1E88E5;
  margin: 0;
}

.dashboard-subtitle {
  color: #666;
  margin: 5px 0 0;
  font-size: 14px;
}

.doctor-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar-placeholder {
  width: 50px;
  height: 50px;
  background: #e3f2fd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.doctor-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.doctor-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.doctor-id {
  font-size: 14px;
  color: #666;
}

.logout-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #d32f2f;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #1E88E5;
}

.overview-section {
  margin-bottom: 40px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.overview-card:hover {
  transform: translateY(-5px);
}

.overview-icon {
  font-size: 40px;
  color: #1E88E5;
}

.overview-content .overview-title {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.overview-value {
  font-size: 28px;
  font-weight: 600;
  color: #1E88E5;
  margin: 0 0 5px;
}

.overview-time {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.function-section {
  margin-bottom: 40px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.function-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.function-card:hover {
  transform: translateY(-5px);
  border-color: #1E88E5;
  box-shadow: 0 8px 16px rgba(30, 136, 229, 0.2);
}

.function-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #1E88E5;
}

.function-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.function-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.todo-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1E88E5;
}

.todo-checkbox {
  margin-right: 15px;
}

.todo-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 5px;
}

.todo-time {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.todo-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.todo-status.pending {
  background: #fff3cd;
  color: #856404;
}

.todo-status.in-progress {
  background: #cce5ff;
  color: #004085;
}

.todo-status.scheduled {
  background: #d4edda;
  color: #155724;
}

.dashboard-footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-footer p {
  margin: 5px 0;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .doctor-info {
    flex-direction: column;
    gap: 10px;
  }

  .overview-cards,
  .function-grid {
    grid-template-columns: 1fr;
  }

  .todo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .todo-checkbox {
    margin-right: 0;
  }

  .todo-status {
    align-self: flex-end;
  }
}
</style>