<template>
  <section class="doctor-my-patients-page">
    <header class="my-patients-header">
      <el-button link type="primary" @click="goBackWorkbench">返回工作台</el-button>
      <h3>我的患者</h3>
    </header>

    <PatientArchive :doctor-id-filter="doctorId" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import PatientArchive from '@/components/doctor/PatientArchive.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const doctorId = computed(() => authStore.user?.id)

const goBackWorkbench = () => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: 'workbench',
    },
  })
}
</script>

<style scoped>
.doctor-my-patients-page {
  inline-size: 100%;
  block-size: 100%;
  display: flex;
  flex-direction: column;
}

.my-patients-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 10px;
}

.my-patients-header h3 {
  margin: 0;
  color: #133d78;
}
</style>
