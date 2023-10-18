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

interface Subscription {
    expiryDate: Date
    type: 'time'
    course: Course
}

export interface MemberOptions {
    readonly uuid: string
    readonly name: string
    readonly email?: string | null
    readonly dateOfBirth?: Date | null
    readonly phone?: string | null
    readonly address?: string | null
    readonly active: boolean
    readonly remainingTrialSessions: number
    readonly subscriptions?: Subscription[]
    readonly courses: Course[]
    readonly licence?: Licence | null
    readonly unusedPayments?: Payment[]
    readonly addedBy?: string
    readonly joinDate?: Date
}

export interface IMember {
    readonly uuid: string
    readonly name: string
    readonly email: string | null
    readonly dateOfBirth: Date | null
    readonly phone: string | null
    readonly address: string | null
    readonly active: boolean
    readonly remainingTrialSessions: number
    readonly courses: Course[]
    readonly licenceNo?: number | undefined
    readonly licenceExpiry?: Date | undefined
    readonly addedBy?: string
    readonly joinDate?: Date

    isInCourse(course: Course): boolean
    hasLicence(): boolean
    isLicenceExpired(now: Date): boolean
    activeTrial(): boolean
    hasUsablePaymentForCourse(course: Course): boolean
    hasSubscriptionForCourse(course: Course, date: Date): boolean

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
    public readonly email: string | null
    public readonly dateOfBirth: Date | null
    public readonly phone: string | null
    public readonly address: string | null
    public readonly active: boolean
    public readonly remainingTrialSessions: number
    public readonly courses: Course[]
    private readonly licence: Licence | null
    public readonly unusedPayments: Payment[]
    private readonly subscriptions: Subscription[]
    public readonly addedBy?: string
    public readonly joinDate?: Date

    constructor(options: MemberOptions) {
        this.uuid = options.uuid
        this.name = options.name
        this.email = options.email ?? null
        this.dateOfBirth = options.dateOfBirth ?? null
        this.phone = options.phone ?? null
        this.address = options.address ?? null
        this.active = options.active
        this.remainingTrialSessions = options.remainingTrialSessions
        this.courses = options.courses
        this.licence = options.licence ?? null
        this.unusedPayments = options.unusedPayments ?? []
        this.subscriptions = options.subscriptions ?? []
        this.addedBy = options.addedBy
        this.joinDate = options.joinDate
    }

    private withProperty<K extends keyof MemberOptions>(prop: K, value: MemberOptions[K]): Member {
        return new Member({
            ...{
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
                unusedPayments: this.unusedPayments,
                subscriptions: this.subscriptions,
                addedBy: this.addedBy,
                joinDate: this.joinDate,
            },
            [prop]: value,
        })
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

    hasSubscriptionForCourse(course: Course, date: Date): boolean {
        // TODO filter to unexpired
        return this.subscriptions.some((subscription) => subscription.course.uuid === course.uuid && subscription.expiryDate > date)
    }

    withRemainingTrialSessions(count: number): IMember {
        return this.withProperty('remainingTrialSessions', count)
    }

    withTakenPayment(paymentToRemove: Payment): IMember {
        const payments = this.unusedPayments.slice()
        const index = payments.findIndex((payment) => payment.course.uuid === paymentToRemove.course.uuid)
        if (index !== -1) {
            payments.splice(index, 1)
        }

        return this.withProperty('unusedPayments', payments)
    }

    withCourse(course: Course): Member {
        return this.withProperty('courses', [...this.courses, course])
    }

    withoutCourse(course: Course): Member {
        return this.withProperty('courses', this.courses.filter((c) => c.uuid !== course.uuid))
    }

    withProfile(profile: Profile): Member {
        return this.withProperty('name', profile.name)
            .withProperty('email', profile.email)
            .withProperty('phone', profile.phone)
            .withProperty('dateOfBirth', profile.dateOfBirth)
            .withProperty('address', profile.address)
    }

    withActive(status: boolean): Member {
        return this.withProperty('active', status)
    }

    withLicence(licence: Licence): Member {
        return this.withProperty('licence', licence)
    }

}
