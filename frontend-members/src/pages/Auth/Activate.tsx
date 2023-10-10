import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import Spinner from '../../components/Spinner'
import { authentication } from '../../authentication'
import Danger from '../../components/Alerts/Danger'

export default function Activate() {
    const [successful, setSuccessful] = useState<boolean>(false)
    const [pending, setPending] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)
    const search = useLocation().search
    const code = new URLSearchParams(search).get('code')
    const { uuid } = useParams()

    useEffect(() => {
        if (uuid && code) {
            setPending(true)
            authentication.activate({ uuid, code }).then(() => {
                setSuccessful(true)
            }).catch(setError).finally(() => { setPending(false) })
        }
    }, [])

    if (code === null) {
        return <Navigate to="/auth/register" />
    }

    if (successful) {
        return <Navigate to="/auth/login" replace state={{ 'activationSuccess': true }} />
    }

    if (pending) {
        return <Spinner />
    }

    if (error) {
        return <Danger title="Account Activation Failed">{error.message}</Danger>
    }

    return <Navigate to="/" replace />
}
