import Cookies from 'universal-cookie'
import { z } from 'zod'

const loginTokenSchema = z.object({
    token: z.string(),
    expires: z.number(),
    refreshToken: z.string().nullable(),
})

export type LoginToken = z.infer<typeof loginTokenSchema>

export function makeLoginToken(data: any) {
    return loginTokenSchema.parse(data)
}

const cookies = new Cookies()

export interface TokenContainer {
    getAuthorisationToken: () => string | null
    getRefreshToken: () => string | null
    exist: () => boolean
    setToken: (token: LoginToken) => void
    clear: () => void
}

export const tokens: TokenContainer = {
    getAuthorisationToken: () => cookies.get('jwt_authorisation') || null,
    getRefreshToken: () => cookies.get('jwt_refreshtoken') || null,
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
