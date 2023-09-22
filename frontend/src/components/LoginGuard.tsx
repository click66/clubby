import axios, { AxiosResponse } from 'axios'
import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import Cookies from 'universal-cookie'

const API_URL = import.meta.env.VITE_AUTH_API_URL

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data.hasOwnProperty('error')) {
        return Promise.reject(new Error(data.error))
    }

    r.data = data.success ?? data
    return r
}

function LoginGuard({ children, loggedIn, setLoggedIn }: PropsWithChildren & { loggedIn: boolean, setLoggedIn: (val: boolean) => void }) {
    const cookies = new Cookies(),
        tokens = cookies
    const token = cookies.get('jwt_authorisation')
    const refreshToken = tokens.get('jwt_refreshtoken')

    const login = (token: string, expireTs: number, refreshToken: string) => {
        const cookies = new Cookies()
        cookies.set('jwt_authorisation', token, {
            expires: new Date(expireTs * 1000),
            path: '/',
        })
        cookies.set('jwt_refreshtoken', refreshToken, {
            expires: new Date(Date.now() + (2592000 * 1000)),
            path: '/',
        })
    }

    const attemptLoginRefresh = () => {
        axios.post(`${API_URL}/auth/refresh`, { token: refreshToken })
            .then(successOrError).then(({ data }) => {
                login(data.token, data.expires, data.refresh_token)
                setLoggedIn(true)
            }).catch(() => {
                tokens.remove('jwt_authorisation', { path: '/' })
                tokens.remove('jwt_refreshtoken', { path: '/' })
            })
    }

    if (!token) {
        setLoggedIn(false)
    }

    if (!loggedIn) {
        if (refreshToken) {
            attemptLoginRefresh()
            return '...'
        }

        return <Navigate to='/auth/login' />
    }

    return children
}

export default LoginGuard
