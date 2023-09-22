import { useContext } from 'react'
import MemberHeader from '../../components/MemberHeader'
import { MemberContext } from '../../contexts/MemberContext'

function MemberNotes() {
    const [member] = useContext(MemberContext)

    return member ? (
        <>
            <MemberHeader />
            <p>{member.name}</p>
        </>
    ) : 'Loading'
}

export default MemberNotes
