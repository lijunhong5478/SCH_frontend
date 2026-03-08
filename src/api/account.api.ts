import type { PageResult, Result } from '@/types/api.types'
import type { Account, AccountQuery, AddDoctorDTO, Department } from '@/types/account.types'
import http from './axios.config'

const API = {
  QUERY_ACCOUNT: '/admin/account/query',
  RESET_PASSWORD: '/admin/account/resetPassword',
  TOGGLE_STATUS: '/admin/account/status',
  DELETE_ACCOUNT: '/admin/account/delete',
  REVERT_ACCOUNT: '/admin/account/revert',
  ADD_DOCTOR: '/admin/doctor',
  GET_ALL_DEPARTMENT: '/common/department/getAll',
} as const

export const queryAccountAPI = (params: AccountQuery) => {
  return http.get<Result<PageResult<Account>>>(API.QUERY_ACCOUNT, { params }) as unknown as Promise<Result<PageResult<Account>>>
}

export const resetPasswordAPI = (userId: number) => {
  return http.put<Result<string>>(API.RESET_PASSWORD, null, { params: { userId } }) as unknown as Promise<Result<string>>
}

export const toggleStatusAPI = (id: number, status: number) => {
  console.log('调用API - 启用禁用:', { id, status, url: API.TOGGLE_STATUS })
  return http.put<Result<string>>(API.TOGGLE_STATUS, null, { params: { id, status } }) as unknown as Promise<Result<string>>
}

export const deleteAccountAPI = (id: number) => {
  return http.put<Result<string>>(`${API.DELETE_ACCOUNT}/${id}`) as unknown as Promise<Result<string>>
}

export const revertAccountAPI = (id: number) => {
  return http.put<Result<string>>(`${API.REVERT_ACCOUNT}/${id}`) as unknown as Promise<Result<string>>
}

export const addDoctorAPI = (data: AddDoctorDTO) => {
  return http.post<Result<string>>(API.ADD_DOCTOR, data) as unknown as Promise<Result<string>>
}

export const getAllDepartmentsAPI = () => {
  return http.get<Result<Department[]>>(API.GET_ALL_DEPARTMENT) as unknown as Promise<Result<Department[]>>
}
