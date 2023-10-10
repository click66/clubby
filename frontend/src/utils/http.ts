import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ConnectivityError, DomainError } from '../errors'

export type HttpInstance = AxiosInstance

interface TokenContainer {
    get(tokenName: string): any
}

function appendAuthorisation(tokens: TokenContainer) {
    return (r: InternalAxiosRequestConfig) => {
        const token = tokens.get('jwt_authorisation')

        if (!token) {
            throw Error('Authorization error')
        }

        r.headers = r.headers ?? {}
        r.headers.Authorization = `Bearer ${token}`
        return r
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

function handleError() {
    throw new ConnectivityError('Please check your internet connection or try again later.')
}

export const http = axios

export function withInterceptors(axiosInstance: AxiosInstance, tokens: TokenContainer): AxiosInstance {
    axiosInstance.interceptors.request.use(appendAuthorisation(tokens), (error) => Promise.reject(error))
    axiosInstance.interceptors.response.use(successOrError, handleError)
    return axiosInstance
}

export function createApiInstance(baseURL: string, tokens: TokenContainer): HttpInstance {
    return withInterceptors(http.create({ baseURL }), tokens)
}
