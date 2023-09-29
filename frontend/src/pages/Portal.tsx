import '../assets/Portal.page.scss'

import { Link } from "react-router-dom"
import { CollectionFill, PeopleFill, CalendarFill, GearFill, KeyFill } from "react-bootstrap-icons"
import useUser from '../hooks/user'

function Portal() {
    const user = useUser()
    return (
        <ul id="portalLinks">
            <li><Link to="/courses"><CollectionFill size={48} /><br />Courses</Link></li>
            <li><Link to="/members"><PeopleFill size={48} /><br />Members</Link></li>
            <li><Link to="/attendance"><CalendarFill size={48} /><br />Attendance</Link></li>
            <li><Link to="/user"><KeyFill size={48} /><br />User</Link></li>
            {user?.isClubAdmin || user?.isGroupAdmin ? <li><Link to="/admin"><GearFill size={48} /><br />Admin</Link></li> : ''}
            {/* <li><Link to="/reporting"><BarChartFill size={48} /><br />Reporting</Link></li> */}
        </ul>
    )
}

export default Portal
