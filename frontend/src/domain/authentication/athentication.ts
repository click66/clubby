import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../../utils/http'

const API_URL = import.meta.env.VITE_AUTH_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), new Cookies())

interface DtoChangePassword {
    confirmNewPassword: string
    existingPassword: string
    newPassword: string
}

export function changePassword(data: DtoChangePassword) {
    return api.post('/change_password', data)
}
