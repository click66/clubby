import { isSameDay } from 'date-fns'
import { HttpInstance } from '../../utils/http'
import { Course, NewCourse } from './types'

type CourseCache = Map<string, Course>

export function getCourses(http: HttpInstance, cache: CourseCache) {
    return (): Promise<Course[]> => cache.size > 0 ? Promise.resolve([...cache.values()]) : http.get('/courses')
        .then(({ data }) => data.map((d: any) => ({
            ...d,
            dates: (d.dates || []).map((date: string) => new Date(date)),
            nextSession: d.nextSession && new Date(d.nextSession)
        })))
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
            .then(({ data }) => ({
                ...data,
                dates: (data.dates || []).map((d: string) => new Date(d)),
                nextSession: data.nextSession && new Date(data.nextSession),
            }))
            .then((data) => {
                if (data) {
                    cache.set(data.uuid, data)
                }
                return data
            })
}

export function addCourse(http: HttpInstance, cache: CourseCache) {
    return (course: NewCourse): Promise<Course> => http.post('/courses/create', {
        ...course,
        dates: course.dates.map((d) => d.toISOString().split('T')[0]),
    })
        .then(({ data }) => data)
        .then((data: Course) => {
            cache.clear()   // Need to clear because nextSession currently server-side generated
            return data
        })
}

export function deleteCourse(http: HttpInstance, cache: CourseCache) {
    return (course: Course): Promise<void> => http.post(`/courses/${course.uuid}/delete`)
        .then(() => { cache.delete(course.uuid) })
}

export function courseHappensOnDate(course: Course, date: Date): boolean {
    return course.days.includes((date.getDay() + 6) % 7) || course.dates.some(d => isSameDay(d, date))
}
