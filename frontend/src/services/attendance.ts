import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../utils/http'

const cookies = new Cookies()
const API_URL = import.meta.env.VITE_API_URL
const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), cookies)
const legacyApi = withInterceptors(http.create({ baseURL: LEGACY_API_URL }), cookies)

type DtoAttendanceQuery = {
    student_uuids: string[]
    course_uuid: string
    date_earliest: Date
    date_latest: Date
}

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
    student_uuid: string
    course_uuid: string
    date: Date
    resolution: string
}

const isoDate = (date: Date) => date.toISOString().split('T')[0]

export function fetchAttendances(query: DtoAttendanceQuery) {
    return api.post('/attendance/query', {
        ...query,
        date_earliest: isoDate(query.date_earliest),
        date_latest: isoDate(query.date_latest),
    }).then(({ data }) => data.map((d: DtoAttendance) => {
        return {
            studentUuid: d.student_uuid,
            courseUuid: d.course_uuid,
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
