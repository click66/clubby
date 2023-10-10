import axios from 'axios'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import Spinner from '../../components/Spinner'

const API_URL = import.meta.env.VITE_AUTH_API_URL

interface UserActivation {
    uuid: string
    code: string
}

function activateUser(data: UserActivation) {
    return axios.create({ baseURL: API_URL }).post(`/activate/${data.uuid}`, data).then((data) => console.log(data))
}

export default function Activate() {
    const [successful, setSuccessful] = useState<boolean>(false)
    const [pending, setPending] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const search = useLocation().search
    const code = new URLSearchParams(search).get('code')
    const { uuid } = useParams()

    useEffect(() => {
        if (uuid && code) {
            setPending(true)
            activateUser({ uuid, code }).then(() => {
                setSuccessful(true)
                setPending(false)
            }).catch(setError)
        }
    })

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
        return error
    }

    return <Navigate to="/" replace />
}
