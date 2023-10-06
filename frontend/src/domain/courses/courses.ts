import { HttpInstance } from '../../utils/http'
import { Course, Day, NewCourse } from './types'

type CourseCache = Map<string, Course>

export function getCourses(http: HttpInstance, cache: CourseCache) {
    return (): Promise<Course[]> => cache.size > 0 ? Promise.resolve([...cache.values()]) : http.get('/courses')
        .then(({ data }) => data.map((d: any) => ({ ...d, nextSession: new Date(d.nextSession) })))
        .then((data) => {
            data.forEach((d: Course) => {
                cache.set(d.uuid, d)
            })

            return data
        })
}

export function getCourse(http: HttpInstance, cache: CourseCache) {
    return ({ uuid }: { uuid: string }): Promise<Course> => cache.has(uuid) ? Promise.resolve(cache.get(uuid)) :
        http.get(`/courses/${uuid}`)
            .then(({ data }) => data).then((data) => {
                if (data) {
                    cache.set(data.uuid, data)
                }
                return data
            })
}

export function addCourse(http: HttpInstance, cache: CourseCache) {
    return (course: NewCourse): Promise<Course> => http.post('/courses/add', course)
        .then(({ data }) => data)
        .then((data: Course) => {
            cache.clear()   // Need to clear because nextSession currently server-side generated
            return data
        })
}

export function deleteCourse(http: HttpInstance, cache: CourseCache) {
    return (course: Course): Promise<void> => http.post(`/courses/delete/${course.uuid}`)
        .then(() => { cache.delete(course.uuid) })
}

export function courseHappensOnDay(course: Course, day: Day): boolean {
    return course.days.includes(day)
}
