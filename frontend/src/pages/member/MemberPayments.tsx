import MemberHeader from "../../components/MemberHeader"
import useMember from "../../hooks/member"

function MemberPayments() {
    const [member] = useMember()

    return member ? (
        <>
            <MemberHeader member={member} />
            <p>{member.name}</p>
        </>
    ) : 'Loading'
}

export default MemberPayments
