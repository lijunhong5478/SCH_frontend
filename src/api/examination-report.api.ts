import http from './axios.config'
import type { PageResult, Result } from '@/types/api.types'
import type { ExaminationReport } from '@/types/health-record.types'
import type { ExaminationReportQuery, SaveExaminationReportDTO } from '@/types/examination-report.types'

const API = {
  LIST: '/doctor/examinationReport/list',
  DETAIL: '/doctor/examinationReport',
  SAVE: '/doctor/examinationReport',
} as const

export const getExaminationReportListAPI = (params: ExaminationReportQuery) => {
  return http.get<Result<PageResult<ExaminationReport>>>(API.LIST, {
    params,
  }) as unknown as Promise<Result<PageResult<ExaminationReport>>>
}

export const getExaminationReportDetailAPI = (id: number) => {
  return http.get<Result<ExaminationReport>>(`${API.DETAIL}/${id}`) as unknown as Promise<Result<ExaminationReport>>
}

export const saveExaminationReportsAPI = (examinationReports: SaveExaminationReportDTO[]) => {
  return http.post<Result<string>>(API.SAVE, examinationReports) as unknown as Promise<Result<string>>
}