export interface ExaminationReportQuery {
  createDate?: string
  healthRecordId?: number
  pageNum?: number
  pageSize?: number
  reportType?: number
}

export interface SaveExaminationReportDTO {
  createTime?: string
  id?: number
  isDeleted?: number
  recordId: number
  reportContent: string
  reportType: number
}

export const examinationReportTypeTextMap: Record<number, string> = {
  1: '血常规',
  2: '心电图',
  3: '尿常规',
  4: '血糖监测',
  5: '肝功能检查',
  6: '血压监测',
  7: '血生化检查',
  8: '生化全套',
  9: '甲状腺功能',
}

export const examinationReportTypeOptions = [
  { label: '血常规', value: 1 },
  { label: '心电图', value: 2 },
  { label: '尿常规', value: 3 },
  { label: '血糖监测', value: 4 },
  { label: '肝功能检查', value: 5 },
  { label: '血压监测', value: 6 },
  { label: '血生化检查', value: 7 },
  { label: '生化全套', value: 8 },
  { label: '甲状腺功能', value: 9 },
]