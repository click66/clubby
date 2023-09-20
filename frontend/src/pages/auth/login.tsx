import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'

import Cookies from 'universal-cookie'
import http from '../../utils/http'
import { notifyError } from '../../utils/notifications'

const API_URL = import.meta.env.VITE_AUTH_API_URL

function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const cookies = new Cookies()

    const login = (token: string, expire_ts: number) => {
        cookies.set('jwt_authorisation', token, {
            expires: new Date(expire_ts * 1000),
            path: '/',
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        http.post(`${API_URL}/auth/login`, { email, password }).then((data) => {
            login(data.token, data.expires)
            navigate('/')
        }).catch(notifyError)
    }

    useEffect(() => {
        if (cookies.get('jwt_authorisation')) {
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
