import axiosInstance from './axios.config';
import type { ResidentProfile, ResidentRegisterDTO, UpdateProfileDTO } from "@/types/resident.types";
import type { Result } from "@/types/api.types";

export const getResidentAccount = (id: number): Promise<Result<ResidentProfile>> => {
    return axiosInstance.get(`/resident/account/${id}`);
};

export const updateResidentAccount = (data: UpdateProfileDTO): Promise<Result<string>> => {
    return axiosInstance.put('/resident/account', data);
};

export const uploadResidentAvatar = (file: File): Promise<Result<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/common/file/upload', formData);
};

export const registerResidentAccount = (data: ResidentRegisterDTO): Promise<Result<string>> => {
    return axiosInstance.post('/resident/account/register', data);
};
