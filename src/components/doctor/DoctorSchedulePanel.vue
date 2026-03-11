<template>
  <section v-loading="loading" class="doctor-schedule-panel">
    <header class="schedule-header">
      <div>
        <h3>日程安排</h3>
        <p>管理您的周工作排班、门诊计划及其他日程事项。</p>
      </div>
      <el-button class="search-btn" plain>
        <el-icon><Search /></el-icon>
        查找患者
      </el-button>
    </header>

    <article class="schedule-board">
      <div class="week-toolbar">
        <strong>{{ weekRangeText }}</strong>
      </div>

      <div class="schedule-grid">
        <div class="corner-cell">时段</div>
        <div
          v-for="day in weekDays"
          :key="`head-${day.weekDay}`"
          class="head-cell"
          :class="{ sunday: day.weekDay === 7 }"
        >
          {{ day.label }}
        </div>

        <template v-for="slot in timeSlots" :key="slot.key">
          <div class="time-cell">
            <div>{{ slot.label }}</div>
            <small>{{ slot.time }}</small>
          </div>

          <div
            v-for="day in weekDays"
            :key="`${slot.key}-${day.weekDay}`"
            class="slot-cell"
          >
            <div
              v-if="cellSchedule(day.weekDay, slot.key)"
              class="schedule-card"
              :class="{ stopped: cellSchedule(day.weekDay, slot.key)?.status !== 1 }"
            >
              <p class="card-title">
                {{ departmentName || '门诊' }} · {{ slot.label }}
              </p>
              <p class="card-meta">医生：{{ doctorName || '医生' }}</p>
              <p class="card-meta">
                余量：{{ remainingCount(cellSchedule(day.weekDay, slot.key)!) }}
                <span class="status-tag">{{ statusText(cellSchedule(day.weekDay, slot.key)!.status) }}</span>
              </p>
            </div>
          </div>
        </template>
      </div>

      <footer class="schedule-footnote">
        <span>* 蓝色区块代表已排班时段，点击单元格可拓展为详情维护。</span>
        <span>最近更新时间：{{ latestUpdateTime }}</span>
      </footer>
    </article>

    <section class="summary-row">
      <article class="summary-card primary">
        <p>本周待诊人数</p>
        <strong>{{ weeklyPendingCount }}</strong>
        <small>基于当前排班余量计算</small>
      </article>

      <article class="summary-card">
        <p>温馨提示</p>
        <strong class="tip-title">请在开诊前 15 分钟到达诊室</strong>
        <small>并检查 HIS 系统连接是否正常。</small>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from '@element-plus/icons-vue'
import type { DoctorSchedule } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'
import { useDoctorScheduleStore } from '@/stores/doctor-schedule.store'

const authStore = useAuthStore()
const doctorScheduleStore = useDoctorScheduleStore()
const { scheduleList, loading, doctorName, departmentName } = storeToRefs(doctorScheduleStore)

type GridSlot = 'AM' | 'PM'

const timeSlots: Array<{ key: GridSlot; label: string; time: string }> = [
  { key: 'AM', label: '上午', time: '08:30 - 12:00' },
  { key: 'PM', label: '下午', time: '13:00 - 17:30' },
]

const now = new Date()
const weekStart = computed(() => {
  const d = new Date(now)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(weekStart.value)
    d.setDate(weekStart.value.getDate() + idx)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const weekDay = idx + 1
    const weekLabel = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][idx]
    return {
      weekDay,
      label: `${weekLabel} (${m}.${day})`,
    }
  })
})

const weekRangeText = computed(() => {
  const start = weekDays.value[0]?.label.split('(')[1]?.replace(')', '') || ''
  const end = weekDays.value[6]?.label.split('(')[1]?.replace(')', '') || ''
  return `${now.getFullYear()}年 ${start} - ${end}`
})

const latestUpdateTime = computed(() => {
  const latest = [...scheduleList.value]
    .map((item) => new Date(item.createTime).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0]

  if (!latest) {
    return '-'
  }

  const date = new Date(latest)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
})

const weeklyPendingCount = computed(() => {
  return scheduleList.value
    .filter((item) => item.status === 1)
    .reduce((total, item) => total + remainingCount(item), 0)
})

const cellSchedule = (weekDay: number, slot: GridSlot) => {
  return scheduleList.value.find((item) => item.weekDay === weekDay && item.timeSlot === slot) || null
}

const statusText = (status: number) => (status === 1 ? '正常' : '停诊')

const remainingCount = (item: DoctorSchedule) => {
  return Math.max(0, Number(item.maxNumber || 0) - Number(item.currentNumber || 0))
}

onMounted(async () => {
  const doctorAccountId = authStore.user?.id
  if (!doctorAccountId) {
    return
  }
  await doctorScheduleStore.getDoctorSchedule(doctorAccountId)
})
</script>

<style scoped>
.doctor-schedule-panel {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  background: #f3f6fb;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.schedule-header h3 {
  margin: 0;
  font-size: 34px;
  color: #0f172a;
}

.schedule-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.search-btn {
  border-color: #e2e8f0;
  color: #334155;
}

.schedule-board {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.week-toolbar {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
}

.schedule-grid {
  display: grid;
  grid-template-columns: 98px repeat(7, minmax(120px, 1fr));
}

.corner-cell,
.head-cell,
.time-cell,
.slot-cell {
  border-right: 1px solid #edf2f7;
  border-bottom: 1px solid #edf2f7;
  min-height: 96px;
  padding: 10px;
}

.corner-cell {
  min-height: 52px;
  color: #64748b;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.head-cell {
  min-height: 52px;
  color: #334155;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.head-cell.sunday {
  color: #dc2626;
}

.time-cell {
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
}

.time-cell small {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-weight: 500;
}

.slot-cell {
  background: #fff;
}

.schedule-card {
  border: 1px solid #93c5fd;
  background: #eaf3ff;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.schedule-card.stopped {
  border-color: #fecaca;
  background: #fff1f2;
}

.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1d4ed8;
}

.card-meta {
  margin: 0;
  font-size: 12px;
  color: #334155;
}

.status-tag {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
}

.schedule-footnote {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 12px;
}

.summary-row {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 4px;
}

.summary-card p {
  margin: 0;
  color: #334155;
  font-weight: 700;
}

.summary-card strong {
  font-size: 34px;
  color: #2563eb;
}

.summary-card small {
  color: #64748b;
}

.summary-card .tip-title {
  color: #0f172a;
  font-size: 15px;
}

.summary-card.primary {
  background: linear-gradient(120deg, #e8f0ff, #f7fbff 65%);
}

@media (max-width: 1100px) {
  .schedule-grid {
    overflow-x: auto;
    display: grid;
    grid-template-columns: 98px repeat(7, 150px);
  }

  .schedule-footnote {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 780px) {
  .doctor-schedule-panel {
    padding: 12px;
  }

  .schedule-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-row {
    grid-template-columns: 1fr;
  }
}
</style>
