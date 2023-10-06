import { useEffect, useState } from 'react'
import courses from '../domain/courses/provider'
import { Course } from '../domain/courses/types'

function useCourses(): Map<string, Course> {
    const [courseCollection, setCourseCollection] = useState<Map<string, Course>>(new Map())

    useEffect(() => {
        courses.getCourses()
            .then((courses: Course[]) => new Map<string, Course>(courses.map((c) => [c.uuid, c])))
            .then(setCourseCollection)
    }, [])

    return courseCollection
}

export default useCourses
