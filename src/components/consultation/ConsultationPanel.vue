<template>
  <section class="consultation-panel">
    <aside class="session-sidebar">
      <div class="sidebar-header">
        <h3>咨询会话</h3>
        <div class="header-actions">
          <el-tag size="small" :type="socketConnected ? 'success' : 'info'">
            {{ socketConnected ? '实时连接中' : '连接未建立' }}
          </el-tag>
          <el-button size="small" :loading="loadingSessions" @click="refreshSessions">刷新</el-button>
        </div>
      </div>

      <el-empty v-if="!sessions.length && !loadingSessions" description="暂无咨询记录" />

      <div v-else class="session-list">
        <button
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === activeSessionId }"
          type="button"
          @click="selectSession(session.id)"
        >
          <div class="session-main">
            <div class="session-avatar">
              <img v-if="getSessionPeerAvatar(session)" :src="getSessionPeerAvatar(session)" alt="对端头像" />
              <span v-else>{{ getSessionPeerInitial(session) }}</span>
            </div>
            <div class="session-content">
              <div class="session-meta">
                <p class="session-title">{{ getSessionTitle(session) }}</p>
                <div class="session-badges">
                  <el-tag size="small" :type="session.status === 0 ? 'success' : 'info'">
                    {{ session.status === 0 ? '进行中' : '已结束' }}
                  </el-tag>
                  <span v-if="(unreadBySession[session.id] ?? 0) > 0" class="session-unread-badge">
                    {{ formatUnreadCount(unreadBySession[session.id] ?? 0) }}
                  </span>
                </div>
              </div>
              <p class="session-sub session-time">{{ formatTime(session.createTime) }}</p>
            </div>
          </div>
        </button>
      </div>
    </aside>

    <main class="chat-main">
      <header class="chat-header">
        <div>
          <h3>{{ activeSession ? getSessionTitle(activeSession) : '请选择会话' }}</h3>
          <p v-if="activeSession">会话ID：{{ activeSession.id }}</p>
        </div>
        <el-tag v-if="activeSession" size="small" :type="activeSession.status === 0 ? 'success' : 'info'">
          {{ activeSession.status === 0 ? '进行中' : '已结束' }}
        </el-tag>
      </header>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="message-list">
        <el-empty v-if="!activeSession" description="请先从左侧选择一个会话" />
        <el-empty v-else-if="!activeMessages.length" description="暂无消息，开始发送第一条消息吧" />
        <template v-else>
          <article
            v-for="message in activeMessages"
            :key="`${message.id}_${message.createTime}`"
            class="message-row"
            :class="{ mine: isMine(message) }"
          >
            <div class="message-avatar">
              <img v-if="getSenderAvatar(message)" :src="getSenderAvatar(message)" alt="用户头像" />
              <span v-else>{{ getSenderInitial(message) }}</span>
            </div>
            <div class="message-body">
              <p class="message-author">{{ getSenderName(message) }}</p>
              <div class="message-bubble" :class="{ image: message.messageType === 1 }">
                <img
                  v-if="message.messageType === 1"
                  class="message-image"
                  :src="toProxyImage(message.content)"
                  alt="咨询图片"
                />
                <p v-else class="message-content">{{ message.content }}</p>
              </div>
              <p class="message-time">{{ formatTime(message.createTime) }}</p>
            </div>
          </article>
        </template>
      </div>

      <footer class="chat-editor">
        <input ref="imageInputRef" type="file" accept="image/*" class="hidden-file-input" @change="handleSelectImage" />
        <el-input
          v-model="draftMessage"
          type="textarea"
          :rows="3"
          resize="none"
          maxlength="500"
          show-word-limit
          :disabled="!activeSession || activeSession.status === 1 || sending || uploadingImage"
          placeholder="输入内容后发送..."
          @keydown.enter.exact.prevent="handleSend"
        />
        <div class="editor-actions">
          <el-button
            :loading="uploadingImage"
            :disabled="!activeSession || activeSession.status === 1 || sending"
            @click="triggerImageUpload"
          >
            发送图片
          </el-button>
          <el-button
            type="primary"
            :loading="sending"
            :disabled="!activeSession || activeSession.status === 1 || uploadingImage"
            @click="handleSend"
          >
            发送消息
          </el-button>
        </div>
      </footer>
    </main>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { ResponseCode } from '@/types/api.types'
import { getDoctorAccount } from '@/api/doctor.api'
import { getResidentAccount } from '@/api/resident.api'
import { useAuthStore } from '@/stores/auth.store'
import { useConsultationStore } from '@/stores/consultation.store'
import type { ConsultationMessage, ConsultationRole, ConsultationSession } from '@/types/consultation.types'

const props = withDefaults(
  defineProps<{
    role: ConsultationRole
    selectedSessionId?: number | null
  }>(),
  {
    selectedSessionId: null,
  },
)

const authStore = useAuthStore()
const consultationStore = useConsultationStore()

const {
  loadingSessions,
  sending,
  uploadingImage,
  socketConnected,
  errorMessage,
  sessions,
  unreadBySession,
  activeSessionId,
  activeSession,
  activeMessages,
} = storeToRefs(consultationStore)

const draftMessage = ref('')
const imageInputRef = ref<HTMLInputElement | null>(null)
const peerAvatarByUserId = ref<Record<number, string>>({})
const loadingPeerAvatar = new Set<number>()

function formatTime(value?: string) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function formatUnreadCount(count: number) {
  if (count > 99) {
    return '99+'
  }
  return String(count)
}

function getSessionTitle(session: ConsultationSession) {
  if (props.role === 'doctor') {
    return session.residentName || `居民 #${session.residentId || '-'}`
  }
  return session.doctorName || `医生 #${session.doctorId || '-'}`
}

function getSenderLabel(message: ConsultationMessage) {
  const label = message.senderType === 1 ? '医生' : '居民'
  return `${label} · #${message.senderId || '-'}`
}

function getPeerName() {
  if (!activeSession.value) {
    return '对方'
  }

  if (props.role === 'doctor') {
    return activeSession.value.residentName || '居民'
  }

  return activeSession.value.doctorName || '医生'
}

function getSenderName(message: ConsultationMessage) {
  if (message.senderName) {
    return message.senderName
  }

  if (isMine(message)) {
    return authStore.user?.username || getSenderLabel(message)
  }

  return getPeerName()
}

function getSenderAvatar(message: ConsultationMessage) {
  if (isMine(message)) {
    return authStore.user?.avatarUrl || ''
  }

  const peerUserId = Number(message.senderId || 0)
  return peerAvatarByUserId.value[peerUserId] || ''
}

async function ensurePeerAvatarLoaded() {
  const session = activeSession.value
  if (!session) {
    return
  }

  const peerUserId = props.role === 'doctor' ? Number(session.residentId) : Number(session.doctorId)
  if (!peerUserId || Number.isNaN(peerUserId)) {
    return
  }

  if (Object.prototype.hasOwnProperty.call(peerAvatarByUserId.value, peerUserId) || loadingPeerAvatar.has(peerUserId)) {
    return
  }

  loadingPeerAvatar.add(peerUserId)
  try {
    if (props.role === 'doctor') {
      const res = await getResidentAccount(peerUserId)
      if (res.code === ResponseCode.SUCCESS) {
        peerAvatarByUserId.value = {
          ...peerAvatarByUserId.value,
          [peerUserId]: res.data?.avatarUrl || '',
        }
      }
    } else {
      const res = await getDoctorAccount(peerUserId)
      if (res.code === ResponseCode.SUCCESS) {
        peerAvatarByUserId.value = {
          ...peerAvatarByUserId.value,
          [peerUserId]: res.data?.avatarUrl || '',
        }
      }
    }
  } catch {
    // Ignore avatar loading failure and keep initial fallback.
  } finally {
    loadingPeerAvatar.delete(peerUserId)
  }
}

async function ensureSessionPeerAvatarLoaded(session: ConsultationSession) {
  const peerUserId = props.role === 'doctor' ? Number(session.residentId) : Number(session.doctorId)
  if (!peerUserId || Number.isNaN(peerUserId)) {
    return
  }

  if (Object.prototype.hasOwnProperty.call(peerAvatarByUserId.value, peerUserId) || loadingPeerAvatar.has(peerUserId)) {
    return
  }

  loadingPeerAvatar.add(peerUserId)
  try {
    if (props.role === 'doctor') {
      const res = await getResidentAccount(peerUserId)
      if (res.code === ResponseCode.SUCCESS) {
        peerAvatarByUserId.value = {
          ...peerAvatarByUserId.value,
          [peerUserId]: res.data?.avatarUrl || '',
        }
      }
    } else {
      const res = await getDoctorAccount(peerUserId)
      if (res.code === ResponseCode.SUCCESS) {
        peerAvatarByUserId.value = {
          ...peerAvatarByUserId.value,
          [peerUserId]: res.data?.avatarUrl || '',
        }
      }
    }
  } catch {
    // Ignore avatar loading failure and keep initial fallback.
  } finally {
    loadingPeerAvatar.delete(peerUserId)
  }
}

function getSessionPeerAvatar(session: ConsultationSession) {
  const peerUserId = props.role === 'doctor' ? Number(session.residentId) : Number(session.doctorId)
  return peerAvatarByUserId.value[peerUserId] || ''
}

function getSessionPeerInitial(session: ConsultationSession) {
  const title = getSessionTitle(session)
  return title ? title.slice(0, 1) : '?'
}

function getSenderInitial(message: ConsultationMessage) {
  const name = getSenderName(message)
  if (!name) {
    return '?'
  }
  return name.slice(0, 1)
}

function isMine(message: ConsultationMessage) {
  const mineId = authStore.user?.id
  if (!mineId) {
    return false
  }
  return Number(message.senderId) === Number(mineId)
}

async function refreshSessions() {
  await consultationStore.fetchSessions(props.role)
}

async function selectSession(sessionId: number) {
  await consultationStore.selectSession(props.role, sessionId)
}

function applySelectedSession() {
  const targetSessionId = props.selectedSessionId
  if (!targetSessionId || targetSessionId <= 0) {
    return
  }

  const exists = sessions.value.some((session) => session.id === targetSessionId)
  if (exists) {
    void consultationStore.selectSession(props.role, targetSessionId)
  }
}

async function handleSend() {
  const success = await consultationStore.sendText(props.role, draftMessage.value)
  if (success) {
    draftMessage.value = ''
  }
}

function triggerImageUpload() {
  imageInputRef.value?.click()
}

async function handleSelectImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const success = await consultationStore.sendImage(props.role, file)
  input.value = ''

  if (success) {
    ElMessage.success('图片发送成功')
  }
}

function toProxyImage(url: string) {
  return `/api/common/file/proxy-image?url=${encodeURIComponent(url)}`
}

watch(() => props.selectedSessionId, applySelectedSession, { immediate: true })

watch(() => sessions.value, applySelectedSession, { deep: true })

watch(
  () => sessions.value,
  (list) => {
    list.forEach((session) => {
      void ensureSessionPeerAvatarLoaded(session)
    })
  },
  { deep: true, immediate: true },
)

watch(
  () => activeSession.value?.id,
  () => {
    void ensurePeerAvatarLoaded()
  },
  { immediate: true },
)

watch(
  () => activeMessages.value.length,
  () => {
    void consultationStore.markActiveSessionRead(props.role)
  },
  { deep: true },
)

onMounted(async () => {
  consultationStore.setConsultationViewActive(true)
  await refreshSessions()
  applySelectedSession()
})

onUnmounted(() => {
  consultationStore.setConsultationViewActive(false)
})
</script>

<style scoped>
.consultation-panel {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 620px;
}

.session-sidebar,
.chat-main {
  background: #fff;
  border: 1px solid #dbe5f1;
  border-radius: 12px;
}

.session-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid #edf2fa;
}

.sidebar-header h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #0f172a;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.session-list {
  display: grid;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}

.session-item {
  border: 1px solid #dbe5f1;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
}

.session-item.active {
  border-color: #137fec;
  box-shadow: 0 6px 14px rgba(19, 127, 236, 0.15);
}

.session-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.session-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c83f2, #4ea4ff);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 0 0 36px;
}

.session-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.session-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.session-unread-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  padding: 0 6px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.session-title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.session-sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.session-time {
  text-align: right;
}

.chat-main {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  min-height: 0;
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid #edf2fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.chat-header h3 {
  margin: 0;
  color: #0f172a;
}

.chat-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.error-text {
  margin: 0;
  padding: 8px 16px;
  color: #b91c1c;
  font-size: 13px;
}

.message-list {
  padding: 16px;
  display: grid;
  gap: 14px;
  overflow-y: auto;
  background: linear-gradient(180deg, #eef2f7, #e8edf5);
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-row.mine {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c83f2, #4ea4ff);
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 0 0 38px;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-body {
  max-width: min(76%, 520px);
  display: grid;
  gap: 4px;
}

.message-row.mine .message-body {
  justify-items: end;
}

.message-author {
  margin: 0;
  font-size: 12px;
  color: #4b5563;
}

.message-bubble {
  background: #ffffff;
  border: 1px solid #d7dfeb;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.message-row.mine .message-bubble {
  background: #cfe9ba;
  border-color: #b8d7a0;
}

.message-bubble.image {
  padding: 6px;
}

.message-content {
  margin: 0;
  color: #0f172a;
  white-space: pre-wrap;
  line-height: 1.45;
}

.message-image {
  display: block;
  width: min(100%, 280px);
  border-radius: 8px;
  margin: 0;
  border: 1px solid #dbe5f1;
}

.message-time {
  margin: 0;
  font-size: 11px;
  color: #8c98ab;
}

.chat-editor {
  border-top: 1px solid #edf2fa;
  padding: 12px 16px;
  display: grid;
  gap: 8px;
}

.editor-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.hidden-file-input {
  display: none;
}

@media (max-width: 1080px) {
  .consultation-panel {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .session-sidebar {
    max-height: 320px;
  }

  .message-item {
    width: 100%;
  }

  .message-body {
    width: 100%;
  }
}
</style>
