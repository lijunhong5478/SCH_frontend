export interface ResidentProfile {
    userId: number;
    username: string;
    phone: string;
    avatarUrl: string;
    status: number;
    residentId: number;
    name: string;
    gender: number;
    age: number;
    contact: string;
    address: string;
}

export interface UpdateProfileDTO {
    address: string;
    age: number;
    avatarUrl: string;
    contact: string;
    gender: number;
    id: number;
    name: string;
    phone: string;
    username: string;
}

export interface ResidentRegisterDTO {
    address: string;
    age: number;
    avatarUrl: string;
    contact: string;
    gender: number;
    idCard: string;
    name: string;
    password: string;
    phone: string;
    username: string;
}
