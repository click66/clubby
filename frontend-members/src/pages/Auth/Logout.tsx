import { authentication } from '../../authentication'
import { useContext, useEffect } from 'react'
import { UserContext } from '../../contexts/UserContext'
import { useNavigate } from 'react-router'
import Spinner from '../../components/Spinner'

export default function Logout() {
    const [_, setUser] = useContext(UserContext)
    const navigate = useNavigate()

    useEffect(() => {
        authentication.logout()
        setUser(null)
        navigate('/')
    }, [])

    return <Spinner />
}
