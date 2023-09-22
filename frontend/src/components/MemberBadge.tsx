import { Badge } from 'react-bootstrap'
import { Member } from '../models/Member'

function MemberBadge({ member }: { member: Member }) {
    if (member.expired(new Date())) {
        return <Badge bg="danger">Expired</Badge>
    }

    if (member.activeTrial()) {
        return <Badge bg="warning" className="text-dark">Trial</Badge>
    }

    return <Badge bg="success">Licenced</Badge>
}

export default MemberBadge
