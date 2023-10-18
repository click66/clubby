import { IMember } from '../Member'

export interface Course {
    uuid: string
}

export interface Payment {
    course: Course
}

export interface Subscription {
    course: Course
    expiryDate: Date
    type: 'time'
}

export interface Attendee extends IMember {
    readonly uuid: string
    readonly name: string
    readonly remainingTrialSessions: number
    readonly courses: Course[]
    readonly subscriptions: Subscription[]

    isInCourse(course: Course): boolean
    hasLicence(): boolean
    isLicenceExpired(now: Date): boolean
    hasUsablePaymentForCourse(course: Course): boolean
    hasSubscriptionForCourse(course: Course, date: Date): boolean
    activeTrial(): boolean

    withRemainingTrialSessions(count: number): Attendee
    withTakenPayment(payment: Payment): Attendee
}

export interface Session {
    date: Date
    courses: Course[]
}

export interface NewAttendance {
    session: Session
    attendee: Attendee
    resolution?: 'comp' | 'paid' | null
    paymentOption?: 'advance' | 'now' | 'subscription'
    replace?: boolean
}

export interface Attendance {
    session: Session
    attendee: Attendee
    resolution: 'comp' | 'paid' | null
}

export interface AttendanceQuery {
    attendees: Attendee[]
    courses: Course[]
    dateEarliest: Date
    dateLatest: Date
}
