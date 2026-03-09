export interface DoctorHealthRecordQuery {
  realName?: string
  phone?: string
  idCard?: string
  pageNum?: number
  pageSize?: number
}

export interface DiagnosisReport {
  id: number
  visitId: number
  diagnosisResult: string
  diagnosisDetail: string
  createTime: string
  isDeleted: number
  healthRecordId: number
}

export interface ExaminationReport {
  id: number
  visitId: number
  reportType: number
  reportContent: string
  isDeleted: number
  createTime: string
  recordId: number
}

export interface PhysicalExamRecord {
  id: number
  height: number
  weight: number
  systolicBp: number
  diastolicBp: number
  heartRate: number
  bloodSugar: number
  bmi: number
  examTime: string
  isDeleted: number
  createTime: string
  recordId: number
}

export interface ResidentMedicalHistory {
  id: number
  recordId: number
  chronicDisease: string
  pastMedicalHistory: string
  allergyHistory: string
  familyHistory: string
  surgeryHistory: string
  createTime: string
  updateTime: string
  isDeleted: number
}

export interface DoctorHealthRecord {
  id: number
  residentId: number
  title: string
  updateTime: string
  isDeleted: number
  createTime: string
  avatarUrl: string
  name: string
  age: number
  gender: 0 | 1
  idCard: string
  phone: string
  address: string
  contact: string
  diagnosisReports?: DiagnosisReport[]
  examinationReports?: ExaminationReport[]
  physicalExamRecords?: PhysicalExamRecord[]
  residentMedicalHistories?: ResidentMedicalHistory[]
}

export const residentGenderTextMap: Record<0 | 1, string> = {
  0: '女',
  1: '男',
}
