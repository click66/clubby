import { createApiInstance } from '../../utils/http'
import { tokens } from '../../utils/tokens'
import { authentication } from '../authentication/authentication'

interface DtoChangePassword {
    confirmNewPassword: string
    existingPassword: string
    newPassword: string
}

const API_URL = import.meta.env.VITE_AUTH_API_URL
const http = createApiInstance(API_URL, tokens, authentication.attemptRefresh)

export default {
    changePassword: (data: DtoChangePassword) => http.post('/change_password', data),
}
