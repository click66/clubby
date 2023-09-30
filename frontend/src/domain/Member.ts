import { Attendee, Course as AttendeeCourse, Payment } from './attendance/types'

type Course = AttendeeCourse

interface Licence {
    id: number
    expiryDate: Date
}

export interface MemberOptions {
    readonly uuid: string
    readonly remainingTrialSessions: number
    readonly courses: AttendeeCourse[]
    readonly licence?: Licence | null
    readonly unusedPayments?: Payment[]
}

export class Member implements Attendee {
    public readonly uuid: string
    public readonly remainingTrialSessions: number
    private readonly courses: AttendeeCourse[]
    private readonly licence: Licence | null
    public readonly unusedPayments: Payment[]

    constructor(options: MemberOptions) {
        this.uuid = options.uuid
        this.remainingTrialSessions = options.remainingTrialSessions
        this.courses = options.courses
        this.licence = options.licence ?? null
        this.unusedPayments = options.unusedPayments ?? []
    }

    isInCourse(course: Course): boolean {
        return this.courses.some(({ uuid }) => uuid === course.uuid)
    }

    hasLicence(): boolean {
        return this.licence !== null
    }

    isLicenceExpired(now: Date): boolean {
        if (!this.licence) return false

        return this.licence.expiryDate < now
    }

    hasUsablePaymentForCourse(course: Course): boolean {
        return this.unusedPayments.some((payment) => payment.course.uuid === course.uuid)
    }

    withRemainingTrialSessions(count: number) {
        return new Member({
            uuid: this.uuid,
            remainingTrialSessions: count,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: this.unusedPayments,
        })
    }

    withTakenPayment(paymentToRemove: Payment) {
        const payments = this.unusedPayments
        const index = payments.findIndex(payment => payment.course.uuid === paymentToRemove.course.uuid)
        if (index !== -1) {
            payments.splice(index, 1)
        }

        return new Member({
            uuid: this.uuid,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: payments,
        })
    }
}
