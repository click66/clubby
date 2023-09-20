import { useContext } from "react"
import MemberHeader from "../../components/MemberHeader"
import { MemberContext } from "../../contexts/MemberContext"

function MemberPayments() {
    const [member] = useContext(MemberContext)

    return member ? (
        <>
            <MemberHeader />
            <p>{member.name}</p>
        </>
    ) : 'Loading'
}

export default MemberPayments
