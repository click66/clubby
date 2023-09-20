import Course from "../models/Course"
import http from "../utils/http"

const API_URL = import.meta.env.VITE_LEGACY_API_URL

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

export function fetchCourses(): Promise<Course[]> {
    return http.get(API_URL + '/courses')
        .then((d: DtoCourse[]) => d.map((d: DtoCourse) => new Course(d)))
}

export function fetchCourseByUuid(uuid: string): Promise<Course> {
    return http.get(API_URL + '/courses/' + uuid)
        .then((d: DtoCourse) => new Course(d))
}

export function addCourse(c: DtoNewCourse): Promise<Course> {
    return http.post(API_URL + '/courses/add', {
        courseName: c.label,
        courseDay: c.days,
    }).then((d: DtoCourse) => new Course(d))
}

export function deleteCourse(c: Course): Promise<void> {
    if (c.uuid) {
        return http.post(API_URL + '/courses/delete/' + c.uuid)
    }

    return Promise.resolve()
}
