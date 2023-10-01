import { DomainError } from '../../errors'
import { HttpInstance } from '../../utils/http'
import { Attendance, AttendanceQuery, Attendee, Course, NewAttendance, Session } from './types'

const isoDate = (date: Date) => date.toISOString().split('T')[0]

function saveNewAttendance(http: HttpInstance, { attendee, session, resolution, paymentOption }: NewAttendance) {
    return Promise.all(session.courses.reduce((acc: Promise<any>[], course) => {
        acc.push(http.post('/attendance/create', {
            student_uuid: attendee.uuid,
            course_uuid: course.uuid,
            date: isoDate(session.date),
            resolution,
            use_advanced_payment: paymentOption === 'advance',
        }))
        return acc
    }, [] as Promise<any>[]))
}

function deleteAttendance(http: HttpInstance, { attendee, course, date }: { attendee: Attendee, course: Course, date: Date }) {
    return http.post('/attendance/delete', {
        course_uuid: course.uuid,
        student_uuids: [attendee.uuid],
        date_earliest: isoDate(date),
        date_latest: isoDate(date),
    })
}

export function attendSession(http: HttpInstance) {
    return ({ session, attendee, resolution = null, paymentOption = 'now', replace = false }: NewAttendance): Promise<Attendee> => {
        if (attendee.hasLicence() && attendee.isLicenceExpired(session.date)) {
            return Promise.reject(new DomainError('Attendee licence has expired.'))
        }

        session.courses = session.courses.filter((c) => attendee.isInCourse(c))

        if (!attendee.hasLicence() && (attendee.remainingTrialSessions - session.courses.length) < 0) {
            return Promise.reject(new DomainError('Attendee does not have enough remaining trial sessions.'))
        }

        if (paymentOption === 'advance' && session.courses.some((course) => !attendee.hasUsablePaymentForCourse(course))) {
            return Promise.reject(new DomainError('Attendee has no usable advance payment.'))
        }

        return saveNewAttendance(http, {
            session,
            attendee,
            resolution,
            paymentOption,
            replace,
        }).then(() => session.courses.reduce(
            (acc: Attendee, course: Course) => acc
                .withRemainingTrialSessions(acc.remainingTrialSessions - (replace || acc.remainingTrialSessions === 0 ? 0 : 1))
                .withTakenPayment({ course }),
            attendee,
        ))
    }
}

export function unattendSession(http: HttpInstance) {
    return ({ session, attendee }: { session: Session, attendee: Attendee }): Promise<Attendee> => {
        const courses = session.courses.filter((c) => attendee.isInCourse(c))

        return Promise.all(courses.reduce((acc: Promise<any>[], course: Course) => {
            acc.push(deleteAttendance(http, {
                attendee,
                course,
                date: session.date,
            }))
            return acc
        }, [] as Promise<any>[]))
            .then(() => attendee.withRemainingTrialSessions(attendee.remainingTrialSessions + courses.length))
    }
}

export function getAttendance(http: HttpInstance) {
    return ({ attendees, courses, dateEarliest, dateLatest }: AttendanceQuery): Promise<Attendance[]> => {
        const uuids = attendees.map((a) => a.uuid)

        return Promise.all(courses.map((course) => http.post('/attendance/query', {
            student_uuids: uuids,
            course_uuid: course.uuid,
            date_earliest: isoDate(dateEarliest),
            date_latest: isoDate(dateLatest),
        })))
            .then((responses) => responses.map((r) => r.data).flat())
            .then((data) => data.map((d): Attendance => ({
                id: d.id,
                attendee: attendees.find((a) => a.uuid === d.student_uuid)!,
                session: {
                    date: new Date(d.date),
                    courses: [courses.find((c) => c.uuid === d.course_uuid)!],
                },
                resolution: d.resolution === 'comp' || d.resolution === 'paid' ? d.resolution : null,
            })))
    }
}
