export interface Course {
    uuid: string
}

export interface Payment {
    course: Course
}

export interface Attendee {
    uuid: string
    remainingTrialSessions: number

    isInCourse(course: Course): boolean
    hasLicence(): boolean
    isLicenceExpired(now: Date): boolean
    hasUsablePaymentForCourse(course: Course): boolean

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
    paymentOption?: 'advance' | 'now'
    replace?: boolean
}

export interface Attendance {
    id: number
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
