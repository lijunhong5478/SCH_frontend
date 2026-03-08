import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account, AccountQuery, AddDoctorDTO, Department } from '@/types/account.types'
import {
  queryAccountAPI,
  resetPasswordAPI,
  toggleStatusAPI,
  deleteAccountAPI,
  revertAccountAPI,
  addDoctorAPI,
  getAllDepartmentsAPI,
} from '@/api/account.api'

export const useAccountStore = defineStore('account', () => {
  const accountList = ref<Account[]>([])
  const total = ref(0)
  const departments = ref<Department[]>([])

  const queryAccount = async (params: AccountQuery) => {
    const res = await queryAccountAPI(params)
    accountList.value = (res.data.dataList || []).map((item) => ({
      ...item,
      avatarUrl: item.avatarUrl || item.avatar || '',
    }))
    total.value = res.data.total
  }

  const resetPassword = async (userId: number) => {
    const res = await resetPasswordAPI(userId)
    return res
  }

  const toggleStatus = async (id: number, status: number) => {
    const res = await toggleStatusAPI(id, status)
    return res
  }

  const toggleDelete = async (id: number, isDeleted: number) => {
    const res = isDeleted === 0 ? await deleteAccountAPI(id) : await revertAccountAPI(id)
    return res
  }

  const addDoctor = async (data: AddDoctorDTO) => {
    const res = await addDoctorAPI(data)
    return res
  }

  const getAllDepartments = async () => {
    const res = await getAllDepartmentsAPI()
    departments.value = Array.isArray(res.data) ? res.data : []
    return departments.value
  }

  return {
    accountList,
    total,
    departments,
    queryAccount,
    resetPassword,
    toggleStatus,
    toggleDelete,
    addDoctor,
    getAllDepartments,
  }
})
