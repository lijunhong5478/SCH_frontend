<template>
  <div class="system-config-container">
    <div class="page-header">
      <div class="title-wrap">
        <h2 class="page-title">系统配置</h2>
        <p class="subtitle">在此管理医院的基本运营参数和规则设置。</p>
      </div>
    </div>

    <div v-loading="store.loading" class="config-panel">
      <div v-if="store.isEmpty" class="empty-container">
        <el-icon class="empty-icon"><Setting /></el-icon>
        <p>暂无系统配置</p>
      </div>

      <div v-else class="config-table">
        <div v-for="item in store.configList" :key="item.id" class="config-row">
          <div class="config-label">{{ item.description }}</div>

          <div class="config-editor">
            <el-time-picker
              v-if="isTimeField(item)"
              v-model="editableValues[item.id]"
              value-format="HH:mm"
              format="hh:mm A"
              placeholder="请选择时间"
              style="width: 320px"
            />

            <el-input
              v-else-if="isLongTextField(item)"
              v-model="editableValues[item.id]"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="请输入配置值"
            />

            <el-input
              v-else
              v-model="editableValues[item.id]"
              placeholder="请输入配置值"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <button type="button" class="exit-btn" :disabled="saving" @click="handleExit">重置</button>
      <button type="button" class="save-btn" :disabled="saving" @click="handleSaveAll">
        {{ saving ? '保存中...' : '保存配置' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import { useSystemConfigStore } from '@/stores/system-config.store'
import type { SystemConfig } from '@/types/system-config.types'

const store = useSystemConfigStore()

const editableValues = reactive<Record<number, string>>({})
const initialValues = reactive<Record<number, string>>({})
const saving = ref(false)

watch(
  () => store.configList,
  (list) => {
    list.forEach((item) => {
      const value = item.configValue ?? ''
      editableValues[item.id] = value
      initialValues[item.id] = value
    })
  },
  { immediate: true, deep: true }
)

const isTimeField = (item: SystemConfig): boolean => {
  return item.configKey === 'queue_start_time' || item.configKey === 'queue_end_time'
}

const isLongTextField = (item: SystemConfig): boolean => {
  return item.configKey.includes('policy') || item.configKey.includes('医保') || item.configValue.length > 36
}

const handleExit = () => {
  store.configList.forEach((item) => {
    editableValues[item.id] = initialValues[item.id] ?? item.configValue
  })
}

const handleSaveAll = async () => {
  const changedItems = store.configList.filter((item) => {
    const nextValue = (editableValues[item.id] ?? '').trim()
    return nextValue !== (initialValues[item.id] ?? '').trim()
  })

  if (changedItems.length === 0) {
    ElMessage.info('未检测到配置变更')
    return
  }

  saving.value = true
  try {
    for (const item of changedItems) {
      const result = await store.updateConfig({
        id: item.id,
        configKey: item.configKey,
        description: item.description,
        configValue: (editableValues[item.id] ?? '').trim(),
        updateTime: item.updateTime,
      })

      if (!result.success) {
        ElMessage.error(`保存失败：${item.description}`)
        return
      }

      initialValues[item.id] = (editableValues[item.id] ?? '').trim()
    }

    ElMessage.success('配置保存成功')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await store.fetchConfigs()
})
</script>

<style scoped>
.system-config-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 16px;
}

.title-wrap {
  border-left: 3px solid #ff6a00;
  padding-left: 12px;
}

.page-title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.config-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: auto;
}

.config-table {
  display: flex;
  flex-direction: column;
}

.config-row {
  display: grid;
  grid-template-columns: 210px 1fr;
  align-items: center;
  min-height: 68px;
  border-bottom: 1px solid #eceff3;
}

.config-row:last-child {
  border-bottom: 0;
}

.config-label {
  padding: 0 18px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.config-editor {
  padding: 10px 18px 10px 8px;
  max-width: 640px;
}

.config-editor :deep(.el-input__wrapper),
.config-editor :deep(.el-textarea__inner),
.config-editor :deep(.el-input__inner) {
  border-radius: 8px;
}

.footer-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.exit-btn,
.save-btn {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  min-width: 96px;
  height: 36px;
  font-size: 14px;
  cursor: pointer;
}

.exit-btn {
  background: #fff;
  color: #374151;
}

.save-btn {
  border: 0;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: #fff;
}

.exit-btn:disabled,
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-container {
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 12px;
}

.empty-icon {
  font-size: 36px;
}

@media (max-width: 900px) {
  .page-title {
    font-size: 28px;
  }

  .config-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .config-label {
    padding: 12px 18px 0;
  }

  .config-editor {
    max-width: none;
    padding: 10px 18px 12px;
  }
}
</style>
