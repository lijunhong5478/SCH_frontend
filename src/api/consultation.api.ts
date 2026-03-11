import http from './axios.config'
import type { Result } from '@/types/api.types'
import type {
  ConsultationQueryDTO,
  ConsultationMessage,
  ConsultationRole,
  ConsultationSession,
  ConsultationSyncState,
  ConsultationUnread,
  DeliveryAckDTO,
  MarkSessionReadDTO,
  SendImageMessageDTO,
  SendMessageDTO,
  StartConsultationDTO,
} from '@/types/consultation.types'

function resolvePrefix(role: ConsultationRole): '/doctor/consultation' | '/resident/consultation' {
  return role === 'doctor' ? '/doctor/consultation' : '/resident/consultation'
}

export const listConsultationSessions = (
  role: ConsultationRole,
  params: ConsultationQueryDTO,
): Promise<Result<ConsultationSession[]>> => {
  return http.get(`${resolvePrefix(role)}/sessions`, { params })
}

export const startResidentConsultation = (payload: StartConsultationDTO): Promise<Result<number>> => {
  return http.post('/resident/consultation/session/ensure', payload)
}

export const startDoctorConsultation = (payload: StartConsultationDTO): Promise<Result<number>> => {
  return http.post('/doctor/consultation/session/ensure', payload)
}

export const sendConsultationMessage = (role: ConsultationRole, payload: SendMessageDTO): Promise<Result<string>> => {
  return http.post(`${resolvePrefix(role)}/message/text`, payload)
}

export const sendConsultationImage = (role: ConsultationRole, payload: SendImageMessageDTO): Promise<Result<string>> => {
  return http.post(`${resolvePrefix(role)}/message/image`, payload)
}

export const listConsultationMessagesAfter = (
  role: ConsultationRole,
  sessionId: number,
  params: { lastMessageId?: number; limit?: number },
): Promise<Result<ConsultationMessage[]>> => {
  return http.get(`${resolvePrefix(role)}/messages/incremental/${sessionId}`, { params })
}

export const markSessionReadUpTo = (role: ConsultationRole, payload: MarkSessionReadDTO): Promise<Result<string>> => {
  return http.put(`${resolvePrefix(role)}/messages/read-up-to`, payload)
}

export const getSessionUnreadStats = (role: ConsultationRole): Promise<Result<ConsultationUnread[]>> => {
  return http.get(`${resolvePrefix(role)}/sessions/unread`)
}

export const ackConsultationDelivered = (role: ConsultationRole, payload: DeliveryAckDTO): Promise<Result<string>> => {
  return http.post(`${resolvePrefix(role)}/messages/delivered-ack`, payload)
}

export const syncConsultationState = (role: ConsultationRole, sessionId: number): Promise<Result<ConsultationSyncState>> => {
  return http.get(`${resolvePrefix(role)}/sync/${sessionId}`)
}

export const uploadConsultationImage = (file: File): Promise<Result<string>> => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/common/file/upload', formData)
}
