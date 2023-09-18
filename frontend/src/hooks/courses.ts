import { useEffect, useState } from "react"
import { fetchCourses } from "../services/courses"
import Course from "../models/Course"
import { useLocation } from "react-router"

function useCourses() {
    const location = useLocation()
    const [courses, setCourses] = useState<Course[]>([])

    useEffect(() => {
        if (location.state?.courses) {
            setCourses(location.state.courses)//.map((c: Course) => new Course(c)))
            return
        }
        fetchCourses().then(setCourses)
    }, [])

    return courses
}

export default useCourses
