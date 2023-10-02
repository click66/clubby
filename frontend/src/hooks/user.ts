import jwtDecode from 'jwt-decode'
import { useEffect, useState } from 'react'
import Cookies from 'universal-cookie'
import { User } from '../domain/authentication/types'

interface TokenPayload {
    userUuid: string
    tenantUuid: string
    isSuperuser: boolean
    isStaff: boolean
}

export default function useUser() {
    const cookies = new Cookies()
    const [user, setUser] = useState<User | undefined>(undefined)

    useEffect(() => {
        const token = cookies.get('jwt_authorisation')
        if (token) {
            const { userUuid, isSuperuser, isStaff } = jwtDecode(token) as TokenPayload
            setUser({
                uuid: userUuid,
                isClubAdmin: isStaff,
                isGroupAdmin: isSuperuser,
            })
        }
    }, [])

    return user
}
