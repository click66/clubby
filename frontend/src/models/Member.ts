import { DomainError } from "../errors"

type Profile = {
    phone: string
    email: string
    dateOfBirth: Date | null
    address: string
}

type Licence = {
    idNumber: number
    expires: Date
}

type Membership = {
    remainingTrialSessions: number
    licence: Licence | null
}

type Origin = {
    joinDate: Date
    addedBy: string
}

type Payment = {
    courseUuid: string
}

interface Session {
    date: Date
    payment?: Payment | null
}

interface Course {
    uuid: string,
}

interface MemberProps {
    uuid: string,
    name: string,
    profile?: Profile | null,
    course_uuids?: string[]
    membership: Membership,
    origin: Origin,
    unusedPayments?: Payment[]
}

export class Member {
    uuid: string
    name: string
    profile: Profile | null
    course_uuids: string[] = []
    membership: Membership
    origin: Origin
    unusedPayments: Payment[] = []

    constructor({
        uuid,
        name = '',
        profile = null,
        course_uuids = [],
        membership,
        origin,
        unusedPayments = [],
    }: MemberProps) {
        if (name == '') {
            throw new DomainError('Member name cannot be blank')
        }

        this.uuid = uuid
        this.name = name

        this.profile = profile
        this.course_uuids = course_uuids
        this.membership = membership
        this.origin = origin
        this.unusedPayments = unusedPayments
    }

    public get dateOfBirth() {
        return this.profile?.dateOfBirth
    }

    public get email() {
        return this.profile?.email
    }

    public get address() {
        return this.profile?.address
    }

    public get phone() {
        return this.profile?.phone
    }

    public get courseUuids() {
        return this.course_uuids
    }

    public get remainingTrialSessions() {
        return this.membership.remainingTrialSessions
    }

    public get joinDate() {
        return this.origin.joinDate
    }

    public get addedBy() {
        return this.origin.addedBy
    }

    public get licenceExpiry() {
        return this.membership.licence?.expires
    }

    public get licenceNo() {
        return this.membership.licence?.idNumber
    }

    public activeTrial() {
        return !this.membership.licence && this.membership.remainingTrialSessions > 0
    }

    public hasLicence() {
        return this.membership.licence !== null
    }

    public expired(now: Date) {
        if (this.membership.licence) {
            return this.membership.licence.expires < now
        }
        return this.membership.remainingTrialSessions <= 0
    }

    public attend({ date, payment = null }: Session) {
        if (this.expired(date)) {
            throw new DomainError('Member is not licenced and has no remaining trial sessions')
        }

        if (payment) {
            const index = this.unusedPayments.findIndex(p => p.courseUuid === payment.courseUuid)

            if (index === -1) {
                throw new DomainError('Member has no usable advance payment')
            }
            this.unusedPayments.splice(index, 1)
        }

        this.membership.remainingTrialSessions--
    }

    public unattend(_: { date: Date }) {
        this.membership.remainingTrialSessions++
    }

    public attendMultiple(sessions: Session[]) {
        if (!this.hasLicence() && (this.membership.remainingTrialSessions - sessions.length) < 0) {
            throw new DomainError('Member does not have enough remaining trial sessions')
        }

        sessions.forEach((s) => this.attend(s))
    }

    public hasUsablePaymentForCourse({ uuid }: Course) {
        return this.unusedPayments.some((p) => p.courseUuid === uuid)
    }

    public isInCourse({ uuid }: Course) {
        return this.courseUuids.filter((cuuid: string) => cuuid === uuid).length > 0
    }
}
