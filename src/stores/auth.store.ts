import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginUserVO, LoginResponse } from '@/types/api.types';
import { mapRoleTypeToString, ResponseCode } from '@/types/api.types';
import { authApi } from '@/api/auth.api';
import { registerResidentAccount } from '@/api/resident.api';
import type { ResidentRegisterDTO } from '@/types/resident.types';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

interface ChangePasswordResult {
  success: boolean;
  message: string;
}

interface RegisterResult {
  success: boolean;
  message: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  const user = ref<User | null>(readPersistedUser());

  function readPersistedUser(): User | null {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const isAdmin = computed(() => userRole.value === 'admin');
  const isDoctor = computed(() => userRole.value === 'doctor');
  const isResident = computed(() => userRole.value === 'resident');

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
  }

  function setUser(userData: User) {
    user.value = userData;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  }

  function setUserFromLogin(loginData: LoginUserVO) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _, roleType, ...userInfo } = loginData;
    const role = mapRoleTypeToString(roleType);

    setUser({
      ...userInfo,
      role,
    });
  }

  function loginSuccess(loginResponse: LoginResponse) {
    const { data } = loginResponse;
    setToken(data.token);
    setUserFromLogin(data);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  async function changePassword(oldPassword: string, newPassword: string): Promise<ChangePasswordResult> {
    const normalizedOldPassword = oldPassword.trim();
    const normalizedNewPassword = newPassword.trim();

    if (!normalizedOldPassword || !normalizedNewPassword) {
      return {
        success: false,
        message: '请输入旧密码和新密码',
      };
    }

    try {
      const response = await authApi.changePassword({
        oldPassword: normalizedOldPassword,
        newPassword: normalizedNewPassword,
      });

      if (response.code === ResponseCode.SUCCESS) {
        return {
          success: true,
          message: response.message || '密码修改成功',
        };
      }

      if (response.code === 0) {
        return {
          success: false,
          message: response.message || '输入的密码有误',
        };
      }

      return {
        success: false,
        message: response.message || '密码修改失败，请稍后重试',
      };
    } catch {
      return {
        success: false,
        message: '修改密码请求失败，请检查网络后重试',
      };
    }
  }

  async function registerResident(payload: ResidentRegisterDTO): Promise<RegisterResult> {
    try {
      const response = await registerResidentAccount(payload);
      if (response.code === ResponseCode.SUCCESS) {
        return {
          success: true,
          message: response.message || '注册成功，请登录！',
        };
      }

      if (response.code === 0) {
        return {
          success: false,
          message: '注册失败，用户已存在！',
        };
      }

      return {
        success: false,
        message: response.message || '注册失败，请检查输入信息',
      };
    } catch {
      return {
        success: false,
        message: '注册请求失败，请稍后重试',
      };
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    isAdmin,
    isDoctor,
    isResident,
    setToken,
    setUser,
    setUserFromLogin,
    loginSuccess,
    logout,
    changePassword,
    registerResident,
  };
});