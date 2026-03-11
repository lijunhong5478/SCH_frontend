export type ConsultationRole = 'doctor' | 'resident'

export type ConsultationSenderType = 0 | 1

export type ConsultationMessageType = 0 | 1 | 2

export type ConsultationStatus = 0 | 1

export interface ConsultationMessage {
  id: number
  sessionId: number
  senderType: ConsultationSenderType
  senderId: number
  senderName?: string
  messageType: ConsultationMessageType
  content: string
  duration?: number
  isRead?: number
  createTime: string
}

export interface ConsultationSession {
  id: number
  residentId: number
  residentName?: string
  doctorId: number
  doctorName?: string
  status: ConsultationStatus
  createTime: string
  messages?: ConsultationMessage[]
}

export interface ConsultationQueryDTO {
  userId?: number
  userType?: ConsultationSenderType
  status?: ConsultationStatus
  pageNum?: number
  pageSize?: number
}

export interface StartConsultationDTO {
  residentId: number
  doctorId: number
}

export interface SendMessageDTO {
  sessionId: number
  senderType: ConsultationSenderType
  senderId: number
  messageType: ConsultationMessageType
  content: string
  duration?: number
}

export interface SendImageMessageDTO {
  sessionId: number
  imageUrl: string
}

export interface MarkSessionReadDTO {
  sessionId: number
  lastReadMessageId: number
}

export interface DeliveryAckDTO {
  sessionId: number
  messageId: number
}

export interface ConsultationUnread {
  sessionId: number
  unreadCount: number
}

export interface ConsultationSyncState {
  sessionId: number
  sessionStatus: ConsultationStatus
  peerId: number
  peerName?: string
  lastMessageId?: number
  lastMessageType?: ConsultationMessageType
  lastMessageContent?: string
  lastMessageTime?: string
  unreadCount: number
}

export interface ConsultationSocketMessage {
  type: string
  messageId?: number
  sessionId?: number
  senderType?: ConsultationSenderType
  senderId?: number
  messageType?: ConsultationMessageType
  content?: string
  timestamp?: string
}
