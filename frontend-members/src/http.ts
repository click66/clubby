import axios, { AxiosError, AxiosResponse } from 'axios'
import { ConnectivityError, DomainError } from './errors'

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
    if (e instanceof AxiosError && data.hasOwnProperty('error')) {
        throw new DomainError(data.error)
    }
    throw new ConnectivityError('Please check your internet connection or try again later.')
}

export function createHttp(baseURL: string) {
    const http = axios.create({ baseURL })
    // http.interceptors.request.use(appendAuthorisation(tokens), (error) => Promise.reject(error))
    http.interceptors.response.use(successOrError, handleError)
    return http
}
