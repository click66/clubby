import http from "../utils/http"

const API_URL = import.meta.env.VITE_API_URL
const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL

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
    return http.post(API_URL + '/attendance/query', {
        ...query,
        date_earliest: isoDate(query.date_earliest),
        date_latest: isoDate(query.date_latest),
    }).then((data) => data.map((d: DtoAttendance) => {
        return {
            studentUuid: d.student_uuid,
            courseUuid: d.course_uuid,
            date: new Date(d.date),
            resolution: d.resolution,
        }
    }))
}

export function logAttendance(data: DtoNewAttendance) {
    const attendanceService = http.post(API_URL + '/attendance/create', { ...data, date: isoDate(data.date) })

    // TODO Should only use a single request and leverage an asynchronous worker
    const studentService = http.post(`${LEGACY_API_URL}/attendance/log`, {
        student_uuid: data.student_uuid,
        sess_date: isoDate(data.date),
        product: data.course_uuid,
        payment: data.resolution,
        payment_option: data.paymentOption,
    })

    return Promise.all([attendanceService, studentService])
        .then(([d, _]) => { return { ...d, date: new Date(d.date) } })
}

export function deleteAttendance(query: DtoAttendanceQuerySingle) {
    const attendanceService = http.post(API_URL + '/attendance/delete', {
        ...query,
        student_uuids: [query.student_uuid],
        date_earliest: isoDate(query.date),
        date_latest: isoDate(query.date),
    })

    const studentService = http.post(`${LEGACY_API_URL}/attendance/clear`, {
        student_uuid: query.student_uuid,
        sess_date: isoDate(query.date),
        product: query.course_uuid,
    })

    return Promise.all([attendanceService, studentService])
}
