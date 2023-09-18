import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import Member from "../models/Member"
import { fetchMemberByUuid } from "../services/members"

function useMember(): [Member | undefined, Dispatch<SetStateAction<Member | undefined>>] {
    const location = useLocation()
    const navigate = useNavigate()
    let { memberUuid } = useParams()
    const [member, setMember] = useState<Member | undefined>(undefined)

    useEffect(() => {
        if (location.state?.member) {
            setMember(new Member(location.state.member))
            return
        }
        if (memberUuid && member === undefined) {
            fetchMemberByUuid(memberUuid).then(setMember).catch(() => navigate('/404'))
        }
    }, [])

    return [member, setMember]
}

export default useMember
