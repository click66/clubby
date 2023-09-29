import jwtDecode from 'jwt-decode'
import { useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

export default function useUser() {
    const cookies = new Cookies()
    const [user, setUser] = useState<User | undefined>(undefined)

    useEffect(() => {
        const token = cookies.get('jwt_authorisation')
        if (token) {
            const decoded = jwtDecode(token) as {user_uuid: string}
            setUser({
                uuid: decoded.user_uuid,
                isClubAdmin: false,
                isGroupAdmin: false,
            })
        }
    }, [])

    return user
}
