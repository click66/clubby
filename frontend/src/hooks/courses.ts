import { useEffect, useState } from 'react'
import { fetchCourses } from '../services/courses'
import { CourseCollection}  from '../models/Course'
import { useLocation } from 'react-router'

function useCourses() {
    const location = useLocation()
    const [courses, setCourses] = useState<CourseCollection>(new Map())

    useEffect(() => {
        if (location.state?.courses) {
            setCourses(location.state.courses)
            return
        }
        fetchCourses().then(setCourses)
    }, [])

    return courses
}

export default useCourses
