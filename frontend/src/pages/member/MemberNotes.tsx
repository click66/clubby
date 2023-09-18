import MemberHeader from "../../components/MemberHeader"
import useMember from "../../hooks/member"

function MemberNotes() {
    const [member] = useMember()

    return member ? (
        <>
            <MemberHeader member={member} />
            <p>{member.name}</p>
        </>
    ) : 'Loading'
}

export default MemberNotes