interface Course {
    uuid: string
}

interface Payment {
    course: Course
}

interface Licence {
    number: number
    expiryDate: Date
}

interface Profile {
    name: string
    email: string
    phone: string
    dateOfBirth: Date
    address: string
}

export interface MemberOptions {
    readonly uuid: string
    readonly name: string
    readonly email?: string
    readonly dateOfBirth?: Date
    readonly phone?: string
    readonly address?: string
    readonly active: boolean
    readonly remainingTrialSessions: number
    readonly courses: Course[]
    readonly licence?: Licence | null
    readonly unusedPayments?: Payment[]
    readonly addedBy?: string
    readonly joinDate?: Date
}

export interface IMember {
    readonly uuid: string
    readonly name: string
    readonly email: string | undefined
    readonly dateOfBirth: Date | undefined
    readonly phone: string | undefined
    readonly address: string | undefined
    readonly active: boolean
    readonly remainingTrialSessions: number
    readonly licenceNo?: number | undefined
    readonly licenceExpiry?: Date | undefined
    readonly addedBy: string | undefined
    readonly joinDate: Date | undefined

    isInCourse(course: Course): boolean
    hasLicence(): boolean
    isLicenceExpired(now: Date): boolean
    activeTrial(): boolean
    hasUsablePaymentForCourse(course: Course): boolean

    withRemainingTrialSessions(count: number): IMember
    withTakenPayment(paymentToRemove: Payment): IMember
    withCourse(course: Course): IMember
    withoutCourse(course: Course): IMember
    withProfile(profile: Profile): IMember
    withActive(status: boolean): IMember
    withLicence(licence: Licence): IMember
}

export class Member implements IMember {
    public readonly uuid: string
    public readonly name: string
    public readonly email: string | undefined
    public readonly dateOfBirth: Date | undefined
    public readonly phone: string | undefined
    public readonly address: string | undefined
    public readonly active: boolean
    public readonly remainingTrialSessions: number
    private readonly courses: Course[]
    private readonly licence: Licence | null
    public readonly unusedPayments: Payment[]
    public readonly addedBy: string | undefined
    public readonly joinDate: Date | undefined

    constructor(options: MemberOptions) {
        this.uuid = options.uuid
        this.name = options.name
        this.email = options.email
        this.dateOfBirth = options.dateOfBirth
        this.phone = options.phone
        this.address = options.address
        this.active = options.active
        this.remainingTrialSessions = options.remainingTrialSessions
        this.courses = options.courses
        this.licence = options.licence ?? null
        this.unusedPayments = options.unusedPayments ?? []
        this.addedBy = options.addedBy
        this.joinDate = options.joinDate
    }

    public get licenceNo(): number | undefined {
        return this.licence?.number
    }

    public get licenceExpiry(): Date | undefined {
        return this.licence?.expiryDate
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

    activeTrial(): boolean {
        return !this.licence && this.remainingTrialSessions > 0
    }

    hasUsablePaymentForCourse(course: Course): boolean {
        return this.unusedPayments.some((payment) => payment.course.uuid === course.uuid)
    }

    withRemainingTrialSessions(count: number): IMember {
        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: this.active,
            remainingTrialSessions: count,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }

    withTakenPayment(paymentToRemove: Payment): IMember {
        const payments = this.unusedPayments.slice()
        const index = payments.findIndex((payment) => payment.course.uuid === paymentToRemove.course.uuid)
        if (index !== -1) {
            payments.splice(index, 1)
        }

        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: this.active,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: payments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }

    withCourse(course: Course): IMember {
        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: this.active,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses.concat([course]),
            licence: this.licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }

    withoutCourse(course: Course): IMember {
        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: this.active,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses.filter((c) => c.uuid !== course.uuid),
            licence: this.licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }

    withProfile(profile: Profile): IMember {
        return new Member({
            uuid: this.uuid,
            active: this.active,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
            ...profile,
        })
    }

    withActive(status: boolean): IMember {
        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: status,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses,
            licence: this.licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }

    withLicence(licence: Licence): IMember {
        return new Member({
            uuid: this.uuid,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            address: this.address,
            active: this.active,
            remainingTrialSessions: this.remainingTrialSessions,
            courses: this.courses,
            licence: licence,
            unusedPayments: this.unusedPayments,
            addedBy: this.addedBy,
            joinDate: this.joinDate,
        })
    }
}
