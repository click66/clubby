import { Link } from "react-router-dom"

import { CollectionFill, PeopleFill, CalendarFill } from "react-bootstrap-icons"

function Portal() {
    return (
        <ul id="portalLinks">
            <li><Link to="/courses"><CollectionFill size={48} /><br />Courses</Link></li>
            <li><Link to="/members"><PeopleFill size={48} /><br />Members</Link></li>
            <li><Link to="/attendance"><CalendarFill size={48} /><br />Attendance</Link></li>
            {/* <li><Link to="/reporting"><BarChartFill size={48} /><br />Reporting</Link></li> */}
        </ul>
    )
}

export default Portal
