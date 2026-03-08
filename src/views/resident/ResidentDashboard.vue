<template>
  <div class="resident-dashboard">
    <!-- 页面头部 -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">居民健康中心</h1>
        <p class="dashboard-subtitle">您的健康，我们的责任</p>
      </div>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            <span class="avatar-placeholder">👤</span>
          </div>
          <div class="user-details">
            <span class="user-name">居民 {{ user?.username }}</span>
            <span class="user-id">ID: R{{ user?.id?.toString().padStart(6, '0') || '000000' }}</span>
          </div>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="dashboard-main">
      <!-- 健康概览 -->
      <div class="health-overview">
        <h2 class="section-title">健康概览</h2>
        <div class="health-cards">
          <div class="health-card">
            <div class="health-icon">❤️</div>
            <div class="health-content">
              <h3 class="health-title">心率</h3>
              <p class="health-value">72 BPM</p>
              <p class="health-status normal">正常</p>
            </div>
          </div>

          <div class="health-card">
            <div class="health-icon">🌡️</div>
            <div class="health-content">
              <h3 class="health-title">体温</h3>
              <p class="health-value">36.5°C</p>
              <p class="health-status normal">正常</p>
            </div>
          </div>

          <div class="health-card">
            <div class="health-icon">🩸</div>
            <div class="health-content">
              <h3 class="health-title">血压</h3>
              <p class="health-value">120/80 mmHg</p>
              <p class="health-status normal">正常</p>
            </div>
          </div>

          <div class="health-card">
            <div class="health-icon">⚖️</div>
            <div class="health-content">
              <h3 class="health-title">体重</h3>
              <p class="health-value">68 kg</p>
              <p class="health-status attention">建议关注</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 服务入口 -->
      <div class="services-section">
        <h2 class="section-title">医疗服务</h2>
        <div class="services-grid">
          <div class="service-card" @click="navigateTo('appointment')">
            <div class="service-icon">📅</div>
            <h3 class="service-title">在线预约</h3>
            <p class="service-desc">预约医生门诊时间</p>
            <span class="service-badge popular">热门</span>
          </div>

          <div class="service-card" @click="navigateTo('medical-records')">
            <div class="service-icon">📋</div>
            <h3 class="service-title">健康档案</h3>
            <p class="service-desc">查看个人健康记录</p>
          </div>

          <div class="service-card" @click="navigateTo('online-consultation')">
            <div class="service-icon">💬</div>
            <h3 class="service-title">在线咨询</h3>
            <p class="service-desc">与医生在线交流</p>
          </div>

          <div class="service-card" @click="navigateTo('medication')">
            <div class="service-icon">💊</div>
            <h3 class="service-title">用药提醒</h3>
            <p class="service-desc">设置和管理用药提醒</p>
          </div>

          <div class="service-card" @click="navigateTo('health-education')">
            <div class="service-icon">📚</div>
            <h3 class="service-title">健康教育</h3>
            <p class="service-desc">学习健康知识和预防</p>
          </div>

          <div class="service-card" @click="navigateTo('emergency-contact')">
            <div class="service-icon">🚨</div>
            <h3 class="service-title">紧急联系</h3>
            <p class="service-desc">紧急医疗联系方式</p>
          </div>
        </div>
      </div>

      <!-- 近期活动 -->
      <div class="recent-activities">
        <h2 class="section-title">近期活动</h2>
        <div class="activities-list">
          <div class="activity-item">
            <div class="activity-icon">🏥</div>
            <div class="activity-content">
              <h3 class="activity-title">门诊复诊完成</h3>
              <p class="activity-desc">李医生 - 内科门诊</p>
              <p class="activity-time">今天 10:30 AM</p>
            </div>
            <span class="activity-status completed">已完成</span>
          </div>

          <div class="activity-item">
            <div class="activity-icon">💊</div>
            <div class="activity-content">
              <h3 class="activity-title">处方领取</h3>
              <p class="activity-desc">降压药处方已领取</p>
              <p class="activity-time">昨天 15:20 PM</p>
            </div>
            <span class="activity-status completed">已完成</span>
          </div>

          <div class="activity-item">
            <div class="activity-icon">📅</div>
            <div class="activity-content">
              <h3 class="activity-title">预约提醒</h3>
              <p class="activity-desc">下周二的体检预约</p>
              <p class="activity-time">3天后 9:00 AM</p>
            </div>
            <span class="activity-status upcoming">即将开始</span>
          </div>
        </div>
      </div>

      <!-- 健康贴士 -->
      <div class="health-tips">
        <h2 class="section-title">今日健康贴士</h2>
        <div class="tip-content">
          <div class="tip-icon">💡</div>
          <div class="tip-text">
            <h3>春季健康提醒</h3>
            <p>春季是呼吸道疾病高发季节，请注意保持室内通风，适当增加户外活动，保持充足睡眠，增强身体抵抗力。如有不适，请及时就医。</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="dashboard-footer">
      <div class="footer-content">
        <p class="footer-title">社区医疗服务系统</p>
        <p class="footer-subtitle">为您的健康保驾护航</p>
        <div class="footer-links">
          <a href="#" class="footer-link">健康知识</a>
          <a href="#" class="footer-link">医生团队</a>
          <a href="#" class="footer-link">联系我们</a>
          <a href="#" class="footer-link">关于我们</a>
        </div>
        <p class="footer-copyright">© 2024 社区医疗服务系统 版权所有</p>
      </div>
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

const navigateTo = (service: string) => {
  console.log(`访问服务: ${service}`);
  alert(`服务开发中: ${service}`);
};
</script>

<style scoped>
.resident-dashboard {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  font-size: 24px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.user-id {
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

.health-overview {
  margin-bottom: 40px;
}

.health-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.health-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.health-card:hover {
  transform: translateY(-5px);
}

.health-icon {
  font-size: 40px;
}

.health-content .health-title {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.health-value {
  font-size: 24px;
  font-weight: 600;
  color: #1E88E5;
  margin: 0 0 5px;
}

.health-status {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.health-status.normal {
  background: #d4edda;
  color: #155724;
}

.health-status.attention {
  background: #fff3cd;
  color: #856404;
}

.services-section {
  margin-bottom: 40px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.service-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
  position: relative;
}

.service-card:hover {
  transform: translateY(-5px);
  border-color: #1E88E5;
  box-shadow: 0 8px 16px rgba(30, 136, 229, 0.2);
}

.service-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #1E88E5;
}

.service-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.service-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.service-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.service-badge.popular {
  background: #ffebee;
  color: #c62828;
}

.recent-activities {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1E88E5;
}

.activity-icon {
  font-size: 24px;
  margin-right: 15px;
  color: #1E88E5;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 5px;
}

.activity-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px;
}

.activity-time {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.activity-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.activity-status.completed {
  background: #d4edda;
  color: #155724;
}

.activity-status.upcoming {
  background: #cce5ff;
  color: #004085;
}

.health-tips {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.tip-icon {
  font-size: 48px;
  color: #1E88E5;
}

.tip-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.tip-text p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.dashboard-footer {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.footer-content .footer-title {
  font-size: 20px;
  font-weight: 600;
  color: #1E88E5;
  margin: 0 0 10px;
}

.footer-subtitle {
  color: #666;
  margin: 0 0 20px;
  font-size: 14px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.footer-link {
  color: #1E88E5;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.footer-copyright {
  color: #999;
  font-size: 12px;
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    gap: 10px;
  }

  .health-cards,
  .services-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .activity-status {
    align-self: flex-end;
  }

  .tip-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .footer-links {
    flex-wrap: wrap;
  }
}
</style>