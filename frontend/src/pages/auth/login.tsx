import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'
import { notifyError } from '../../utils/notifications'
import { authentication } from '../../domain/authentication/authentication'

function Login({ loggedIn }: { loggedIn: boolean }) {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        authentication.login({ email, password })
            .then(() => navigate('/'))
            .catch(notifyError)
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
                    <input type="text" name="email" className="form-control" placeholder="Username or Email" value={email} onChange={e => setEmail(e.target.value)}></input>
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
