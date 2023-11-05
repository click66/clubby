import { PropsWithChildren, useState } from 'react'
import { Navigate } from 'react-router'
import { authentication } from '../domain/authentication/authentication'
import { tokens } from '../utils/tokens'

function LoginGuard({ children, loggedIn, setLoggedIn }: PropsWithChildren & { loggedIn: boolean, setLoggedIn: (val: boolean) => void }) {
    const [pending, setPending] = useState<boolean>(false)

    if (!loggedIn && !pending) {
        if (tokens.exist()) {
            setPending(true)
            authentication.attemptRefresh()
                .then(() => setLoggedIn(true))
                .finally(() => setPending(false))
        } else {
            setLoggedIn(false)
        }
    }

    if (pending) {
        return <div className="loading bg-dark" />
    }

    if (loggedIn) {
        return children
    }

    return <Navigate to="/auth/login" />
}

export default LoginGuard
