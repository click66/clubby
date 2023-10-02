import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getMember } from '../domain/members/members'
import { V1MemberFactory } from '../domain/MemberFactory'
import { createApiInstance } from '../utils/http'
import Cookies from 'universal-cookie'
import { Member } from '../domain/members/types'

function useMember(): [Member | undefined, Dispatch<SetStateAction<Member | undefined>>] {
    const cookies = new Cookies()
    const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
    const httpMembers = createApiInstance(LEGACY_API_URL, cookies)

    const navigate = useNavigate()
    let { memberUuid } = useParams()
    const [member, setMember] = useState<Member | undefined>(undefined)

    useEffect(() => {
        if (memberUuid && member === undefined) {
            getMember(httpMembers, new V1MemberFactory())(memberUuid).then(setMember).catch(() => navigate('/404'))
        }
    }, [])

    return [member, setMember]
}

export default useMember
