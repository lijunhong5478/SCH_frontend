<template>
  <div class="visual-container">
    <div class="chart-header">
      <h4>系统可视化数据统计</h4>
    </div>

    <div class="visual-grid">
      <div v-if="loading" class="chart-box loading-box">
        <div class="loading-spinner"></div>
        <p>数据请求中，请稍候...</p>
      </div>

      <div v-else-if="error" class="chart-box error-box">
        <el-icon class="material-symbols-outlined error-icon"><WarningFilled /></el-icon>
        <p>{{ error }}</p>
        <button type="button" class="retry-btn" @click="fetchData">重新加载</button>
      </div>

      <div v-else class="chart-wrapper-grid">
        <div class="pie-charts-row">
          <div class="chart-item">
            <div class="chart-header-inline">
              <div class="header-left">
                <h5>科室医生分布</h5>
                <p>实时分析各医疗科室的医护人员配置比例。</p>
              </div>
              <div class="header-tag blue">实时分析 +2%</div>
            </div>
            <div class="chart-content-modern">
              <div ref="pieChartRef" class="chart-box-small"></div>
            </div>
            <div class="stat-footer">
              <div class="footer-icon blue">
                <el-icon class="material-symbols-outlined"><UserFilled /></el-icon>
              </div>
              <div class="footer-text">
                <span class="label">统计概览</span>
                <div class="value">医生总数：<span>{{ totalDoctors }}</span> 位</div>
              </div>
            </div>
          </div>

          <div class="chart-item">
            <div class="chart-header-inline">
              <div class="header-left">
                <h5>用户年龄分布</h5>
                <p>全面展示社区用户的年龄分层结构。</p>
              </div>
              <div class="header-tag red">年龄分层 +1%</div>
            </div>
            <div class="chart-content-modern">
              <div ref="ageChartRef" class="chart-box-small"></div>
            </div>
            <div class="stat-footer">
              <div class="footer-icon red">
                <el-icon class="material-symbols-outlined"><User /></el-icon>
              </div>
              <div class="footer-text">
                <span class="label">统计概览</span>
                <div class="value">居民总数：<span>{{ totalResidents }}</span> 人</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-item full-width-layout">
          <div class="line-chart-section">
            <div class="section-title">
              <h5>近七日预约趋势</h5>
              <span class="legend-dot">● 预约挂号量</span>
            </div>
            <div ref="lineChartRef" class="chart-box-main"></div>
          </div>

          <div class="line-chart-info">
            <div class="info-icon">
              <el-icon class="material-symbols-outlined"><TrendCharts /></el-icon>
            </div>
            <h5>预约挂号趋势统计</h5>
            <p>基于近七日的预约挂号数据，动态追踪社区医疗服务的使用频率与波动趋势，为接诊高峰提供预警。</p>

            <div class="socket-status" :class="{ online: socketConnected, offline: !socketConnected }">
              {{ socketConnected ? 'WebSocket 已连接' : 'WebSocket 连接中断' }}
            </div>

            <div class="realtime-stats-grid">
              <div class="realtime-stat-item">
                <span class="label">等待中</span>
                <span class="count">{{ realtimeAppointmentStats.waiting }}</span>
              </div>
              <div class="realtime-stat-item">
                <span class="label">就诊中</span>
                <span class="count">{{ realtimeAppointmentStats.inProgress }}</span>
              </div>
              <div class="realtime-stat-item">
                <span class="label">已完成</span>
                <span class="count">{{ realtimeAppointmentStats.completed }}</span>
              </div>
            </div>

            <div class="today-stat">
              <div class="stat-row">
                <span>今日预约量</span>
                <span class="count">{{ todayAppointmentCount }} 宗</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: completedProgressWidth }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { TrendCharts, User, UserFilled, WarningFilled } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useVisualizationStore } from '@/stores/visualization.store';

const vizStore = useVisualizationStore();
const authStore = useAuthStore();

const {
  doctorDeptData,
  userAgeData,
  appointmentData,
  realtimeAppointmentStats,
  socketConnected,
  loading,
  error,
} = storeToRefs(vizStore);

const pieChartRef = ref<HTMLElement | null>(null);
const ageChartRef = ref<HTMLElement | null>(null);
const lineChartRef = ref<HTMLElement | null>(null);

let pieChart: echarts.ECharts | null = null;
let ageChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;

const totalDoctors = computed(() => doctorDeptData.value.reduce((sum, item) => sum + item.value, 0));
const totalResidents = computed(() => userAgeData.value.reduce((sum, item) => sum + item.value, 0));

const todayAppointmentCount = computed(() => {
  if (appointmentData.value.length === 0) return 0;
  return appointmentData.value[appointmentData.value.length - 1]?.count ?? 0;
});

const completedProgressWidth = computed(() => {
  const total =
    realtimeAppointmentStats.value.waiting +
    realtimeAppointmentStats.value.inProgress +
    realtimeAppointmentStats.value.completed;

  if (total <= 0) return '0%';

  const percent = Math.round((realtimeAppointmentStats.value.completed / total) * 100);
  return `${Math.max(0, Math.min(100, percent))}%`;
});

const fetchData = async () => {
  await Promise.all([
    vizStore.fetchDoctorDeptStats(),
    vizStore.fetchUserAgeStats(),
    vizStore.fetchAppointmentStats(),
    vizStore.fetchTodayAppointmentStats(),
  ]);
};

const initPieChart = () => {
  if (!pieChartRef.value || pieChartRef.value.offsetHeight === 0) return;
  if (pieChart) pieChart.dispose();
  pieChart = echarts.init(pieChartRef.value);

  const option: echarts.EChartsOption = {
    title: {
      left: 'center',
      top: 'center',
      textStyle: {
        rich: {
          val: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', padding: [0, 0, 5, 0] },
          label: { fontSize: 12, color: '#64748b' },
        },
      },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      icon: 'circle',
      formatter: (name: string) => {
        const item = doctorDeptData.value.find((d) => d.name === name);
        const percent = totalDoctors.value > 0 ? ((item?.value || 0) / totalDoctors.value) * 100 : 0;
        return `${name} (${percent.toFixed(0)}%)`;
      },
      textStyle: { fontSize: 12, color: '#64748b' },
    },
    series: [
      {
        name: '医生科室分布',
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        data: doctorDeptData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
      },
    ],
    color: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'],
  };

  pieChart.setOption(option);
};

const initAgeChart = () => {
  if (!ageChartRef.value || ageChartRef.value.offsetHeight === 0) return;
  if (ageChart) ageChart.dispose();
  ageChart = echarts.init(ageChartRef.value);

  const option: echarts.EChartsOption = {
    title: {
      left: 'center',
      top: 'center',
      textStyle: {
        rich: {
          val: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', padding: [0, 0, 5, 0] },
          label: { fontSize: 12, color: '#64748b' },
        },
      },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      icon: 'circle',
      formatter: (name: string) => {
        const item = userAgeData.value.find((d) => d.name === name);
        const percent = totalResidents.value > 0 ? ((item?.value || 0) / totalResidents.value) * 100 : 0;
        return `${name} (${percent.toFixed(0)}%)`;
      },
      textStyle: { fontSize: 12, color: '#64748b' },
    },
    series: [
      {
        name: '年龄分布',
        type: 'pie',
        radius: [20, 110],
        center: ['40%', '50%'],
        roseType: 'area',
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        data: userAgeData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
      },
    ],
    color: ['#F97316', '#22C55E', '#0EA5E9', '#D946EF', '#6366F1', '#FBBF24', '#84CC16'],
  };

  ageChart.setOption(option);
};

const initLineChart = () => {
  if (!lineChartRef.value || lineChartRef.value.offsetHeight === 0) return;
  if (lineChart) lineChart.dispose();
  lineChart = echarts.init(lineChartRef.value);

  const dates = appointmentData.value.map((item) => item.date);
  const counts = appointmentData.value.map((item) => item.count);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#e2e8f0', width: 1 } },
    },
    grid: { left: '10px', right: '10px', bottom: '10px', top: '20px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [
      {
        name: '预约挂号量',
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: '#3b82f6' },
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.1)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' },
          ]),
        },
        data: counts,
      },
    ],
  };

  lineChart.setOption(option);
};

const handleResize = () => {
  pieChart?.resize();
  ageChart?.resize();
  lineChart?.resize();
};

const initAllCharts = async () => {
  await nextTick();
  initPieChart();
  initAgeChart();
  initLineChart();
};

onMounted(async () => {
  await fetchData();

  const userId = authStore.user?.id;
  const userRole = authStore.user?.role;
  if (typeof userId === 'number' && userId > 0 && userRole) {
    vizStore.connectAppointmentSocket(userId, userRole, authStore.token);
  }

  await initAllCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  vizStore.disconnectAppointmentSocket();
  window.removeEventListener('resize', handleResize);
  pieChart?.dispose();
  ageChart?.dispose();
  lineChart?.dispose();
});

watch([doctorDeptData, userAgeData, appointmentData], () => {
  void initAllCharts();
}, { deep: true });
</script>

<style lang="scss" scoped>
.visual-container {
  width: 100%;
  animation: rise-in 0.28s ease;
}

.chart-header {
  margin-bottom: 20px;

  h4 {
    margin: 0;
    font-size: 22px;
    color: #0f172a;
    position: relative;
    padding-left: 14px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 18px;
      background: #137fec;
      border-radius: 2px;
    }
  }
}

.visual-grid {
  display: grid;
  gap: 20px;
}

.chart-wrapper-grid {
  display: grid;
  gap: 24px;
}

.pie-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-item {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);

  &.full-width-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 32px;
    padding: 32px;
  }
}

.chart-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  .header-left {
    h5 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 6px 0;
    }

    p {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }
  }

  .header-tag {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;

    &.blue {
      background: #eff6ff;
      color: #3b82f6;
    }

    &.red {
      background: #fef2f2;
      color: #ef4444;
    }
  }
}

.chart-content-modern {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-box-small {
  height: 240px;
  width: 100%;
}

.stat-footer {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;

  .footer-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.blue {
      background: #fff;
      color: #3b82f6;
    }

    &.red {
      background: #fff;
      color: #ef4444;
    }

    .material-symbols-outlined {
      font-size: 22px;
    }
  }

  .footer-text {
    .label {
      font-size: 12px;
      color: #94a3b8;
      display: block;
      margin-bottom: 2px;
    }

    .value {
      font-size: 15px;
      font-weight: 600;
      color: #334155;

      span {
        font-size: 20px;
        color: #0f172a;
        margin-right: 2px;
      }
    }
  }
}

.line-chart-section {
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h5 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .legend-dot {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
  }
}

.chart-box-main {
  height: 340px;
  width: 100%;
}

.line-chart-info {
  display: flex;
  flex-direction: column;
  padding-left: 32px;
  border-left: 1px solid #f1f5f9;

  .info-icon {
    width: 56px;
    height: 56px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;

    .material-symbols-outlined {
      font-size: 28px;
    }
  }

  h5 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px 0;
  }

  p {
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  .socket-status {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 14px;

    &.online {
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    &.offline {
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fcd34d;
    }
  }

  .realtime-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }

  .realtime-stat-item {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
    background: #ffffff;

    .label {
      display: block;
      color: #64748b;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .count {
      color: #0f172a;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
    }
  }

  .today-stat {
    margin-top: auto;

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;

      span {
        font-size: 14px;
        color: #64748b;
      }

      .count {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }
    }

    .progress-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 999px;
      transition: width 0.3s ease;
    }
  }
}

.loading-box,
.error-box {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #137fec;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #137fec;
  color: #fff;
  border: 0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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

@media (max-width: 1280px) {
  .chart-item.full-width-layout {
    grid-template-columns: 1fr;
  }

  .line-chart-info {
    padding-left: 0;
    padding-top: 32px;
    border-left: none;
    border-top: 1px solid #f1f5f9;
  }
}

@media (max-width: 1024px) {
  .pie-charts-row {
    grid-template-columns: 1fr;
  }

  .line-chart-info .realtime-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
