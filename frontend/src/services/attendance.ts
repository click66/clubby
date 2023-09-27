import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../utils/http'

const cookies = new Cookies()
const API_URL = import.meta.env.VITE_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), cookies)

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

interface NewAttendance {
    member: Member
    course: Course
    date: Date
    resolution: string | null
    useAdvancedPayment: boolean
}

interface AttendancesQuery {
    members: Member[]
    courses: Course[]
    dateEarliest: Date
    dateLatest: Date
}

interface AttendanceQuerySingle {
    member: Member
    course: Course
    date: Date
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

export function logAttendance(data: NewAttendance) {
    return api.post('/attendance/create', {
        student_uuid: data.member.uuid,
        course_uuid: data.course.uuid,
        date: isoDate(data.date),
        resolution: data.resolution,
        use_advanced_payment: data.useAdvancedPayment,
    }).then(({ data }) => { return { ...data, date: new Date(data.date) } })
}

export function deleteAttendance(query: AttendanceQuerySingle) {
    return api.post('/attendance/delete', {
        course_uuid: query.course.uuid,
        student_uuids: [query.member.uuid],
        date_earliest: isoDate(query.date),
        date_latest: isoDate(query.date),
    })
}
