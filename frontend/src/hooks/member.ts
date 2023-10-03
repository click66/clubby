import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { membersApi } from '../domain/members/provider'
import { Member } from '../domain/members/types'

function useMember(): [Member | undefined, Dispatch<SetStateAction<Member | undefined>>] {
    const navigate = useNavigate()
    let { memberUuid } = useParams()
    const [member, setMember] = useState<Member | undefined>(undefined)

    useEffect(() => {
        if (memberUuid && member === undefined) {
            membersApi.getMember(memberUuid).then(setMember).catch(() => navigate('/404'))
        }
    }, [])

    return [member, setMember]
}

export default useMember
