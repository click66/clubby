import { AxiosResponse } from 'axios'
import Cookies from 'universal-cookie'
import { z } from 'zod'
import { AuthenticationError } from './errors'
import { createHttp } from './http'

const API_URL = import.meta.env.VITE_AUTH_API_URL
const http = createHttp(API_URL)

const cookies = new Cookies()

export interface Login {
    email: string
    password: string
}

const loginTokenSchema = z.object({
    'token': z.string(),
    'expires': z.number(),
    'refreshToken': z.string().nullable(),
})

export type LoginToken = z.infer<typeof loginTokenSchema>

export type User = {
    uuid: string
    name: string
}

export interface NewUser {
    email: string
    password: string
    confirmPassword: string
}

interface UserActivation {
    uuid: string
    code: string
}

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
    return http.post('/login', data).then(handleTokenResponse)
}

function refreshLoginToken(refreshToken: string): Promise<LoginToken> {
    return http.post('/refresh', { token: refreshToken }).then(handleTokenResponse)
}

function getUser(): Promise<User | null> {
    const authorisationToken = tokens.getAuthorisationToken()
    if (authorisationToken) {
        return http.get('/me', { headers: { 'Authorization': `Bearer ${authorisationToken}` } })
    }

    return Promise.reject(new AuthenticationError('No stored access token can be retrieved.'))
}

export const authentication = {
    register: (domain: string, data: NewUser) => http.post('/register', { ...data, domain }),
    activate: (data: UserActivation) => http.post(`/activate/${data.uuid}`, data),
    login: (data: Login): Promise<User | null> => getLoginToken(data)
        .then(tokens.setToken)
        .then(() => {
            const user = getUser()
            return user ?? Promise.reject(new AuthenticationError('User details could not be resolved.'))
        }),
    attemptRefresh: (): Promise<User | null> => {
        if (tokens.getAuthorisationToken() !== undefined) {
            return getUser().catch(() => {
                tokens.clear()
                return null
            })
        }

        if (tokens.getRefreshToken() !== undefined) {
            return refreshLoginToken(tokens.getRefreshToken())
                .then(tokens.setToken)
                .then(getUser)
                .catch(() => {
                    tokens.clear()
                    return null
                })
        }

        return Promise.reject(new AuthenticationError('No credentials available for refresh.'))
    },
    logout: tokens.clear,
}
