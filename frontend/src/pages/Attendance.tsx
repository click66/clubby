import Register from "../components/Register"
import { useNavigate, useParams } from "react-router"
import useCourses from "../hooks/courses"
import { useEffect, useState } from "react"
import { Course } from "../models/Course"
import { fetchCourseByUuid } from "../services/courses"

function Attendance() {
    const navigate = useNavigate()
    let { courseUuid } = useParams()
    const allCourses = useCourses()

    const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined)
    const [loaded, setLoaded] = useState<boolean>(false)

    useEffect(() => {
        if (courseUuid) {
            fetchCourseByUuid(courseUuid).then((course: Course) => {
                setSelectedCourse(course)
                setLoaded(true)
            }).catch(() => {
                navigate('/404')
            })
            return
        }

        setLoaded(true)
    }, [courseUuid])

    // TODO Handle the scenario where there are legitimately no courses

    return loaded ? (
        <>
            <h1>Attendance {selectedCourse ? <span className="text-secondary">({selectedCourse.label})</span> : ''}</h1>
            <div className="rounded-3 bg-white p-3 text-dark" id="copy">
                <Register courses={selectedCourse ? [selectedCourse] : [...allCourses.values()]} squashDates={true} />
            </div>
        </>
    ) : ''
}

export default Attendance
