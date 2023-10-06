import Register from '../components/Register'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import EscapeLink from '../components/EscapeLink'
import { notifyError } from '../utils/notifications'
import { Course } from '../domain/courses/types'
import courses from '../domain/courses/provider'

function Attendance() {
    const navigate = useNavigate()
    let { courseUuid } = useParams()
    const [allCourses, setAllCourses] = useState<Course[]>([])

    const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined)
    const [loaded, setLoaded] = useState<boolean>(false)

    useEffect(() => {
        if (courseUuid) {
            courses.getCourse({ uuid: courseUuid }).then((course: Course) => {
                setSelectedCourse(course)
                setLoaded(true)
            }).catch(() => {
                navigate('/404')
            })
        } else {
            courses.getCourses().then(setAllCourses).then(() => setLoaded(true)).catch(notifyError)
        }
    }, [courseUuid])

    if (!loaded) return ''

    return (
        <>
            <h1>Attendance {selectedCourse ? <span className="text-secondary">({selectedCourse.label})</span> : ''}</h1>
            <div className="rounded-3 bg-white p-3 text-dark fullTable" id="copy">
                {
                    !selectedCourse && allCourses.length === 0 ? (
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
