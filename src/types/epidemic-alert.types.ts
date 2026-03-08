/**
 * 疫情预警相关类型定义
 */

/** 风险等级常量 */
export const RiskLevel = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

/** 疫情预警项 */
export interface EpidemicAlert {
  /** 预警ID */
  id: number
  /** 地区 */
  region: string
  /** 风险等级 */
  riskLevel: RiskLevel
  /** 预警信息 */
  message: string
  /** 发布时间 */
  publishTime: string
  /** 是否删除 */
  isDeleted?: number
}

/** 疫情预警分页查询参数 */
export interface EpidemicAlertQuery {
  /** 页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 地区（模糊查询） */
  region?: string
  /** 风险等级 */
  riskLevel?: RiskLevel
  /** 开始发布时间 */
  startTime?: string
  /** 结束发布时间 */
  endTime?: string
}

/** 发布疫情预警 DTO */
export interface PublishEpidemicAlertDTO {
  /** 预警ID（编辑时传入） */
  id?: number
  /** 地区 */
  region: string
  /** 风险等级 */
  riskLevel: RiskLevel
  /** 预警信息 */
  message: string
  /** 发布时间 */
  publishTime?: string
  /** 是否删除 */
  isDeleted?: number
}

/** 风险等级下拉选项 */
export const riskLevelOptions = [
  { label: '全部风险', value: undefined },
  { label: '低风险', value: RiskLevel.LOW },
  { label: '中风险', value: RiskLevel.MEDIUM },
  { label: '高风险', value: RiskLevel.HIGH },
]

/** 获取风险等级标签 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW:
      return '低风险'
    case RiskLevel.MEDIUM:
      return '中风险'
    case RiskLevel.HIGH:
      return '高风险'
    default:
      return '未知风险'
  }
}

/** 获取风险等级标签类型 */
export function getRiskLevelTagType(level: RiskLevel): 'success' | 'warning' | 'danger' | 'info' {
  switch (level) {
    case RiskLevel.LOW:
      return 'success'
    case RiskLevel.MEDIUM:
      return 'warning'
    case RiskLevel.HIGH:
      return 'danger'
    default:
      return 'info'
  }
}
