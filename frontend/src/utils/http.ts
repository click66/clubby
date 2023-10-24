import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AuthenticationError, ConnectivityError } from '../errors'

export type HttpInstance = AxiosInstance

interface TokenContainer {
    get(tokenName: string): any
}

function appendAuthorisation(tokens: TokenContainer, refreshToken?: () => Promise<void>) {
    return (r: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const token = tokens.get('jwt_authorisation')
        if (!token && refreshToken) {
            return refreshToken().then(() => appendAuthorisation(tokens, refreshToken)(r))
                .catch(() => {
                    throw new AuthenticationError('Failed to refresh token')
                })
        }

        r.headers = r.headers ?? {}
        r.headers.Authorization = `Bearer ${token}`
        return Promise.resolve(r)
    }
}

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data && data.hasOwnProperty('error')) {
        return Promise.reject(new Error(data.error))
    }

    r.data = data?.success ?? data
    return r
}

function handleError() {
    throw new ConnectivityError('Please check your internet connection or try again later.')
}

export const http = axios

export function withInterceptors(axiosInstance: AxiosInstance, tokens: TokenContainer, includeAuth: boolean = true, refreshToken?: () => Promise<void>): AxiosInstance {
    if (includeAuth) {
        axiosInstance.interceptors.request.use(appendAuthorisation(tokens, refreshToken), (error) => Promise.reject(error))
    }
    axiosInstance.interceptors.response.use(successOrError, handleError)
    return axiosInstance
}

export function createApiInstance(baseURL: string, tokens: TokenContainer, refreshToken?: () => Promise<void>): HttpInstance {
    return withInterceptors(http.create({ baseURL }), tokens, true, refreshToken)
}
