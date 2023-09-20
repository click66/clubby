import Register from "../components/Register"
import { useNavigate, useParams } from "react-router"
import useCourses from "../hooks/courses"

function Attendance() {
    const navigate = useNavigate()
    let { course_uuid } = useParams()
    const allCourses = useCourses()
    const courses = course_uuid ? allCourses.filter((c) => c.uuid == course_uuid) : allCourses

    if (course_uuid && courses.length == 0) {
        navigate('/404')
    }

    // TODO Handle the scenario where there are legitimately no courses

    return (
        <>
            <h1>Attendance {course_uuid && courses.length == 1 ? <span className="text-secondary">({courses[0].label})</span> : ''}</h1>
            <div className="rounded-3 bg-white p-3 text-dark" id="copy">
                <Register courses={courses} squashDates={true}/>
            </div>
        </>
    )
}

export default Attendance
