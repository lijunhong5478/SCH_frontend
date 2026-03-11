import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import {
  ackConsultationDelivered,
  getSessionUnreadStats,
  listConsultationMessagesAfter,
  listConsultationSessions,
  markSessionReadUpTo,
  sendConsultationImage,
  sendConsultationMessage,
  startDoctorConsultation,
  startResidentConsultation,
  syncConsultationState,
  uploadConsultationImage,
} from '@/api/consultation.api'
import { ResponseCode } from '@/types/api.types'
import type {
  ConsultationMessage,
  ConsultationQueryDTO,
  ConsultationRole,
  ConsultationSenderType,
  ConsultationSession,
  ConsultationSocketMessage,
} from '@/types/consultation.types'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function resolveWsBaseUrl(): string {
  const configured = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()
  if (configured) {
    if (configured.startsWith('ws://') || configured.startsWith('wss://')) {
      return trimTrailingSlash(configured)
    }

    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      const wsProtocol = configured.startsWith('https://') ? 'wss://' : 'ws://'
      return trimTrailingSlash(configured.replace(/^https?:\/\//, wsProtocol))
    }
  }

  if (import.meta.env.DEV) {
    return 'ws://localhost:8080'
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

function mapRoleToSenderType(role: ConsultationRole): ConsultationSenderType {
  return role === 'doctor' ? 1 : 0
}

function mapSocketMessage(payload: ConsultationSocketMessage): ConsultationMessage | null {
  if (!payload.sessionId || payload.senderType === undefined || payload.messageType === undefined || !payload.content) {
    return null
  }

  return {
    id: payload.messageId ?? Date.now(),
    sessionId: payload.sessionId,
    senderType: payload.senderType,
    senderId: payload.senderId ?? 0,
    messageType: payload.messageType,
    content: payload.content,
    createTime: payload.timestamp || new Date().toISOString(),
    isRead: 0,
  }
}

function mergeMessages(existing: ConsultationMessage[], incoming: ConsultationMessage[]): ConsultationMessage[] {
  const map = new Map<number, ConsultationMessage>()
  existing.forEach((message) => map.set(message.id, message))
  incoming.forEach((message) => map.set(message.id, message))

  return [...map.values()].sort((a, b) => {
    const timeA = new Date(a.createTime).getTime() || 0
    const timeB = new Date(b.createTime).getTime() || 0
    if (timeA !== timeB) {
      return timeA - timeB
    }
    return a.id - b.id
  })
}

export const useConsultationStore = defineStore('consultation', () => {
  const authStore = useAuthStore()

  const loadingSessions = ref(false)
  const loadingMessages = ref(false)
  const sending = ref(false)
  const startingSession = ref(false)
  const uploadingImage = ref(false)
  const socketConnected = ref(false)
  const errorMessage = ref('')

  const sessions = ref<ConsultationSession[]>([])
  const messagesBySession = ref<Record<number, ConsultationMessage[]>>({})
  const unreadBySession = ref<Record<number, number>>({})
  const activeSessionId = ref<number | null>(null)
  const consultationViewActive = ref(false)

  const query = ref<ConsultationQueryDTO>({
    status: 0,
    pageNum: 1,
    pageSize: 20,
  })

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectCount = 0

  const activeSession = computed(() => {
    if (!activeSessionId.value) {
      return null
    }
    return sessions.value.find((item) => item.id === activeSessionId.value) || null
  })

  const activeMessages = computed(() => {
    if (!activeSessionId.value) {
      return []
    }
    return messagesBySession.value[activeSessionId.value] || []
  })

  const totalUnreadCount = computed(() => {
    return Object.values(unreadBySession.value).reduce((total, count) => total + (count || 0), 0)
  })

  function resetError() {
    errorMessage.value = ''
  }

  function setConsultationViewActive(active: boolean) {
    consultationViewActive.value = active
  }

  function upsertMessage(message: ConsultationMessage) {
    const current = messagesBySession.value[message.sessionId] || []
    const merged = mergeMessages(current, [message])
    messagesBySession.value = {
      ...messagesBySession.value,
      [message.sessionId]: merged,
    }
  }

  function ensureSession(sessionId: number) {
    const exists = sessions.value.some((item) => item.id === sessionId)
    if (!exists) {
      sessions.value = [
        {
          id: sessionId,
          residentId: 0,
          doctorId: 0,
          status: 0,
          createTime: new Date().toISOString(),
        },
        ...sessions.value,
      ]
    }

    if (!messagesBySession.value[sessionId]) {
      messagesBySession.value = {
        ...messagesBySession.value,
        [sessionId]: [],
      }
    }
  }

  async function fetchUnreadStats(role: ConsultationRole) {
    const res = await getSessionUnreadStats(role)
    if (res.code !== ResponseCode.SUCCESS || !Array.isArray(res.data)) {
      return
    }

    const next: Record<number, number> = {}
    res.data.forEach((item) => {
      next[item.sessionId] = item.unreadCount || 0
    })
    unreadBySession.value = next
  }

  async function refreshUnread(role: ConsultationRole) {
    try {
      await fetchUnreadStats(role)
    } catch {
      // 忽略未读刷新失败，不影响主流程。
    }
  }

  async function fetchSessions(role: ConsultationRole, partialQuery?: ConsultationQueryDTO) {
    loadingSessions.value = true
    resetError()

    try {
      query.value = {
        ...query.value,
        ...partialQuery,
      }

      const res = await listConsultationSessions(role, query.value)
      if (res.code !== ResponseCode.SUCCESS || !Array.isArray(res.data)) {
        errorMessage.value = res.message || '加载咨询会话失败'
        return
      }

      sessions.value = res.data

      const nextMessagesBySession: Record<number, ConsultationMessage[]> = {
        ...messagesBySession.value,
      }
      sessions.value.forEach((session) => {
        if (!nextMessagesBySession[session.id]) {
          nextMessagesBySession[session.id] = []
        }
      })
      messagesBySession.value = nextMessagesBySession

      await fetchUnreadStats(role)

      if (!activeSessionId.value && sessions.value.length > 0) {
        activeSessionId.value = sessions.value[0]?.id || null
      }
    } catch {
      errorMessage.value = '加载咨询会话失败，请稍后重试'
    } finally {
      loadingSessions.value = false
    }
  }

  async function loadMessages(role: ConsultationRole, sessionId: number, forceFull = false) {
    if (!sessionId) {
      return
    }

    loadingMessages.value = true
    try {
      const current = messagesBySession.value[sessionId] || []
      const lastMessageId = forceFull ? undefined : current[current.length - 1]?.id
      const res = await listConsultationMessagesAfter(role, sessionId, {
        lastMessageId,
        limit: 100,
      })

      if (res.code !== ResponseCode.SUCCESS || !Array.isArray(res.data)) {
        return
      }

      const base = forceFull ? [] : current
      const merged = mergeMessages(base, res.data)
      messagesBySession.value = {
        ...messagesBySession.value,
        [sessionId]: merged,
      }
    } finally {
      loadingMessages.value = false
    }
  }

  async function selectSession(role: ConsultationRole, sessionId: number) {
    activeSessionId.value = sessionId
    ensureSession(sessionId)

    try {
      const syncRes = await syncConsultationState(role, sessionId)
      if (syncRes.code === ResponseCode.SUCCESS && syncRes.data) {
        unreadBySession.value = {
          ...unreadBySession.value,
          [sessionId]: syncRes.data.unreadCount || 0,
        }
      }
    } catch {
      // 忽略同步失败，继续走消息拉取
    }

    await loadMessages(role, sessionId, true)
    await markActiveSessionRead(role)
  }

  async function startConsultation(role: ConsultationRole, peerId: number) {
    const currentId = authStore.user?.id
    if (!currentId || !peerId) {
      errorMessage.value = '缺少会话参数，无法开始咨询'
      return null
    }

    startingSession.value = true
    resetError()

    try {
      const payload = role === 'doctor' ? { doctorId: currentId, residentId: peerId } : { residentId: currentId, doctorId: peerId }
      const res = role === 'doctor' ? await startDoctorConsultation(payload) : await startResidentConsultation(payload)

      if (res.code !== ResponseCode.SUCCESS || !res.data) {
        errorMessage.value = res.message || '开始咨询失败'
        return null
      }

      await fetchSessions(role)
      await selectSession(role, res.data)
      return res.data
    } catch {
      errorMessage.value = '开始咨询失败，请稍后重试'
      return null
    } finally {
      startingSession.value = false
    }
  }

  async function sendText(role: ConsultationRole, content: string) {
    const sessionId = activeSessionId.value
    const senderId = authStore.user?.id
    if (!sessionId || !senderId) {
      errorMessage.value = '请选择会话后再发送消息'
      return false
    }

    const normalizedContent = content.trim()
    if (!normalizedContent) {
      return false
    }

    sending.value = true
    resetError()

    try {
      const senderType = mapRoleToSenderType(role)
      const res = await sendConsultationMessage(role, {
        sessionId,
        senderType,
        senderId,
        messageType: 0,
        content: normalizedContent,
      })

      if (res.code !== ResponseCode.SUCCESS) {
        errorMessage.value = res.message || '发送失败'
        return false
      }

      return true
    } catch {
      errorMessage.value = '发送失败，请稍后重试'
      return false
    } finally {
      sending.value = false
    }
  }

  async function sendImage(role: ConsultationRole, file: File) {
    const sessionId = activeSessionId.value
    const senderId = authStore.user?.id
    if (!sessionId || !senderId) {
      errorMessage.value = '请选择会话后再发送图片'
      return false
    }

    uploadingImage.value = true
    resetError()

    try {
      const uploadRes = await uploadConsultationImage(file)
      if (uploadRes.code !== ResponseCode.SUCCESS || !uploadRes.data) {
        errorMessage.value = uploadRes.message || '上传图片失败'
        return false
      }

      const imageUrl = uploadRes.data
      const sendRes = await sendConsultationImage(role, { sessionId, imageUrl })
      if (sendRes.code !== ResponseCode.SUCCESS) {
        errorMessage.value = sendRes.message || '发送图片失败'
        return false
      }

      return true
    } catch {
      errorMessage.value = '发送图片失败，请稍后重试'
      return false
    } finally {
      uploadingImage.value = false
    }
  }

  async function markActiveSessionRead(role: ConsultationRole) {
    const sessionId = activeSessionId.value
    const currentUserId = authStore.user?.id
    if (!sessionId || !currentUserId) {
      return
    }

    const list = messagesBySession.value[sessionId] || []
    const maxUnread = list
      .filter((item) => Number(item.senderId) !== Number(currentUserId) && item.isRead !== 1)
      .map((item) => item.id)
      .sort((a, b) => b - a)[0]

    if (!maxUnread) {
      return
    }

    try {
      await markSessionReadUpTo(role, {
        sessionId,
        lastReadMessageId: maxUnread,
      })

      const patched = list.map((item) =>
        item.id <= maxUnread && Number(item.senderId) !== Number(currentUserId)
          ? {
              ...item,
              isRead: 1,
            }
          : item,
      )

      messagesBySession.value = {
        ...messagesBySession.value,
        [sessionId]: patched,
      }
      unreadBySession.value = {
        ...unreadBySession.value,
        [sessionId]: 0,
      }
    } catch {
      // 忽略已读同步失败
    }
  }

  async function connectSocket(role: ConsultationRole) {
    const userId = authStore.user?.id
    if (!userId) {
      return
    }

    disconnectSocket()

    const sid = `${role}_${userId}`
    const wsUrl = `${resolveWsBaseUrl()}/ws/${sid}`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        socketConnected.value = true
        reconnectCount = 0
      }

      ws.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data as string) as ConsultationSocketMessage
          if (payload.type !== 'message') {
            return
          }

          const message = mapSocketMessage(payload)
          if (!message) {
            return
          }

          ensureSession(message.sessionId)
          upsertMessage(message)

          if (Number(message.senderId) !== Number(userId) && payload.messageId) {
            await ackConsultationDelivered(role, {
              sessionId: message.sessionId,
              messageId: payload.messageId,
            })

            if (consultationViewActive.value && activeSessionId.value === message.sessionId) {
              await markActiveSessionRead(role)
            } else {
              unreadBySession.value = {
                ...unreadBySession.value,
                [message.sessionId]: (unreadBySession.value[message.sessionId] || 0) + 1,
              }
            }

            // Keep unread badge consistent across pages without polling.
            await refreshUnread(role)
          }
        } catch {
          // 忽略无效消息
        }
      }

      ws.onclose = () => {
        socketConnected.value = false
        if (reconnectCount >= 5) {
          return
        }

        reconnectCount += 1
        reconnectTimer = setTimeout(() => {
          void connectSocket(role)
        }, 3000)
      }

      ws.onerror = () => {
        socketConnected.value = false
      }
    } catch {
      socketConnected.value = false
    }
  }

  function disconnectSocket() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws) {
      ws.close()
      ws = null
    }

    socketConnected.value = false
  }

  function resetState() {
    sessions.value = []
    messagesBySession.value = {}
    unreadBySession.value = {}
    activeSessionId.value = null
    query.value = {
      status: 0,
      pageNum: 1,
      pageSize: 20,
    }
    errorMessage.value = ''
  }

  return {
    loadingSessions,
    loadingMessages,
    sending,
    startingSession,
    uploadingImage,
    socketConnected,
    errorMessage,
    sessions,
    messagesBySession,
    unreadBySession,
    activeSessionId,
    activeSession,
    activeMessages,
    totalUnreadCount,
    consultationViewActive,
    query,
    setConsultationViewActive,
    fetchSessions,
    refreshUnread,
    loadMessages,
    selectSession,
    startConsultation,
    sendText,
    sendImage,
    markActiveSessionRead,
    connectSocket,
    disconnectSocket,
    resetState,
  }
})
