import { useLocation, useNavigate } from 'react-router'
import useCourses from '../hooks/courses'
import { useContext } from 'react'
import { MemberContext } from '../contexts/MemberContext'

function MemberTabs({ selected }: { selected: string }) {
    const navigate = useNavigate()
    const location = useLocation()
    const courses = useCourses()
    const [member] = useContext(MemberContext)

    const replacePath = (newWord: string) => {
        const currentPath = location.pathname
        const lastIndex = currentPath.lastIndexOf('/')
        if (lastIndex !== -1) {
            const newPath = currentPath.substring(0, lastIndex + 1) + newWord
            navigate(newPath, { state: { courses, member } })
        }
    }

    return (
        <ul className="nav nav-tabs" id="tabsMember" role="tablist">
            <li className="nav-item" role="presentation">
                <button onClick={() => replacePath('profile')} className={"nav-link " + (selected == "profile" ? "active" : "")} id="tabProfile" data-bs-toggle="tab" data-bs-target="#tabCopyProfile" type="button" role="tab" aria-controls="tabCopyProfile" aria-selected="true" data-tabkey="profile">Profile</button>
            </li>
            <li className="nav-item" role="presentation">
                <button onClick={() => replacePath('licence')} className={"nav-link " + (selected == "licence" ? "active" : "")} id="tabLicence" data-bs-toggle="tab" data-bs-target="#tabCopyLicence" type="button" role="tab" aria-controls="tabCopyLicence" aria-selected="false" data-tabkey="licence">Licence</button>
            </li>
            {/* <li className="nav-item" role="presentation">
                <button className={"nav-link " + (selected == "notes" ? "active" : "")} id="tabNotes" data-bs-toggle="tab" data-bs-target="#tabCopyNotes" type="button" role="tab" aria-controls="tabCopyNotes" aria-selected="false" data-tabkey="notes">Notes</button>
            </li> */}
            <li className="nav-item" role="presentation">
                <button onClick={() => replacePath('payments')} className={"nav-link " + (selected == "payments" ? "active" : "")} id="tabPayments" data-bs-toggle="tab" data-bs-target="#tabCopyPayments" type="button" role="tab" aria-controls="tabCopyPayments" aria-selected="false" data-tabkey="payments">Payments</button>
            </li>
        </ul>
    )
}

export default MemberTabs
