import { useEffect, useState } from 'react'
import { fetchCourses } from '../services/courses'
import { CourseCollection } from '../models/Course'

function useCourses(): CourseCollection {
    const [courses, setCourses] = useState<CourseCollection>(new Map())

    useEffect(() => {
        fetchCourses().then(setCourses)
    }, [])

    return courses
}

export default useCourses
