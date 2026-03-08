import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from '@/api/admin.api';
import {
  ResponseCode,
  type AppointmentTrendPoint,
  type GraphDataVO,
  type RealtimeAppointmentStats,
  type UserRole,
} from '@/types/api.types';
import AppointmentWebSocket, { type WebSocketSidPrefix } from '@/utils/appointment.websocket';

type AppointmentStatsPayload = {
  waiting?: number;
  inVisit?: number;
  inProgress?: number;
  completed?: number;
  pending?: number;
  ongoing?: number;
  processing?: number;
  done?: number;
  finished?: number;
  trend?: AppointmentTrendPoint[];
  appointmentTrend?: AppointmentTrendPoint[];
  appointmentData?: AppointmentTrendPoint[];
  [key: string]: unknown;
};

const defaultRealtimeStats: RealtimeAppointmentStats = {
  waiting: 0,
  inProgress: 0,
  completed: 0,
};

function readNumber(payload: AppointmentStatsPayload, keys: string[]): number {
  for (const key of keys) {
    const rawValue = payload[key];
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return rawValue;
    }
  }

  return 0;
}

function readTrend(payload: AppointmentStatsPayload): AppointmentTrendPoint[] {
  const candidates = [payload.trend, payload.appointmentTrend, payload.appointmentData];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const normalized = candidate.filter((item): item is AppointmentTrendPoint => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as AppointmentTrendPoint).date === 'string' &&
        typeof (item as AppointmentTrendPoint).count === 'number'
      );
    });

    if (normalized.length > 0) {
      return [...normalized].reverse();
    }
  }

  return [];
}

function normalizeStatsPayload(payload: unknown): {
  realtimeStats: RealtimeAppointmentStats;
  trend: AppointmentTrendPoint[];
} {
  if (typeof payload !== 'object' || payload === null) {
    return {
      realtimeStats: { ...defaultRealtimeStats },
      trend: [],
    };
  }

  const normalizedPayload = payload as AppointmentStatsPayload;

  return {
    realtimeStats: {
      waiting: readNumber(normalizedPayload, ['waiting', 'pending', '等待中']),
      inProgress: readNumber(normalizedPayload, ['inVisit', 'inProgress', 'ongoing', 'processing', '就诊中']),
      completed: readNumber(normalizedPayload, ['completed', 'done', 'finished', '已完成']),
    },
    trend: readTrend(normalizedPayload),
  };
}

function mapRoleToSidPrefix(role: UserRole): WebSocketSidPrefix {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'doctor':
      return 'doctor';
    case 'resident':
      return 'resident';
    default:
      return 'admin';
  }
}

export const useVisualizationStore = defineStore('visualization', () => {
  const doctorDeptData = ref<GraphDataVO[]>([]);
  const userAgeData = ref<GraphDataVO[]>([]);
  const appointmentData = ref<AppointmentTrendPoint[]>([]);
  const realtimeAppointmentStats = ref<RealtimeAppointmentStats>({ ...defaultRealtimeStats });
  const socketConnected = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let appointmentSocket: AppointmentWebSocket | null = null;

  /**
   * 异步获取各科室医生分布数据
   */
  async function fetchDoctorDeptStats() {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminApi.getDoctorDeptStats();
      if (response.code === ResponseCode.SUCCESS) {
        doctorDeptData.value = response.data;
      } else {
        error.value = response.message || '获取医生科室分布数据失败';
      }
    } catch (err: unknown) {
      error.value = (err as Error).message || '网络请求错误';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 异步获取用户年龄分布数据
   */
  async function fetchUserAgeStats() {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminApi.getUserAgeStats();
      if (response.code === ResponseCode.SUCCESS) {
        userAgeData.value = response.data;
      } else {
        error.value = response.message || '获取用户年龄分布数据失败';
      }
    } catch (err: unknown) {
      error.value = (err as Error).message || '网络请求错误';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 异步获取预约挂号统计数据
   */
  async function fetchAppointmentStats() {
    loading.value = true;
    error.value = null;
    try {
      const response = await adminApi.getAppointmentStats();
      if (response.code === ResponseCode.SUCCESS) {
        // 后端返回的数据可能是倒序的，这里反转一下让折线图从左往右展示日期
        appointmentData.value = Array.isArray(response.data) ? [...response.data].reverse() : [];
      } else {
        error.value = response.message || '获取预约挂号统计失败';
      }
    } catch (err: unknown) {
      error.value = (err as Error).message || '网络请求错误';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取今日预约状态统计（等待中/就诊中/已完成）
   */
  async function fetchTodayAppointmentStats() {
    error.value = null;
    try {
      const response = await adminApi.getTodayAppointmentStats();
      if (response.code === ResponseCode.SUCCESS && response.data) {
        realtimeAppointmentStats.value = {
          waiting: response.data.waiting ?? 0,
          inProgress: response.data.inVisit ?? 0,
          completed: response.data.finished ?? 0,
        };
      } else {
        error.value = response.message || '获取今日预约状态统计失败';
      }
    } catch (err: unknown) {
      error.value = (err as Error).message || '网络请求错误';
    }
  }

  function connectAppointmentSocket(userId: number, role: UserRole = 'admin', token?: string | null) {
    if (!Number.isFinite(userId) || userId <= 0) {
      return;
    }

    disconnectAppointmentSocket();

    const sidPrefix = mapRoleToSidPrefix(role);
    appointmentSocket = new AppointmentWebSocket(userId, sidPrefix, token);

    appointmentSocket.on('connected', () => {
      socketConnected.value = true;
    });

    appointmentSocket.on('disconnected', () => {
      socketConnected.value = false;
    });

    appointmentSocket.on('error', () => {
      socketConnected.value = false;
    });

    appointmentSocket.on('statsUpdate', (payload) => {
      const normalized = normalizeStatsPayload(payload);
      const prevTotal =
        realtimeAppointmentStats.value.waiting +
        realtimeAppointmentStats.value.inProgress +
        realtimeAppointmentStats.value.completed;

      realtimeAppointmentStats.value = normalized.realtimeStats;

      if (normalized.trend.length > 0) {
        appointmentData.value = normalized.trend;
      }

      // 实时刷新折线图中今天的预约量：用最新的 waiting+inVisit+finished 总和更新今日数据点
      const newTotal =
        normalized.realtimeStats.waiting +
        normalized.realtimeStats.inProgress +
        normalized.realtimeStats.completed;

      if (newTotal !== prevTotal && appointmentData.value.length > 0) {
        const lastIndex = appointmentData.value.length - 1;
        const lastPoint = appointmentData.value[lastIndex] as AppointmentTrendPoint | undefined;
        if (lastPoint) {
          const delta = newTotal - prevTotal;
          appointmentData.value = [
            ...appointmentData.value.slice(0, lastIndex),
            { date: lastPoint.date, count: lastPoint.count + delta },
          ];
        }
      }
    });

    appointmentSocket.connect();
  }

  function disconnectAppointmentSocket() {
    if (!appointmentSocket) {
      return;
    }

    appointmentSocket.disconnect();
    appointmentSocket = null;
    socketConnected.value = false;
  }

  return {
    doctorDeptData,
    userAgeData,
    appointmentData,
    realtimeAppointmentStats,
    socketConnected,
    loading,
    error,
    fetchDoctorDeptStats,
    fetchUserAgeStats,
    fetchAppointmentStats,
    fetchTodayAppointmentStats,
    connectAppointmentSocket,
    disconnectAppointmentSocket,
  };
});
