import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

interface TokenContainer {
    get(tokenName: string): any
}

function appendAuthorisation(tokens: TokenContainer) {
    return (r: InternalAxiosRequestConfig) => {
        const token = tokens.get('jwt_authorisation')

        r.headers = r.headers ?? {}
        r.headers.Authorization = `Bearer ${token}`
        return r
    }
}

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data.hasOwnProperty('error')) {
        return Promise.reject(new Error(data.error))
    }

    r.data = data.success ?? data
    return r
}

function handleFail(e: AxiosError) {
    if (e.response && e.response.status === 401) {
        // TODO - Token refresh flow
    }
}

axios.interceptors.response.use(successOrError, handleFail)

export const http = axios

export function withInterceptors(axiosInstance: AxiosInstance, tokens: TokenContainer): AxiosInstance {
    axiosInstance.interceptors.request.use(appendAuthorisation(tokens), (error) => Promise.reject(error))
    axiosInstance.interceptors.response.use(successOrError, handleFail)
    return axiosInstance
}
