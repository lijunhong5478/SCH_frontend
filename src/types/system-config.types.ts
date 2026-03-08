/**
 * 系统配置相关类型定义
 */

/** 系统配置项 */
export interface SystemConfig {
  /** 主键ID */
  id: number
  /** 配置键 */
  configKey: string
  /** 配置值 */
  configValue: string
  /** 配置说明 */
  description: string
  /** 更新时间 */
  updateTime: string
}

/** 更新系统配置 DTO */
export interface UpdateSystemConfigDTO {
  /** 主键ID */
  id: number
  /** 配置键 */
  configKey: string
  /** 配置值 */
  configValue: string
  /** 配置说明 */
  description: string
  /** 更新时间 */
  updateTime?: string
}
