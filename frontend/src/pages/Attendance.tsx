import Register from '../components/Register'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import { Course, CourseCollection } from '../models/Course'
import { fetchCourseByUuid, fetchCourses } from '../services/courses'
import EscapeLink from '../components/EscapeLink'

function Attendance() {
    const navigate = useNavigate()
    let { courseUuid } = useParams()
    const [allCourses, setAllCourses] = useState<CourseCollection>(new Map())

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
        } else {
            fetchCourses().then((courses) => {
                setAllCourses(courses)
                setLoaded(true)
            })
        }
    }, [courseUuid])

    if (!loaded) return ''

    return (
        <>
            <h1>Attendance {selectedCourse ? <span className="text-secondary">({selectedCourse.label})</span> : ''}</h1>
            <div className="rounded-3 bg-white p-3 text-dark fullTable" id="copy">
                {
                    !selectedCourse && allCourses.size === 0 ? (
                        <>
                            <p className="text-center">You currently have no courses configured. Add a course to start tracking attendance.</p>
                            <span className="text-center"><EscapeLink to="/courses">Manage Courses</EscapeLink></span>
                        </>
                    ) : <Register courses={selectedCourse ? [selectedCourse] : [...allCourses.values()]} squashDates={true} />
                }
            </div>
        </>
    )
}

export default Attendance
