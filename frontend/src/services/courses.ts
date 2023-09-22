import Cookies from 'universal-cookie'
import { Course, CourseCollection } from '../models/Course'
import { http, withInterceptors } from '../utils/http'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), new Cookies())

export type DtoCourse = {
    uuid: string
    label: string
    days: number[]
    next_session_date: string
}

export type DtoNewCourse = {
    label: string
    days: number[]
}

export function fetchCourses(): Promise<CourseCollection> {
    return api.get('/courses')
        .then(({ data }) => new Map(data.map((d: DtoCourse) => [d.uuid, new Course(d)])))
}

export function fetchCourseByUuid(uuid: string): Promise<Course> {
    return api.get(`/courses/${uuid}`)
        .then(({ data }) => new Course(data))
}

export function addCourse(c: DtoNewCourse): Promise<Course> {
    return api.post('/courses/add', {
        courseName: c.label,
        courseDay: c.days,
    }).then(({ data }) => new Course(data))
}

export function deleteCourse(c: Course): Promise<void> {
    if (c.uuid) {
        return api.post(`/courses/delete/${c.uuid}`)
    }

    return Promise.resolve()
}
