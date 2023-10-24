import { AxiosResponse } from 'axios'
import { z } from 'zod'
import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../../utils/http'
import { AuthenticationError } from '../../errors'

const API_URL = import.meta.env.VITE_AUTH_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), new Cookies(), false)
const cookies = new Cookies()

interface DtoChangePassword {
    confirmNewPassword: string
    existingPassword: string
    newPassword: string
}

export interface Login {
    email: string
    password: string
}

const loginTokenSchema = z.object({
    token: z.string(),
    expires: z.number(),
    refreshToken: z.string().nullable(),
})

export type LoginToken = z.infer<typeof loginTokenSchema>

export const tokens = {
    getAuthorisationToken: () => cookies.get('jwt_authorisation'),
    getRefreshToken: () => cookies.get('jwt_refreshtoken'),
    exist: () => cookies.get('jwt_refreshtoken') !== undefined || cookies.get('jwt_authorisation') !== undefined,
    setToken: (token: LoginToken) => {
        cookies.set('jwt_authorisation', token.token, {
            expires: new Date(token.expires * 1000),
            path: '/',
        })
        cookies.set('jwt_refreshtoken', token.refreshToken, {
            expires: new Date(Date.now() + 2592000 * 1000),
            path: '/',
        })
    },
    clear: () => {
        cookies.remove('jwt_authorisation', { path: '/' })
        cookies.remove('jwt_refreshtoken', { path: '/' })
    },
}

function handleTokenResponse({ data }: AxiosResponse) {
    return loginTokenSchema.parse(data)
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
        if (tokens.getAuthorisationToken() !== undefined) {
            return Promise.resolve()
        }

        if (tokens.getRefreshToken() !== undefined) {
            return refreshLoginToken(tokens.getRefreshToken())
                .then(tokens.setToken)
                .catch(() => {
                    tokens.clear()
                })
        }

        return Promise.reject(new AuthenticationError('No credentials found.'))
    },
    logout: tokens.clear,
}
