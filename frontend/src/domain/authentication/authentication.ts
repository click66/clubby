import { AxiosResponse } from 'axios'
import { tokens, LoginToken, makeLoginToken } from '../../utils/tokens'
import { http, withInterceptors } from '../../utils/http'
import { AuthenticationError } from '../../errors'

const API_URL = import.meta.env.VITE_AUTH_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), tokens, false)

interface DtoChangePassword {
    confirmNewPassword: string
    existingPassword: string
    newPassword: string
}

export interface Login {
    email: string
    password: string
}

function handleTokenResponse({ data }: AxiosResponse) {
    return makeLoginToken(data)
}

function getLoginToken(data: Login): Promise<LoginToken> {
    return api.post('/login', data).then(handleTokenResponse)
}

function refreshLoginToken(refreshToken: string): Promise<LoginToken> {
    return api.post('/refresh', { token: refreshToken }).then(handleTokenResponse)
}

export const authentication = {
    changePassword: (data: DtoChangePassword) => api.post('/change_password', data),
    login: (data: Login): Promise<void> => getLoginToken(data)
        .then(tokens.setToken),
    attemptRefresh: (): Promise<void> => {
        if (tokens.getAuthorisationToken() !== null) {
            return Promise.resolve()
        }

        const refreshToken = tokens.getRefreshToken()
        if (refreshToken !== null) {
            return refreshLoginToken(refreshToken)
                .then(tokens.setToken)
                .catch(() => {
                    tokens.clear()
                })
        }

        return Promise.reject(new AuthenticationError('No credentials found.'))
    },
    logout: tokens.clear,
}
