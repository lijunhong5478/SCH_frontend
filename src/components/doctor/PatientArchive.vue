<template>
  <section class="patient-archive-page">
    <template v-if="activeRecord">
      <article ref="reportRef" class="record-detail-shell">
        <header class="detail-header">
          <h2>健康档案 · {{ activeRecord.name }}</h2>
        </header>

        <nav class="detail-tabs">
          <button
            v-for="item in detailTabs"
            :key="item.key"
            type="button"
            class="detail-tab"
            :class="{ active: activeDetailTab === item.key }"
            @click="activeDetailTab = item.key"
          >
            {{ item.label }}
          </button>
        </nav>

        <section class="detail-content-wrap">
          <section v-if="activeDetailTab === 'basic'" class="basic-detail-card">
            <div class="basic-top">
              <img
                ref="reportAvatarRef"
                :src="reportAvatarSrc || fallbackAvatar"
                alt="居民头像"
                class="detail-avatar"
              />

              <div class="basic-name-wrap">
                <div class="name-line">
                  <h3>{{ activeRecord.name }}</h3>
                  <span class="resident-tag">居民用户</span>
                </div>
                <p class="phone-line">{{ activeRecord.phone || '-' }}</p>
              </div>
            </div>

            <div class="basic-grid">
              <div class="basic-item">
                <span class="item-label">性别</span>
                <strong>{{ healthRecordStore.getGenderText(activeRecord.gender) }}</strong>
              </div>
              <div class="basic-item">
                <span class="item-label">年龄</span>
                <strong>{{ activeRecord.age }} 岁</strong>
              </div>
              <div class="basic-item">
                <span class="item-label">身份证号</span>
                <strong>{{ activeRecord.idCard || '-' }}</strong>
              </div>
              <div class="basic-item">
                <span class="item-label">紧急联系方式</span>
                <strong class="danger-text">{{ activeRecord.contact || '-' }}</strong>
              </div>
              <div class="basic-item full">
                <span class="item-label">家庭住址</span>
                <strong>{{ activeRecord.address || '-' }}</strong>
              </div>
            </div>
          </section>

          <section v-else-if="activeDetailTab === 'diagnosis'" class="diagnosis-card">
            <header class="diagnosis-filter-row">
              <el-date-picker
                v-model="diagnosisQuery.createDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="按日期筛选"
                clearable
                class="diagnosis-date"
              />
              <el-button type="primary" :loading="diagnosisLoading" @click="handleDiagnosisQuery">查询</el-button>
              <el-button :disabled="diagnosisLoading" @click="handleDiagnosisReset">重置</el-button>
            </header>

            <el-skeleton :loading="diagnosisLoading" animated :count="3">
              <template #template>
                <div class="diagnosis-skeleton" />
              </template>

              <template #default>
                <el-table :data="diagnosisList" border class="diagnosis-table" empty-text="暂无诊断记录">
                  <el-table-column prop="diagnosisResult" label="诊断结果" min-width="180" />
                  <el-table-column prop="diagnosisDetail" label="诊断细节" min-width="360" show-overflow-tooltip />
                  <el-table-column label="创建时间" min-width="160">
                    <template #default="scope">
                      {{ formatDateTime(scope.row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="220" fixed="right">
                    <template #default="scope">
                      <div class="diagnosis-actions">
                        <el-button link type="primary" @click="handleViewVisit(scope.row.visitId)">问诊记录</el-button>
                        <el-button
                          v-if="isDoctor && diagnosisPermissionMap[scope.row.id]"
                          link
                          type="warning"
                          :loading="diagnosisSubmitting"
                          @click="handleEditDiagnosis(scope.row)"
                        >
                          修改
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="diagnosis-pagination-row">
                  <span>共 {{ diagnosisTotal }} 条诊断记录</span>
                  <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="diagnosisTotal"
                    :current-page="diagnosisQuery.pageNum"
                    :page-size="diagnosisQuery.pageSize"
                    @current-change="handleDiagnosisPageChange"
                  />
                </div>
              </template>
            </el-skeleton>
          </section>

          <section v-else-if="activeDetailTab === 'examination'" class="examination-card">
            <header class="examination-filter-row">
              <el-date-picker
                v-model="examinationQuery.createDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="按日期筛选"
                clearable
                class="examination-date"
              />
              <el-select
                v-model="examinationQuery.reportType"
                placeholder="检测类型"
                clearable
                class="examination-type"
              >
                <el-option
                  v-for="item in examinationReportTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button type="primary" :loading="examinationLoading" @click="handleExaminationQuery">查询</el-button>
              <el-button :disabled="examinationLoading" @click="handleExaminationReset">重置</el-button>
              <el-button v-if="isDoctor" type="success" @click="handleOpenExaminationCreate">新增检查记录</el-button>
            </header>

            <el-skeleton :loading="examinationLoading" animated :count="3">
              <template #template>
                <div class="examination-skeleton" />
              </template>

              <template #default>
                <el-table :data="examinationList" border class="examination-table" empty-text="暂无检查记录">
                  <el-table-column label="检测类型" min-width="140">
                    <template #default="scope">
                      {{ examinationStore.getReportTypeText(scope.row.reportType) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="reportContent" label="检测内容" min-width="420" show-overflow-tooltip />
                  <el-table-column label="检测时间" min-width="160">
                    <template #default="scope">
                      {{ formatDateTime(scope.row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="100" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="handleViewExaminationDetail(scope.row.id)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="examination-pagination-row">
                  <span>共 {{ examinationTotal }} 条检查记录</span>
                  <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="examinationTotal"
                    :current-page="examinationQuery.pageNum"
                    :page-size="examinationQuery.pageSize"
                    @current-change="handleExaminationPageChange"
                  />
                </div>
              </template>
            </el-skeleton>
          </section>

          <section v-else-if="activeDetailTab === 'physical'" class="examination-card">
     

            <el-skeleton :loading="physicalLoading" animated :count="3">
              <template #template>
                <div class="examination-skeleton" />
              </template>

              <template #default>
                <el-table :data="physicalList" border class="examination-table" empty-text="暂无体检记录">
                  <el-table-column prop="height" label="身高(cm)" min-width="100" />
                  <el-table-column prop="weight" label="体重(kg)" min-width="100" />
                  <el-table-column prop="bmi" label="BMI" min-width="100" />
                  <el-table-column prop="systolicBp" label="收缩压(mmHg)" min-width="130" />
                  <el-table-column prop="diastolicBp" label="舒张压(mmHg)" min-width="130" />
                  <el-table-column prop="heartRate" label="心率(bpm)" min-width="100" />
                  <el-table-column prop="bloodSugar" label="血糖(mmol/L)" min-width="130" />
                  <el-table-column label="体检时间" min-width="160">
                    <template #default="scope">
                      {{ formatDateTime(scope.row.examTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="100" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="handleViewPhysicalDetail(scope.row.id)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="examination-pagination-row">
                  <span>共 {{ physicalTotal }} 条体检记录</span>
                  <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="physicalTotal"
                    :current-page="physicalQuery.pageNum"
                    :page-size="physicalQuery.pageSize"
                    @current-change="handlePhysicalPageChange"
                  />
                </div>
              </template>
            </el-skeleton>
          </section>

          <section v-else-if="activeDetailTab === 'history'" class="examination-card">
            <header class="examination-filter-row">
              <el-button v-if="isDoctor" type="success" @click="handleOpenHistoryCreate">新增病史记录</el-button>
            </header>

            <el-skeleton :loading="historyLoading" animated :count="3">
              <template #template>
                <div class="examination-skeleton" />
              </template>

              <template #default>
                <el-table :data="historyList" border class="examination-table" empty-text="暂无病史记录">
                  <el-table-column prop="chronicDisease" label="慢性病史" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="pastMedicalHistory" label="既往病史" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="allergyHistory" label="过敏史" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="familyHistory" label="家庭病史" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="surgeryHistory" label="手术史" min-width="180" show-overflow-tooltip />
                  <el-table-column label="更新时间" min-width="160">
                    <template #default="scope">
                      {{ formatDateTime(scope.row.updateTime || scope.row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="100" fixed="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="handleViewHistoryDetail(scope.row.id)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="examination-pagination-row">
                  <span>共 {{ historyTotal }} 条病史记录</span>
                  <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="historyTotal"
                    :current-page="historyQuery.pageNum"
                    :page-size="historyQuery.pageSize"
                    @current-change="handleHistoryPageChange"
                  />
                </div>
              </template>
            </el-skeleton>
          </section>

          <section v-else class="pending-module-card">
            <h3>{{ detailTabLabelMap[activeDetailTab] }}</h3>
            <p>模块待开发</p>
          </section>
        </section>
      </article>

      <div class="detail-action-bar no-export">
        <button
          v-if="isDoctor"
          type="button"
          class="action-btn-single"
          :disabled="detailLoading"
          @click="backToArchiveList"
        >
          返回查询界面
        </button>
        <button
          v-else
          type="button"
          class="action-btn-single primary"
          :disabled="exportingPdf || detailLoading"
          @click="exportPdf"
        >
          {{ exportingPdf ? '导出中...' : '导出报表' }}
        </button>
      </div>
    </template>

    <template v-else-if="isDoctor">
      <header class="page-header">
        <h3>患者档案</h3>
        <div class="query-row">
          <el-input v-model="queryForm.realName" placeholder="姓名" clearable class="query-input" />
          <el-input v-model="queryForm.phone" placeholder="手机号" clearable class="query-input" />
          <el-input v-model="queryForm.idCard" placeholder="身份证号" clearable class="query-input" />
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button :loading="loading" @click="handleReset">重置</el-button>
        </div>
      </header>

      <el-skeleton :loading="loading" animated :count="4">
        <template #template>
          <div class="archive-card-skeleton" />
        </template>

        <template #default>
          <div v-if="recordList.length" class="archive-grid">
            <article v-for="record in recordList" :key="record.id" class="archive-card">
              <h4 class="archive-title">{{ record.title || `${record.name}健康档案` }}</h4>

              <div class="patient-identity">
                <img
                  :src="record.avatarUrl || fallbackAvatar"
                  alt="居民头像"
                  class="patient-avatar"
                />
                <div class="patient-main">
                  <div class="name-line">
                    <span class="patient-name">{{ record.name }}</span>
                    <span class="patient-meta">{{ healthRecordStore.getGenderText(record.gender) }} · {{ record.age }}岁</span>
                  </div>
                  <p class="patient-phone">{{ record.phone || '-' }}</p>
                </div>
              </div>

              <div class="address-box">
                <span class="address-label">现居住址</span>
                <p class="address-text">{{ record.address || '暂无地址' }}</p>
              </div>

              <div class="card-actions">
                <button type="button" class="action-btn" @click="handleDetail(record)">查看详情</button>
                <button type="button" class="action-btn secondary" @click="handleExportReport(record)">导出报表</button>
              </div>
            </article>
          </div>

          <el-empty v-else description="暂无患者档案" />
        </template>
      </el-skeleton>

      <footer class="page-footer">
        <span class="page-info">显示第 {{ pageStart }} 到 {{ pageEnd }} 条，共 {{ total }} 条患者档案</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageNumChange"
        />
      </footer>
    </template>

    <template v-else>
      <el-skeleton :loading="detailLoading" animated>
        <template #template>
          <div class="archive-card-skeleton" />
        </template>

        <template #default>
          <el-empty description="暂无健康档案" />
        </template>
      </el-skeleton>
    </template>

    <el-dialog
      v-model="visitDialogVisible"
      title="问诊记录"
      width="520px"
      destroy-on-close
    >
      <div v-if="visitDetail" class="visit-detail-panel">
        <p><span>医生姓名：</span>{{ visitDetail.doctorName || '-' }}</p>
        <p><span>医生电话：</span>{{ visitDetail.doctorPhone || '-' }}</p>
        <p><span>科室：</span>{{ visitDetail.doctorDepartment || '-' }}</p>
        <p><span>居民姓名：</span>{{ visitDetail.residentName || '-' }}</p>
        <p><span>主诉：</span>{{ visitDetail.chiefComplaint || '-' }}</p>
        <p><span>治疗建议：</span>{{ visitDetail.treatmentAdvice || '-' }}</p>
        <p><span>创建时间：</span>{{ formatDateTime(visitDetail.createTime) }}</p>
      </div>
      <el-empty v-else description="暂无问诊记录" />
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="修改诊断报告"
      width="520px"
      destroy-on-close
    >
      <el-form label-position="top" class="edit-form">
        <el-form-item label="诊断结果">
          <el-input v-model="editForm.diagnosisResult" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="诊断细节">
          <el-input
            v-model="editForm.diagnosisDetail"
            type="textarea"
            :rows="4"
            maxlength="400"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="diagnosisSubmitting" @click="handleSubmitDiagnosisEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="examinationDetailDialogVisible"
      title="检查记录详情"
      width="560px"
      destroy-on-close
    >
      <el-skeleton :loading="examinationDetailLoading" animated>
        <template #template>
          <div class="diagnosis-skeleton" />
        </template>
        <template #default>
          <div v-if="examinationDetail" class="visit-detail-panel">
            <p><span>检测类型：</span>{{ examinationStore.getReportTypeText(examinationDetail.reportType) }}</p>
            <p><span>检测内容：</span>{{ examinationDetail.reportContent || '-' }}</p>
            <p><span>检测时间：</span>{{ formatDateTime(examinationDetail.createTime) }}</p>
          </div>
          <el-empty v-else description="暂无检查记录详情" />
        </template>
      </el-skeleton>
    </el-dialog>

    <el-dialog
      v-model="examinationCreateDialogVisible"
      title="新增检查记录"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top" class="edit-form">
        <el-form-item label="检测类型">
          <el-checkbox-group v-model="examinationCreateForm.reportTypes">
            <el-checkbox
              v-for="item in examinationReportTypeOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="检测内容">
          <el-input
            v-model="examinationCreateForm.reportContent"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入检测内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examinationCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="examinationSubmitting" @click="handleSubmitExaminationCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="physicalDetailDialogVisible"
      title="体检记录详情"
      width="560px"
      destroy-on-close
    >
      <el-skeleton :loading="physicalDetailLoading" animated>
        <template #template>
          <div class="diagnosis-skeleton" />
        </template>
        <template #default>
          <div v-if="physicalDetail" class="visit-detail-panel">
            <p><span>身高：</span>{{ physicalDetail.height }} cm</p>
            <p><span>体重：</span>{{ physicalDetail.weight }} kg</p>
            <p><span>BMI：</span>{{ physicalDetail.bmi }}</p>
            <p><span>收缩压：</span>{{ physicalDetail.systolicBp }} mmHg</p>
            <p><span>舒张压：</span>{{ physicalDetail.diastolicBp }} mmHg</p>
            <p><span>心率：</span>{{ physicalDetail.heartRate }} bpm</p>
            <p><span>血糖：</span>{{ physicalDetail.bloodSugar }} mmol/L</p>
            <p><span>体检时间：</span>{{ formatDateTime(physicalDetail.examTime) }}</p>
          </div>
          <el-empty v-else description="暂无体检记录详情" />
        </template>
      </el-skeleton>
    </el-dialog>

    <el-dialog
      v-model="physicalCreateDialogVisible"
      title="新增体检记录"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top" class="edit-form">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="身高(cm)">
              <el-input-number v-model="physicalCreateForm.height" :min="0" :precision="1" :step="0.1" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="体重(kg)">
              <el-input-number v-model="physicalCreateForm.weight" :min="0" :precision="1" :step="0.1" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收缩压(mmHg)">
              <el-input-number v-model="physicalCreateForm.systolicBp" :min="0" :step="1" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="舒张压(mmHg)">
              <el-input-number v-model="physicalCreateForm.diastolicBp" :min="0" :step="1" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="心率(bpm)">
              <el-input-number v-model="physicalCreateForm.heartRate" :min="0" :step="1" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="血糖(mmol/L)">
              <el-input-number v-model="physicalCreateForm.bloodSugar" :min="0" :precision="1" :step="0.1" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="physicalCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="physicalSubmitting" @click="handleSubmitPhysicalCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDetailDialogVisible"
      title="病史记录详情"
      width="560px"
      destroy-on-close
    >
      <el-skeleton :loading="historyDetailLoading" animated>
        <template #template>
          <div class="diagnosis-skeleton" />
        </template>
        <template #default>
          <div v-if="historyDetail" class="visit-detail-panel">
            <p><span>慢性病史：</span>{{ historyDetail.chronicDisease || '-' }}</p>
            <p><span>既往病史：</span>{{ historyDetail.pastMedicalHistory || '-' }}</p>
            <p><span>过敏史：</span>{{ historyDetail.allergyHistory || '-' }}</p>
            <p><span>家庭病史：</span>{{ historyDetail.familyHistory || '-' }}</p>
            <p><span>手术史：</span>{{ historyDetail.surgeryHistory || '-' }}</p>
            <p><span>创建时间：</span>{{ formatDateTime(historyDetail.createTime) }}</p>
            <p><span>更新时间：</span>{{ formatDateTime(historyDetail.updateTime) }}</p>
          </div>
          <el-empty v-else description="暂无病史记录详情" />
        </template>
      </el-skeleton>
    </el-dialog>

    <el-dialog
      v-model="historyCreateDialogVisible"
      title="新增居民病史记录"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top" class="edit-form">
        <el-form-item label="慢性病史">
          <el-input
            v-model="historyCreateForm.chronicDisease"
            type="textarea"
            :rows="2"
            maxlength="300"
            show-word-limit
            placeholder="例如：高血压、2型糖尿病"
          />
        </el-form-item>
        <el-form-item label="既往病史">
          <el-input
            v-model="historyCreateForm.pastMedicalHistory"
            type="textarea"
            :rows="2"
            maxlength="400"
            show-word-limit
            placeholder="请输入既往病史"
          />
        </el-form-item>
        <el-form-item label="过敏史">
          <el-input
            v-model="historyCreateForm.allergyHistory"
            type="textarea"
            :rows="2"
            maxlength="300"
            show-word-limit
            placeholder="请输入过敏史"
          />
        </el-form-item>
        <el-form-item label="家庭病史（必填）">
          <el-input
            v-model="historyCreateForm.familyHistory"
            type="textarea"
            :rows="2"
            maxlength="400"
            show-word-limit
            placeholder="请输入家庭病史"
          />
        </el-form-item>
        <el-form-item label="手术史">
          <el-input
            v-model="historyCreateForm.surgeryHistory"
            type="textarea"
            :rows="2"
            maxlength="300"
            show-word-limit
            placeholder="请输入手术史"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="historyCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="historySubmitting" @click="handleSubmitHistoryCreate">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useDiagnosisReportStore } from '@/stores/diagnosis-report.store'
import { useExaminationReportStore } from '@/stores/examination-report.store'
import { useHealthRecordStore } from '@/stores/health-record.store'
import { usePhysicalExamRecordStore } from '@/stores/physical-exam-record.store'
import { useResidentMedicalHistoryStore } from '@/stores/resident-medical-history.store'
import type { DiagnosisReport, DoctorHealthRecord } from '@/types/health-record.types'
import type { DiagnosisRole } from '@/types/diagnosis-report.types'
import { examinationReportTypeOptions } from '@/types/examination-report.types'
import type { PhysicalExamRole } from '@/types/physical-exam-record.types'
import type { ResidentMedicalHistoryRole } from '@/types/resident-medical-history.types'

const props = defineProps<{
  doctorIdFilter?: number
}>()

interface HealthRecordQueryForm {
  realName?: string
  phone?: string
  idCard?: string
}

const fallbackAvatar =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%2292%22 viewBox=%220 0 92 92%22%3E%3Crect width=%2292%22 height=%2292%22 rx=%228%22 fill=%22%23eef3f9%22/%3E%3Ccircle cx=%2246%22 cy=%2234%22 r=%2216%22 fill=%22%23c8d5e6%22/%3E%3Cpath d=%22M20 75c0-14.4 11.6-26 26-26s26 11.6 26 26%22 fill=%22%23c8d5e6%22/%3E%3C/svg%3E'

type DetailTabKey = 'basic' | 'diagnosis' | 'examination' | 'physical' | 'history'

const detailTabs: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'basic', label: '基本信息' },
  { key: 'diagnosis', label: '诊断记录' },
  { key: 'examination', label: '检查记录' },
  { key: 'physical', label: '体检记录' },
  { key: 'history', label: '居民病史' },
]

const detailTabLabelMap: Record<DetailTabKey, string> = {
  basic: '基本信息',
  diagnosis: '诊断记录',
  examination: '检查记录',
  physical: '体检记录',
  history: '居民病史',
}

const healthRecordStore = useHealthRecordStore()
const diagnosisStore = useDiagnosisReportStore()
const examinationStore = useExaminationReportStore()
const physicalStore = usePhysicalExamRecordStore()
const historyStore = useResidentMedicalHistoryStore()
const authStore = useAuthStore()
const { recordList, total, loading, activeRecord, detailLoading } = storeToRefs(healthRecordStore)
const {
  list: diagnosisList,
  total: diagnosisTotal,
  loading: diagnosisLoading,
  submitting: diagnosisSubmitting,
  visitDetail,
} = storeToRefs(diagnosisStore)
const {
  list: examinationList,
  total: examinationTotal,
  loading: examinationLoading,
  detail: examinationDetail,
  detailLoading: examinationDetailLoading,
  submitting: examinationSubmitting,
} = storeToRefs(examinationStore)
const {
  list: physicalList,
  total: physicalTotal,
  loading: physicalLoading,
  detail: physicalDetail,
  detailLoading: physicalDetailLoading,
  submitting: physicalSubmitting,
} = storeToRefs(physicalStore)
const {
  list: historyList,
  total: historyTotal,
  loading: historyLoading,
  detail: historyDetail,
  detailLoading: historyDetailLoading,
  submitting: historySubmitting,
} = storeToRefs(historyStore)

const isDoctor = computed(() => authStore.user?.role === 'doctor')
const isResident = computed(() => authStore.user?.role === 'resident')

const queryForm = reactive<HealthRecordQueryForm>({})
const pageNum = ref(1)
const pageSize = ref(10)

const reportRef = ref<HTMLElement | null>(null)
const reportAvatarRef = ref<HTMLImageElement | null>(null)
const reportAvatarSrc = ref(fallbackAvatar)
const exportingPdf = ref(false)
const activeDetailTab = ref<DetailTabKey>('basic')
const visitDialogVisible = ref(false)
const editDialogVisible = ref(false)
const examinationDetailDialogVisible = ref(false)
const examinationCreateDialogVisible = ref(false)
const physicalDetailDialogVisible = ref(false)
const physicalCreateDialogVisible = ref(false)
const historyDetailDialogVisible = ref(false)
const historyCreateDialogVisible = ref(false)
const editingSourceDiagnosis = ref<DiagnosisReport | null>(null)
const diagnosisPermissionMap = ref<Record<number, boolean>>({})

const diagnosisQuery = reactive({
  createDate: '',
  pageNum: 1,
  pageSize: 10,
})

const examinationQuery = reactive({
  createDate: '',
  reportType: undefined as number | undefined,
  pageNum: 1,
  pageSize: 10,
})

const physicalQuery = reactive({
  createDate: '',
  pageNum: 1,
  pageSize: 10,
})

const historyQuery = reactive({
  pageNum: 1,
  pageSize: 10,
})

const editForm = reactive({
  diagnosisResult: '',
  diagnosisDetail: '',
})

const examinationCreateForm = reactive({
  reportTypes: [] as number[],
  reportContent: '',
})

const physicalCreateForm = reactive({
  height: 0,
  weight: 0,
  systolicBp: 0,
  diastolicBp: 0,
  heartRate: 0,
  bloodSugar: 0,
})

const historyCreateForm = reactive({
  chronicDisease: '',
  pastMedicalHistory: '',
  allergyHistory: '',
  familyHistory: '',
  surgeryHistory: '',
})

const diagnosisRole = computed<DiagnosisRole>(() => (isDoctor.value ? 'doctor' : 'resident'))
const physicalRole = computed<PhysicalExamRole>(() => (isDoctor.value ? 'doctor' : 'resident'))
const historyRole = computed<ResidentMedicalHistoryRole>(() => (isDoctor.value ? 'doctor' : 'resident'))

const pageStart = computed(() => {
  if (!total.value) {
    return 0
  }
  return (pageNum.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  if (!total.value) {
    return 0
  }
  return Math.min(pageNum.value * pageSize.value, total.value)
})

const normalizeQuery = () => {
  return {
    doctorId: props.doctorIdFilter,
    realName: queryForm.realName?.trim() || undefined,
    phone: queryForm.phone?.trim() || undefined,
    idCard: queryForm.idCard?.trim() || undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  }
}

const queryRecordList = async () => {
  await healthRecordStore.queryRecordList(normalizeQuery())
}

const handleQuery = async () => {
  pageNum.value = 1
  await queryRecordList()
}

const handleReset = async () => {
  queryForm.realName = undefined
  queryForm.phone = undefined
  queryForm.idCard = undefined
  pageNum.value = 1
  healthRecordStore.resetQuery()
  await queryRecordList()
}

const handlePageNumChange = async (value: number) => {
  pageNum.value = value
  await queryRecordList()
}

const openRecordDetail = async (loginUserId?: number) => {
  const detail = await healthRecordStore.queryRecordDetailByLoginId(loginUserId)
  if (!detail) {
    ElMessage.warning('未查询到健康档案详情')
    return null
  }

  activeDetailTab.value = 'basic'
  reportAvatarSrc.value = detail.avatarUrl || fallbackAvatar
  return detail
}

const queryDiagnosisList = async () => {
  if (!activeRecord.value?.id) {
    return
  }

  const rows = await diagnosisStore.queryList(diagnosisRole.value, {
    createDate: diagnosisQuery.createDate || undefined,
    healthRecordId: activeRecord.value.id,
    pageNum: diagnosisQuery.pageNum,
    pageSize: diagnosisQuery.pageSize,
  })

  if (!isDoctor.value) {
    diagnosisPermissionMap.value = {}
    return
  }

  const doctorId = authStore.user?.id
  if (!doctorId || !rows.length) {
    diagnosisPermissionMap.value = {}
    return
  }

  const permissionPairs = await Promise.all(
    rows.map(async (item) => {
      try {
        const canEdit = await diagnosisStore.checkDoctorPermission(item.id, doctorId)
        return [item.id, canEdit] as const
      } catch {
        return [item.id, false] as const
      }
    }),
  )

  diagnosisPermissionMap.value = Object.fromEntries(permissionPairs)
}

const handleDiagnosisQuery = async () => {
  diagnosisQuery.pageNum = 1
  await queryDiagnosisList()
}

const handleDiagnosisReset = async () => {
  diagnosisQuery.createDate = ''
  diagnosisQuery.pageNum = 1
  await queryDiagnosisList()
}

const handleDiagnosisPageChange = async (pageNum: number) => {
  diagnosisQuery.pageNum = pageNum
  await queryDiagnosisList()
}

const queryExaminationList = async () => {
  if (!activeRecord.value?.id) {
    return
  }

  await examinationStore.queryList({
    createDate: examinationQuery.createDate || undefined,
    reportType: examinationQuery.reportType,
    healthRecordId: activeRecord.value.id,
    pageNum: examinationQuery.pageNum,
    pageSize: examinationQuery.pageSize,
  })
}

const handleExaminationQuery = async () => {
  examinationQuery.pageNum = 1
  await queryExaminationList()
}

const handleExaminationReset = async () => {
  examinationQuery.createDate = ''
  examinationQuery.reportType = undefined
  examinationQuery.pageNum = 1
  await queryExaminationList()
}

const handleExaminationPageChange = async (pageNum: number) => {
  examinationQuery.pageNum = pageNum
  await queryExaminationList()
}

const queryPhysicalList = async () => {
  if (!activeRecord.value?.id) {
    return
  }

  await physicalStore.queryList(physicalRole.value, {
    createDate: physicalQuery.createDate || undefined,
    recordId: activeRecord.value.id,
    pageNum: physicalQuery.pageNum,
    pageSize: physicalQuery.pageSize,
  })
}


const handlePhysicalPageChange = async (pageNum: number) => {
  physicalQuery.pageNum = pageNum
  await queryPhysicalList()
}

const queryHistoryList = async () => {
  if (!activeRecord.value?.id) {
    return
  }

  await historyStore.queryList(historyRole.value, {
    recordId: activeRecord.value.id,
    pageNum: historyQuery.pageNum,
    pageSize: historyQuery.pageSize,
  })
}

const handleHistoryPageChange = async (pageNum: number) => {
  historyQuery.pageNum = pageNum
  await queryHistoryList()
}

const handleViewHistoryDetail = async (id: number) => {
  if (!id) {
    ElMessage.warning('病史记录ID无效')
    return
  }

  try {
    const detail = await historyStore.queryDetailById(historyRole.value, id)
    if (!detail) {
      ElMessage.warning('未查询到病史记录详情')
      return
    }
    historyDetailDialogVisible.value = true
  } catch {
    ElMessage.error('查询病史记录详情失败，请稍后重试')
  }
}

const handleOpenHistoryCreate = () => {
  if (!isDoctor.value) {
    ElMessage.warning('当前角色无新增病史权限')
    return
  }

  historyCreateForm.chronicDisease = ''
  historyCreateForm.pastMedicalHistory = ''
  historyCreateForm.allergyHistory = ''
  historyCreateForm.familyHistory = ''
  historyCreateForm.surgeryHistory = ''
  historyCreateDialogVisible.value = true
}

const handleSubmitHistoryCreate = async () => {
  if (!isDoctor.value || !activeRecord.value?.id) {
    ElMessage.warning('当前状态无法新增病史记录')
    return
  }

  const payload = {
    recordId: activeRecord.value.id,
    chronicDisease: historyCreateForm.chronicDisease.trim() || undefined,
    pastMedicalHistory: historyCreateForm.pastMedicalHistory.trim() || undefined,
    allergyHistory: historyCreateForm.allergyHistory.trim() || undefined,
    familyHistory: historyCreateForm.familyHistory.trim() || undefined,
    surgeryHistory: historyCreateForm.surgeryHistory.trim() || undefined,
  }

  if (!payload.familyHistory) {
    ElMessage.warning('请填写家庭病史')
    return
  }

  try {
    const res = await historyStore.saveRecord(payload)
    if (res.code === 1) {
      ElMessage.success(res.message || '病史记录保存成功')
      historyCreateDialogVisible.value = false
      historyQuery.pageNum = 1
      await queryHistoryList()
      return
    }
    ElMessage.error(res.message || '病史记录保存失败')
  } catch {
    ElMessage.error('病史记录保存失败，请稍后重试')
  }
}

const handleViewPhysicalDetail = async (id: number) => {
  if (!id) {
    ElMessage.warning('体检记录ID无效')
    return
  }

  try {
    const detail = await physicalStore.queryDetailById(physicalRole.value, id)
    if (!detail) {
      ElMessage.warning('未查询到体检记录详情')
      return
    }
    physicalDetailDialogVisible.value = true
  } catch {
    ElMessage.error('查询体检记录详情失败，请稍后重试')
  }
}

const handleOpenPhysicalCreate = () => {
  if (!isDoctor.value) {
    ElMessage.warning('当前角色无新增体检记录权限')
    return
  }

  physicalCreateForm.height = 0
  physicalCreateForm.weight = 0
  physicalCreateForm.systolicBp = 0
  physicalCreateForm.diastolicBp = 0
  physicalCreateForm.heartRate = 0
  physicalCreateForm.bloodSugar = 0
  physicalCreateDialogVisible.value = true
}

const toPositiveNumber = (value: number) => {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return num
}

const calcBmi = (heightCm: number, weightKg: number) => {
  if (heightCm <= 0 || weightKg <= 0) {
    return 0
  }
  const heightMeter = heightCm / 100
  return Number((weightKg / (heightMeter * heightMeter)).toFixed(2))
}

const handleSubmitPhysicalCreate = async () => {
  if (!isDoctor.value || !activeRecord.value?.id) {
    ElMessage.warning('当前状态无法新增体检记录')
    return
  }

  const height = toPositiveNumber(physicalCreateForm.height)
  const weight = toPositiveNumber(physicalCreateForm.weight)
  const systolicBp = Math.trunc(toPositiveNumber(physicalCreateForm.systolicBp))
  const diastolicBp = Math.trunc(toPositiveNumber(physicalCreateForm.diastolicBp))
  const heartRate = Math.trunc(toPositiveNumber(physicalCreateForm.heartRate))
  const bloodSugar = toPositiveNumber(physicalCreateForm.bloodSugar)

  if (height <= 0 || weight <= 0) {
    ElMessage.warning('请填写有效的身高和体重')
    return
  }

  if (systolicBp <= 0 || diastolicBp <= 0 || heartRate <= 0 || bloodSugar <= 0) {
    ElMessage.warning('请填写完整且有效的生命体征指标')
    return
  }

  const payload = {
    recordId: activeRecord.value.id,
    height,
    weight,
    systolicBp,
    diastolicBp,
    heartRate,
    bloodSugar,
    bmi: calcBmi(height, weight),
  }

  try {
    const res = await physicalStore.saveRecord(payload)
    if (res.code === 1) {
      ElMessage.success(res.message || '体检记录保存成功')
      physicalCreateDialogVisible.value = false
      physicalQuery.pageNum = 1
      await queryPhysicalList()
      return
    }
    ElMessage.error(res.message || '体检记录保存失败')
  } catch {
    ElMessage.error('体检记录保存失败，请稍后重试')
  }
}

const handleViewExaminationDetail = async (id: number) => {
  if (!id) {
    ElMessage.warning('检查记录ID无效')
    return
  }

  try {
    const detail = await examinationStore.queryDetailById(id)
    if (!detail) {
      ElMessage.warning('未查询到检查记录详情')
      return
    }
    examinationDetailDialogVisible.value = true
  } catch {
    ElMessage.error('查询检查记录详情失败，请稍后重试')
  }
}

const handleOpenExaminationCreate = () => {
  if (!isDoctor.value) {
    ElMessage.warning('当前角色无新增检查记录权限')
    return
  }

  examinationCreateForm.reportTypes = []
  examinationCreateForm.reportContent = ''
  examinationCreateDialogVisible.value = true
}

const handleSubmitExaminationCreate = async () => {
  if (!isDoctor.value || !activeRecord.value?.id) {
    ElMessage.warning('当前状态无法新增检查记录')
    return
  }

  const reportTypes = examinationCreateForm.reportTypes
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
  if (!reportTypes.length) {
    ElMessage.warning('请至少选择一个检测类型')
    return
  }

  const reportContent = examinationCreateForm.reportContent.trim()
  if (!reportContent) {
    ElMessage.warning('请填写检测内容')
    return
  }

  const payload = reportTypes.map((reportType) => ({
    recordId: activeRecord.value!.id,
    reportType,
    reportContent,
  }))

  try {
    const res = await examinationStore.saveReports(payload)
    if (res.code === 1) {
      ElMessage.success(res.message || '检查记录保存成功')
      examinationCreateDialogVisible.value = false
      examinationQuery.pageNum = 1
      await queryExaminationList()
      return
    }
    ElMessage.error(res.message || '检查记录保存失败')
  } catch {
    ElMessage.error('检查记录保存失败，请稍后重试')
  }
}

const handleViewVisit = async (visitId: number) => {
  if (!visitId) {
    ElMessage.warning('无有效问诊记录ID')
    return
  }

  try {
    await diagnosisStore.queryVisitDetail(diagnosisRole.value, visitId)
    visitDialogVisible.value = true
  } catch {
    ElMessage.error('查询问诊记录失败，请稍后重试')
  }
}

const handleEditDiagnosis = async (row: DiagnosisReport) => {
  if (!diagnosisPermissionMap.value[row.id]) {
    ElMessage.warning('当前诊断记录不在可修改权限范围内')
    return
  }

  editingSourceDiagnosis.value = row
  editForm.diagnosisResult = row.diagnosisResult || ''
  editForm.diagnosisDetail = row.diagnosisDetail || ''
  editDialogVisible.value = true
}

const handleSubmitDiagnosisEdit = async () => {
  const source = editingSourceDiagnosis.value
  if (!source || !activeRecord.value) {
    ElMessage.warning('未定位到可修改的诊断记录')
    return
  }

  const diagnosisId = Number(source.id)
  if (!Number.isFinite(diagnosisId) || diagnosisId <= 0) {
    ElMessage.warning('诊断记录ID无效，无法提交修改')
    return
  }

  const diagnosisResult = editForm.diagnosisResult.trim()
  const diagnosisDetail = editForm.diagnosisDetail.trim()
  if (!diagnosisResult || !diagnosisDetail) {
    ElMessage.warning('请填写完整的诊断结果和诊断细节')
    return
  }

  try {
    const res = await diagnosisStore.updateDoctorDiagnosis({
      id: diagnosisId,
      diagnosisResult,
      diagnosisDetail,
    })

    if (res.code === 1) {
      ElMessage.success(res.message || '诊断报告修改成功')
      editDialogVisible.value = false
      await queryDiagnosisList()
      return
    }

    ElMessage.error(res.message || '诊断报告修改失败')
  } catch {
    ElMessage.error('诊断报告修改失败，请稍后重试')
  }
}

const handleDetail = async (record: DoctorHealthRecord) => {
  await openRecordDetail(record.residentId)
}

const handleExportReport = async (record: DoctorHealthRecord) => {
  const detail = await openRecordDetail(record.residentId)
  if (!detail) {
    return
  }
  await nextTick()
  await exportPdf()
}

const backToArchiveList = () => {
  activeDetailTab.value = 'basic'
  diagnosisStore.clearVisitDetail()
  examinationStore.clearDetail()
  physicalStore.clearDetail()
  historyStore.clearDetail()
  healthRecordStore.clearActiveRecord()
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const buildProxyImageUrl = (url: string) => {
  return `/api/common/file/proxy-image?url=${encodeURIComponent(url)}`
}

const waitForImageReady = async () => {
  const img = reportAvatarRef.value
  if (!img) {
    return
  }

  if (img.complete && img.naturalWidth > 0) {
    return
  }

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', onError)
    }

    const onLoad = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      resolve()
    }

    img.addEventListener('load', onLoad)
    img.addEventListener('error', onError)

    setTimeout(() => {
      cleanup()
      resolve()
    }, 2500)
  })
}

const exportPdf = async () => {
  if (!activeRecord.value || !reportRef.value) {
    return
  }

  exportingPdf.value = true
  try {
    if (activeRecord.value.avatarUrl) {
      reportAvatarSrc.value = buildProxyImageUrl(activeRecord.value.avatarUrl)
      await nextTick()
      await waitForImageReady()
    }

    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imageWidth = pageWidth - margin * 2
    const imageHeight = (canvas.height * imageWidth) / canvas.width

    let heightLeft = imageHeight
    let position = margin

    pdf.addImage(imageData, 'JPEG', margin, position, imageWidth, imageHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = margin - (imageHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imageData, 'JPEG', margin, position, imageWidth, imageHeight)
      heightLeft -= pageHeight - margin * 2
    }

    pdf.save(`${activeRecord.value.name || '患者'}-健康档案报表.pdf`)
    ElMessage.success('PDF 已生成并开始下载')
  } catch {
    ElMessage.error('导出 PDF 失败，请稍后重试')
  } finally {
    reportAvatarSrc.value = activeRecord.value?.avatarUrl || fallbackAvatar
    exportingPdf.value = false
  }
}

onMounted(async () => {
  if (isResident.value) {
    const loginUserId = authStore.user?.id
    if (!loginUserId) {
      ElMessage.warning('未获取到居民身份信息，请重新登录')
      return
    }

    const detail = await healthRecordStore.queryResidentRecord(loginUserId)
    if (!detail) {
      ElMessage.info('暂无健康档案信息')
      return
    }

    activeDetailTab.value = 'basic'
    reportAvatarSrc.value = detail.avatarUrl || fallbackAvatar
    return
  }

  await queryRecordList()
})

watch(
  () => activeDetailTab.value,
  async (tab) => {
    if (!activeRecord.value?.id) {
      return
    }

    if (tab === 'diagnosis') {
      diagnosisQuery.pageNum = 1
      await queryDiagnosisList()
      return
    }

    if (tab === 'examination') {
      examinationQuery.pageNum = 1
      await queryExaminationList()
      return
    }

    if (tab === 'physical') {
      physicalQuery.pageNum = 1
      await queryPhysicalList()
      return
    }

    if (tab === 'history') {
      historyQuery.pageNum = 1
      await queryHistoryList()
    }
  },
)
</script>

<style scoped>
.patient-archive-page {
  width: 100%;
  min-height: 100%;
  padding: 8px 16px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f4f7fc;
}

.record-detail-shell {
  width: 100%;
  margin: 0;
  background: #f6f8fb;
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  padding: 4px 6px 2px;
}

.detail-header h2 {
  margin: 0;
  color: #1f2f47;
  font-size: 30px;
  font-weight: 700;
}

.detail-tabs {
  display: flex;
  gap: 26px;
  padding: 0 10px;
  border-bottom: 1px solid #e3e9f3;
  background: #fff;
}

.detail-tab {
  height: 44px;
  border: 0;
  background: transparent;
  color: #5f6f86;
  font-size: 14px;
  cursor: pointer;
  position: relative;
}

.detail-tab.active {
  color: #2d7bff;
  font-weight: 700;
}

.detail-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #2d7bff;
}

.detail-content-wrap {
  padding: 10px;
}

.basic-detail-card {
  background: #fff;
  border: 1px solid #e5ebf3;
  border-radius: 10px;
  overflow: hidden;
}

.basic-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #f1f5fb;
}

.detail-avatar {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dbe4f2;
  background: #fff;
}

.basic-name-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-name-wrap .name-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.basic-name-wrap h3 {
  margin: 0;
  font-size: 38px;
  color: #22324a;
  line-height: 1;
}

.resident-tag {
  padding: 4px 10px;
  border-radius: 12px;
  background: #e8f0ff;
  color: #4f79d8;
  font-size: 12px;
  font-weight: 600;
}

.phone-line {
  margin: 0;
  font-size: 14px;
  color: #6780a2;
}

.basic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
  padding: 16px;
}

.basic-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-item.full {
  grid-column: 1 / -1;
  border: 1px solid #edf1f6;
  border-radius: 8px;
  padding: 12px;
  background: #fafcff;
}

.item-label {
  color: #8a98ad;
  font-size: 12px;
}

.basic-item strong {
  color: #2e405c;
  font-size: 18px;
  font-weight: 600;
}

.basic-item .danger-text {
  color: #cf3f3f;
}

.pending-module-card {
  min-height: 260px;
  border: 1px dashed #cad7ea;
  border-radius: 10px;
  background: #fff;
  display: grid;
  place-content: center;
  text-align: center;
  color: #6b7d95;
}

.pending-module-card h3 {
  margin: 0;
  color: #2a3e5d;
}

.pending-module-card p {
  margin: 6px 0 0;
}

.diagnosis-card {
  background: #fff;
  border: 1px solid #e3eaf4;
  border-radius: 10px;
  padding: 14px;
}

.examination-card {
  background: #fff;
  border: 1px solid #e3eaf4;
  border-radius: 10px;
  padding: 14px;
}

.diagnosis-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.examination-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.diagnosis-date {
  width: 180px;
}

.examination-date {
  width: 180px;
}

.examination-type {
  width: 170px;
}

.examination-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.diagnosis-skeleton {
  height: 220px;
  border-radius: 10px;
  background: #eff3f9;
}

.examination-skeleton {
  height: 220px;
  border-radius: 10px;
  background: #eff3f9;
}

.diagnosis-table {
  width: 100%;
}

.examination-table {
  width: 100%;
}

.diagnosis-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.diagnosis-pagination-row {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #70829a;
  font-size: 13px;
}

.examination-pagination-row {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #70829a;
  font-size: 13px;
}

.visit-detail-panel {
  display: grid;
  gap: 8px;
}

.visit-detail-panel p {
  margin: 0;
  color: #334b68;
  line-height: 1.55;
}

.visit-detail-panel span {
  color: #7a8ea9;
}

.edit-form {
  padding-top: 4px;
}

.edit-form .full-width {
  width: 100%;
}

.detail-action-bar {
  position: fixed;
  right: 24px;
  bottom: 20px;
}

.action-btn-single {
  height: 40px;
  border: 1px solid #d5deec;
  border-radius: 8px;
  padding: 0 16px;
  background: #fff;
  color: #37506f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(18, 33, 56, 0.12);
}

.action-btn-single.primary {
  border: none;
  background: #2d7bff;
  color: #fff;
}

.action-btn-single:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.record-report-sheet {
  width: min(980px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #dce4ef;
  border-radius: 6px;
  padding: 28px 34px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.record-report-sheet {
  width: min(980px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #dce4ef;
  border-radius: 6px;
  padding: 28px 34px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #5d9dff;
  padding-bottom: 12px;
}

.report-header h2 {
  margin: 0;
  font-size: 32px;
  color: #1c2e49;
}

.report-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #65758b;
}

.report-meta p {
  margin: 0;
  font-size: 13px;
  color: #445a77;
  text-align: right;
  line-height: 1.6;
}

.base-info-card {
  margin-top: 18px;
  background: #eef3f9;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.report-avatar {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #d5dfec;
  background: #ffffff;
}

.base-info-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.base-info-grid p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #dce4ef;
  padding-bottom: 4px;
  gap: 12px;
}

.base-info-grid .full-line {
  grid-column: 1 / -1;
}

.base-info-grid span {
  color: #51627b;
  font-size: 13px;
}

.base-info-grid strong {
  color: #20334f;
  font-size: 14px;
  font-weight: 600;
}

.report-section {
  margin-top: 18px;
}

.report-section h3 {
  margin: 0 0 10px;
  padding-left: 8px;
  border-left: 4px solid #2d7bff;
  color: #1f3455;
  font-size: 17px;
}

.history-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.history-grid article {
  border: 1px solid #e0e8f3;
  border-radius: 4px;
  padding: 10px;
  background: #ffffff;
}

.history-grid article.full-width {
  grid-column: 1 / -1;
}

.history-grid h4 {
  margin: 0;
  color: #233955;
  font-size: 14px;
}

.history-grid p {
  margin: 8px 0 0;
  color: #445975;
  font-size: 13px;
  line-height: 1.5;
}

.history-grid p.highlight {
  color: #d34040;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dfe8f3;
  background: #ffffff;
}

.report-table th,
.report-table td {
  border: 1px solid #dfe8f3;
  padding: 8px;
  text-align: left;
  font-size: 12px;
  color: #2a3f5d;
  vertical-align: top;
}

.report-table th {
  background: #f4f7fc;
  font-weight: 700;
}

.empty-cell {
  text-align: center;
  color: #7a8ba2;
}

.exam-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.exam-item {
  border-bottom: 1px dashed #dbe3ef;
  padding-bottom: 8px;
}

.exam-title {
  color: #1f3556;
  font-size: 14px;
  font-weight: 700;
}

.exam-time {
  color: #8b9aaf;
  font-size: 12px;
  margin-top: 2px;
}

.exam-item p {
  margin: 4px 0 0;
  color: #425b79;
  font-size: 13px;
  line-height: 1.45;
}

.empty-text {
  margin: 0;
  color: #7a8ba2;
  font-size: 13px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h3 {
  margin: 0;
  font-size: 20px;
  color: #12233f;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.query-input {
  width: 160px;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.archive-card,
.archive-card-skeleton {
  background: #fff;
  border: 1px solid #dce7f4;
  border-radius: 14px;
  padding: 16px;
}

.archive-card-skeleton {
  height: 280px;
}

.archive-title {
  margin: 0 0 16px;
  color: #1a2a44;
  font-size: 18px;
}

.patient-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.patient-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  background: #f1f5fb;
}

.patient-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.patient-name {
  color: #1a2a44;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.patient-meta {
  color: #637186;
  font-size: 14px;
}

.patient-phone {
  margin: 0;
  color: #3f4d64;
  font-size: 16px;
}

.address-box {
  border-radius: 12px;
  background: #f2f5fa;
  padding: 10px 12px;
  min-height: 84px;
}

.address-label {
  color: #8b96a8;
  font-size: 12px;
}

.address-text {
  margin: 6px 0 0;
  color: #3f4d64;
  font-size: 14px;
  line-height: 1.45;
}

.card-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: #eef3fa;
  color: #1b2c48;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn:hover {
  background: #e5edf8;
}

.action-btn.secondary {
  background: #e8f3ff;
  color: #0b63ce;
}

.action-btn.secondary:hover {
  background: #dbeeff;
}

.page-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.page-info {
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 960px) {
  .patient-archive-page {
    padding: 8px;
  }

  .detail-header h2 {
    font-size: 24px;
  }

  .detail-tabs {
    gap: 14px;
    overflow-x: auto;
  }

  .diagnosis-filter-row {
    flex-wrap: wrap;
  }

  .examination-filter-row {
    flex-wrap: wrap;
  }

  .basic-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .basic-name-wrap h3 {
    font-size: 30px;
  }

  .detail-action-bar {
    right: 16px;
    bottom: 16px;
  }

  .record-report-sheet {
    padding: 18px;
  }

  .query-input {
    width: 140px;
  }
}

@media (max-width: 680px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .query-row {
    width: 100%;
  }

  .query-input {
    width: calc(50% - 5px);
  }

  .archive-grid,
  .history-grid,
  .exam-grid {
    grid-template-columns: 1fr;
  }

  .report-header {
    gap: 8px;
    flex-direction: column;
  }

  .report-meta p {
    text-align: left;
  }

  .base-info-card {
    flex-direction: column;
  }

  .base-info-grid {
    grid-template-columns: 1fr;
  }

  .basic-top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
