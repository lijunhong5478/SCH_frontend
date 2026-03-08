export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp?: number; // 后端可能不返回timestamp，设为可选
}

export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  dataList: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}

// API响应码常量（后端使用1表示成功）
export const ResponseCode = {
  SUCCESS: 1,
  // 其他错误码可根据后端定义添加
} as const;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 登录相关类型
export interface LoginDTO {
  account: string;
  password: string;
  loginType: 1 | 2 | 3; // 1=用户名，2=手机号，3=身份证
}

export interface LoginUserVO {
  avatarUrl: string;
  id: number;
  roleType: 0 | 1 | 2;
  token: string;
  username: string;
}

export interface LoginResponse extends ApiResponse<LoginUserVO> {}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse extends ApiResponse<string> {}

export interface AdminDetailVO {
  id: number;
  username: string;
  avatarUrl: string;
  phone: string;
}

export interface GraphDataVO {
  name: string;
  value: number;
}

export interface AppointmentTrendPoint {
  date: string;
  count: number;
}

export interface RealtimeAppointmentStats {
  waiting: number;
  inProgress: number;
  completed: number;
}


export interface AdminDetailResponse extends ApiResponse<AdminDetailVO> {}

export interface UpdateProfileDTO {
  id: number;
  username?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface UpdateProfileResponse extends ApiResponse<string> {}

export interface UploadFileResponse extends ApiResponse<string> {}

// 用户角色字符串类型
export type UserRole = 'admin' | 'doctor' | 'resident';

// 更新User接口以包含roleType
export interface User extends Omit<LoginUserVO, 'token' | 'roleType'> {
  role: UserRole;
}

// 登录方式枚举常量（1=用户名，2=手机号，3=身份证）
export const LoginType = {
  USERNAME: 1,
  PHONE: 2,
  ID_CARD: 3,
} as const;

export const RoleType = {
  ADMIN: 0,
  DOCTOR: 1,
  RESIDENT: 2,
} as const;

// 角色映射工具函数
export function mapRoleTypeToString(roleType: number): UserRole {
  switch (roleType) {
    case RoleType.ADMIN: return 'admin';
    case RoleType.DOCTOR: return 'doctor';
    case RoleType.RESIDENT: return 'resident';
    default: throw new Error(`Invalid role type: ${roleType}`);
  }
}

// 角色到路由前缀的映射
export function getRoleRoutePrefix(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'doctor': return '/doctor';
    case 'resident': return '/resident';
    default: throw new Error(`Invalid role: ${role}`);
  }
}

// 医生排班相关类型定义
export interface DoctorSchedule {
  id: number;
  doctorId: number;
  weekDay: number; // 1-7 代表周一到周日
  timeSlot: 'AM' | 'PM'; // 上午/下午
  maxNumber: number; // 最大叫号数
  currentNumber: number; // 当前叫号数
  status: number; // 1=正常, 0=停诊
  createTime: string;
}

export interface DoctorScheduleResponse extends ApiResponse<DoctorSchedule[]> {}

export interface UpdateDoctorScheduleDTO {
  doctorId: number;
  doctorSchedules: {
    id: number;
    doctorId: number;
    maxNumber: number;
    status: number;
  }[];
}

export interface UpdateDoctorScheduleResponse extends ApiResponse<string> {}