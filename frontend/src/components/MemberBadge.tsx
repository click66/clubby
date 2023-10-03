import { Badge } from 'react-bootstrap'
import { Member } from '../domain/members/types'

function MemberBadge({ member }: { member: Member }) {
    if (!member.active) {
        return <Badge bg="danger">Inactive</Badge>
    }

    if ((member.hasLicence() && member.isLicenceExpired(new Date()))
        || (!member.hasLicence() && member.remainingTrialSessions <= 0)) {
        return <Badge bg="danger">Expired</Badge>
    }

    if (!member.hasLicence() && member.remainingTrialSessions > 0) {
        return <Badge bg="warning" className="text-dark">Trial</Badge>
    }

    return <Badge bg="success">Licenced</Badge>
}

export default MemberBadge
