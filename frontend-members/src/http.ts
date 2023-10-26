import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { ConnectivityError, DomainError } from './errors'

export type Http = AxiosInstance

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data && data.hasOwnProperty('error')) {
        return Promise.reject(new DomainError(data.error))
    }

    r.data = data?.success ?? data
    return r
}

function handleError(e: AxiosError) {
    const data = e.response?.data as any
    if (e instanceof AxiosError && data && (data.hasOwnProperty('error') || data.hasOwnProperty('detail'))) {
        throw new DomainError(data?.error || data?.detail)
    }
    throw new ConnectivityError('Please check your internet connection or try again later.')
}

export function createHttp(baseURL: string): Http {
    const http = axios.create({ baseURL })
    http.interceptors.response.use(successOrError, handleError)
    return http
}
