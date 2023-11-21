import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AuthenticationError, ConnectivityError, DomainError } from '../errors'
import { TokenContainer } from './tokens'

export type HttpInstance = AxiosInstance

function appendAuthorisation(tokens: TokenContainer, refresh?: () => Promise<void>) {
    return (r: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const token = tokens.getAuthorisationToken()
        const refreshToken = tokens.getRefreshToken()
        if (!token) {
            if (refreshToken && refresh) {
                return refresh().then(() => appendAuthorisation(tokens, refresh)(r))
                    .catch(() => {
                        throw new AuthenticationError('Failed to refresh token')
                    })
            }

            throw new AuthenticationError('Not logged in')
        }

        r.headers = r.headers ?? {}
        r.headers.Authorization = `Bearer ${token}`
        return Promise.resolve(r)
    }
}

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data && data.hasOwnProperty('error')) {
        return Promise.reject(new DomainError(data.error))
    }

    r.data = data?.success ?? data
    return r
}

function handleError(e: Error) {
    if (e instanceof AuthenticationError) {
        throw e
    }

    if (e instanceof AxiosError && e.response && e.response.data && e.response.data.hasOwnProperty('error')) {
        throw new DomainError(e.response.data.error)
    }

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
