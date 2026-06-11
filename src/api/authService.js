import api from "./axios.js"

export const register = (data) => api.post("/auth/register", data)
export const login = (data) => api.post("/auth/login", data)
export const forgotPassword = (data) => api.post("/auth/forgot-password", data)
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data)
