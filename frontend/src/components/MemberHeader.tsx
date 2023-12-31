import { useContext } from 'react'
import MemberBadge from './MemberBadge'
import { MemberContext } from '../contexts/MemberContext'

function MemberHeader() {
    const [member] = useContext(MemberContext)

    return member ? (
        <>
            <div className="mb-3 row">
                <div>
                    <h1 className="d-inline-block pe-2">{member.name}</h1>
                    <MemberBadge member={member} />
                </div>
                {member.joinDate ?
                    <p className="mb-0 memberSubHeading">
                        Member since: {member.joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}&#32;
                        <span className="text-secondary">(Added by: {member.addedBy})</span>
                    </p> : ''}
            </div>
        </>
    ) : 'Loading header...'
}

export default MemberHeader
