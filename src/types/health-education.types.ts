/**
 * 健康宣教相关类型定义
 */

/** 宣教类型常量 */
export const HealthTipType = {
  /** 政策解读 */
  POLICY: 0,
  /** 科普宣教 */
  SCIENCE: 1,
} as const

export type HealthTipType = (typeof HealthTipType)[keyof typeof HealthTipType]

/** 健康宣教项目 */
export interface HealthTip {
  /** 宣教ID */
  id: number
  /** 宣教类型 0-政策 1-科普 */
  type: HealthTipType
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 发布者ID */
  publisherId: number
  /** 发布者姓名 */
  publisherName: string
  /** 发布时间 */
  publishTime: string
  /** 背景图片 */
  backgroundImage?: string
}

/** 健康宣教详情 VO */
export interface HealthTipVO {
  /** 宣教ID */
  id: number
  /** 宣教类型 0-政策 1-科普 */
  type: HealthTipType
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 发布者ID */
  publisherId: number
  /** 发布者姓名 */
  publisherName: string
  /** 发布时间 */
  publishTime: string
}

/** 发布健康宣教 DTO */
export interface PublishHealthTipDTO {
  /** 宣教ID（编辑时传入） */
  id?: number
  /** 宣教类型 0-政策 1-科普 */
  type: HealthTipType
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 背景图片 */
  backgroundImage?: string
  /** 发布者ID */
  publisherId?: number
  /** 发布时间 */
  publishTime?: string
  /** 是否删除 */
  isDeleted?: number
}

/** 健康宣教分页查询参数 */
export interface HealthTipQuery {
  /** 页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 标题（模糊查询） */
  title?: string
  /** 宣教类型 0-政策 1-科普 */
  type?: HealthTipType
  /** 开始发布时间 */
  startTime?: string
  /** 结束发布时间 */
  endTime?: string
}

/** 健康宣教类型选项 */
export const healthTipTypeOptions = [
  { label: '全部类型', value: undefined },
  { label: '政策解读', value: HealthTipType.POLICY },
  { label: '科普宣教', value: HealthTipType.SCIENCE },
]

/** 获取宣教类型标签 */
export function getHealthTipTypeLabel(type: HealthTipType): string {
  return type === HealthTipType.POLICY ? '政策解读' : '科普宣教'
}

/** 获取宣教类型样式类名 */
export function getHealthTipTypeClass(type: HealthTipType): string {
  return type === HealthTipType.POLICY ? 'type-policy' : 'type-science'
}
