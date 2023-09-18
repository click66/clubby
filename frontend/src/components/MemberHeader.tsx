import Member from "../models/Member";
import MemberBadge from "./MemberBadge";

function MemberHeader({ member }: { member: Member }) {
    return (
        <>
            <div className="mb-3 row">
                <div>
                    <h1 className="d-inline-block pe-2">{member.name}</h1>
                    <MemberBadge member={member} />
                </div>
                <p className="mb-0">
                    Member since: {member.joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}&nbsp;
                    <span className="text-secondary">(Added by: {member.addedBy})</span>
                </p>
            </div>
        </>
    )
}

export default MemberHeader
