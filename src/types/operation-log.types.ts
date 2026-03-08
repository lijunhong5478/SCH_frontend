/**
 * 操作日志相关类型定义
 */

/** 操作日志项 */
export interface OperationLog {
  /** 日志ID */
  id: number
  /** 操作用户ID */
  userId: number
  /** 用户名 */
  userName: string
  /** 角色类型 0-管理员 1-医生 2-社区居民 */
  roleType: number
  /** 方法名 */
  methodName: string
  /** 模块名（操作描述） */
  moduleName: string
  /** 创建时间 */
  createTime: string
}

/** 操作日志分页查询参数 */
export interface OperationLogQuery {
  /** 页码 */
  pageNum?: number
  /** 每页大小 */
  pageSize?: number
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
}

/** 角色类型映射 */
export const RoleTypeMap: Record<number, string> = {
  0: '管理员',
  1: '医生',
  2: '社区居民',
}

/** 获取角色类型标签 */
export function getRoleTypeLabel(roleType: number): string {
  return RoleTypeMap[roleType] || '未知'
}

/** 获取角色类型标签样式 */
export function getRoleTypeTagType(roleType: number): string {
  switch (roleType) {
    case 0:
      return 'danger'
    case 1:
      return 'success'
    case 2:
      return 'primary'
    default:
      return 'info'
  }
}
