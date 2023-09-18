import axios from 'axios'

import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'

import Cookies from 'universal-cookie'

const API_URL = 'http://auth.southamptonjiujitsu.local:8000'

function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const cookies = new Cookies()

    const login = (token: string, expire_ts: number) => {
        cookies.set('jwt_authorisation', token, {
            expires: new Date(expire_ts*1000),
            path: '/',
        })
    }
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        axios.post(API_URL + '/api/auth/login', { email, password }).then(response => {
            let data = response.data
            if (data.hasOwnProperty('error')) {
                console.log('ERROR')    //TODO
            }

            if (data.hasOwnProperty('success')) {
                login(data.success.token, data.success.expires)
                navigate('/')
            }
        })
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
