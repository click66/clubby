import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../utils/http'

const cookies = new Cookies()
const API_URL = import.meta.env.VITE_API_URL
const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), cookies)
const legacyApi = withInterceptors(http.create({ baseURL: LEGACY_API_URL }), cookies)

type DtoAttendanceQuerySingle = {
    student_uuid: string
    course_uuid: string
    date: Date
}

type DtoNewAttendance = {
    student_uuid: string
    course_uuid: string
    date: Date
    resolution: string | null
    paymentOption: string | undefined
}

type DtoAttendance = {
    id: number
    student_uuid: string
    course_uuid: string
    date: Date
    resolution: string
}

interface Course {
    uuid: string
}

interface Member {
    uuid: string
}

interface Attendance {
    id: number
    member: Member
    course: Course
    date: Date
    resolution: string
}

type AttendancesQuery = {
    members: Member[]
    courses: Course[]
    dateEarliest: Date
    dateLatest: Date
}

const isoDate = (date: Date) => date.toISOString().split('T')[0]

export function getMemberAttendances({ members, courses, dateEarliest, dateLatest }: AttendancesQuery): Promise<Attendance[]> {
    const memberUuids = members.map((member) => member.uuid)

    return Promise.all(courses.map((course) => api.post('/attendance/query', {
        student_uuids: memberUuids,
        course_uuid: course.uuid,
        date_earliest: isoDate(dateEarliest),
        date_latest: isoDate(dateLatest),
    })))
        .then((responses) => responses.map((r) => r.data).flat())
        .then((data) => data.map((d: DtoAttendance): Attendance => {
            return {
                id: d.id,
                member: { uuid: d.student_uuid },
                course: { uuid: d.course_uuid },
                date: new Date(d.date),
                resolution: d.resolution,
            }
        }))
}

export function logAttendance(data: DtoNewAttendance) {
    const attendanceService = api.post('/attendance/create', { ...data, date: isoDate(data.date) })

    // TODO Should only use a single request and leverage an asynchronous worker
    const studentService = legacyApi.post('/attendance/log', {
        student_uuid: data.student_uuid,
        sess_date: isoDate(data.date),
        product: data.course_uuid,
        payment: data.resolution,
        payment_option: data.paymentOption,
    })

    return Promise.all([attendanceService, studentService])
        .then(([{ data }, _]) => { return { ...data, date: new Date(data.date) } })
}

export function deleteAttendance(query: DtoAttendanceQuerySingle) {
    const attendanceService = api.post('/attendance/delete', {
        ...query,
        student_uuids: [query.student_uuid],
        date_earliest: isoDate(query.date),
        date_latest: isoDate(query.date),
    })

    const studentService = legacyApi.post('/attendance/clear', {
        student_uuid: query.student_uuid,
        sess_date: isoDate(query.date),
        product: query.course_uuid,
    })

    return Promise.all([attendanceService, studentService])
}
