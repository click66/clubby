import { DomainError } from '../../errors'
import { HttpInstance } from '../../utils/http'
import { Attendance, AttendanceQuery, Attendee, Course, NewAttendance, Session } from './types'

const isoDate = (date: Date) => date.toISOString().split('T')[0]

function saveNewAttendance(http: HttpInstance, { attendee, session, resolution = null, paymentOption }: NewAttendance) {
    return Promise.all(session.courses.reduce((acc: Promise<any>[], course) => {
        acc.push(http.post('/attendance/create', {
            memberUuid: attendee.uuid,
            courseUuid: course.uuid,
            date: isoDate(session.date),
            resolution,
            useAdvancedPayment: paymentOption === 'advance',
        }))
        return acc
    }, [] as Promise<any>[])).then((data) => ({
        session: {
            date: session.date,
            courses: session.courses.filter((c) => data.map((d) => d.data.courseUuid).includes(c.uuid)),
        },
        attendee: attendee,
        resolution: resolution,
    }))
}

function deleteAttendance(http: HttpInstance, { attendee, course, date }: { attendee: Attendee, course: Course, date: Date }) {
    return http.post('/attendance/delete', {
        courseUuid: course.uuid,
        memberUuids: [attendee.uuid],
        dateEarliest: isoDate(date),
        dateLatest: isoDate(date),
    })
}

export function attendSession(http: HttpInstance) {
    return ({ session, attendee, resolution = null, paymentOption = 'now', replace = false }: NewAttendance): Promise<Attendance> => {
        if (attendee.hasLicence() && attendee.isLicenceExpired(session.date)) {
            return Promise.reject(new DomainError('Attendee licence has expired.'))
        }

        session = { ...session }
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
        })
            .then((attendance: Attendance) => attendance.session.courses.reduce(
                (acc: Attendance, course: Course) => {
                    acc.attendee = acc.attendee
                        .withRemainingTrialSessions(acc.attendee.remainingTrialSessions - (replace || acc.attendee.remainingTrialSessions === 0 ? 0 : 1))
                    acc.attendee = resolution === 'paid' && paymentOption === 'advance' ? acc.attendee.withTakenPayment({ course }) : acc.attendee
                    return acc
                },
                attendance,
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
            memberUuids: uuids,
            courseUuid: course.uuid,
            dateEarliest: isoDate(dateEarliest),
            dateLatest: isoDate(dateLatest),
        })))
            .then((responses) => responses.map((r) => r.data).flat())
            .then((data) => data.map((d): Attendance => ({
                attendee: attendees.find((a) => a.uuid === d.memberUuid)!,
                session: {
                    date: new Date(d.date),
                    courses: [courses.find((c) => c.uuid === d.courseUuid)!],
                },
                resolution: d.resolution === 'comp' || d.resolution === 'paid' ? d.resolution : null,
            })))
    }
}
