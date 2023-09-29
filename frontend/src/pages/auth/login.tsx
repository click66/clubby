import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'

import Cookies from 'universal-cookie'
import { http } from '../../utils/http'
import { notifyError } from '../../utils/notifications'
import { AxiosResponse } from 'axios'

const API_URL = import.meta.env.VITE_AUTH_API_URL

function successOrError(r: AxiosResponse) {
    let data = r.data
    if (data.hasOwnProperty('error')) {
        return Promise.reject(new Error(data.error))
    }

    r.data = data.success ?? data
    return r
}

function Login({ loggedIn, setLoggedIn }: { loggedIn: boolean, setLoggedIn: (val: boolean) => void }) {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const cookies = new Cookies()

    const login = (token: string, expireTs: number, refreshToken: string) => {
        cookies.set('jwt_authorisation', token, {
            expires: new Date(expireTs * 1000),
            path: '/',
        })
        cookies.set('jwt_refreshtoken', refreshToken, {
            expires: new Date(Date.now() + (2592000 * 1000)),
            path: '/',
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        http.post(`${API_URL}/login`, { email, password })
            .then(successOrError)
            .then(({ data }) => {
                login(data.token, data.expires, data.refresh_token)
                setLoggedIn(true)
                navigate('/')
            }).catch(notifyError)
    }

    useEffect(() => {
        if (loggedIn) {
            navigate('/')
        }
    }, [])

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="form-outline mb-4">
                    <input type="text" name="email" className="form-control" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}></input>
                </div>
                <div className="form-outline mb-4">
                    <input type="password" name="password" className="form-control" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}></input>
                </div>
                <div className="d-grid gap-2">
                    <input type="submit" value="Sign in" className="btn btn-light"></input>
                </div>
            </form>
        </>
    )
}

export default Login
