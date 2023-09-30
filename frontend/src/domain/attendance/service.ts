import { DomainError } from '../../errors'
import { HttpInstance } from '../../utils/http'
import { Attendee, Course, NewAttendance } from './types'


const isoDate = (date: Date) => date.toISOString().split('T')[0]

export function attendSession(http: HttpInstance) {
    return ({ session, attendee, resolution = null, paymentOption = 'now', replace = false }: NewAttendance) => {
        if (attendee.hasLicence() && attendee.isLicenceExpired(session.date)) {
            return Promise.reject(new DomainError('Attendee licence has expired.'))
        }

        const courses = session.courses.filter((c) => attendee.isInCourse(c))

        if (!attendee.hasLicence() && (attendee.remainingTrialSessions - courses.length) < 0) {
            return Promise.reject(new DomainError('Attendee does not have enough remaining trial sessions.'))
        }

        if (paymentOption === 'advance' && courses.some((course) => !attendee.hasUsablePaymentForCourse(course))) {
            return Promise.reject(new DomainError('Attendee has no usable advance payment.'))
        }

        // Persist changes
        return Promise.all(courses.reduce((acc: Promise<any>[], course) => {
            acc.push(http.post('/attendance/create', {
                student_uuid: attendee.uuid,
                course_uuid: course.uuid,
                date: isoDate(session.date),
                resolution,
                use_advanced_payment: paymentOption === 'advance',
            }))
            return acc
        }, [] as Promise<any>[])).then(() => {
            return courses.reduce((acc: Attendee, course: Course) => {
                acc = acc
                    .withRemainingTrialSessions(acc.remainingTrialSessions - (replace || acc.remainingTrialSessions === 0 ? 0 : 1))
                    .withTakenPayment({ course })
                console.log(acc)
                return acc
            }, attendee)
        })
    }
}
