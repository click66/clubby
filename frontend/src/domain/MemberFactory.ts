import { DomainObjectCreationError } from '../errors'
import { Member, MemberOptions } from './Member'

function v1Adapter(data: any): MemberOptions {
    return {
        uuid: data.uuid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date(data.dob),
        address: data.address,
        active: data.active,
        remainingTrialSessions: data.rem_trial_sessions,
        courses: data.signed_up_for.map((uuid: string) => ({ uuid })),
        licence: data.licence !== undefined ? {
            number: data.licence.no,
            expiryDate: new Date(data.licence.exp_time.split('/').reverse().join('/')),
        } : undefined,
        unusedPayments: data.unused_payments.map(
            ({ course_uuid }: { course_uuid: string }) => ({ course: { uuid: course_uuid } })
        ),
        joinDate: new Date(data.member_since),
        addedBy: data.added_by,
    }
}

function v2Adapter(data: any): MemberOptions {
    return {
        uuid: data.uuid,
        name: data.name,
        active: data.active,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: new Date(data.dateOfBirth),
        joinDate: new Date(data.joinDate),
        addedBy: data.addedBy,
        remainingTrialSessions: data.remainingTrialSessions,
        licence: data.licence ? {
            number: data.licence.number,
            expiryDate: new Date(data.licence.expiryDate),
        } : undefined,
        unusedPayments: data.unusedPayments.map(
            ({ course }: { course: string }) => ({ course: { uuid: course }}),
        ),
        courses: data.courses,
    }
}

export class V1MemberFactory {
    makeMember(data: any): Member {
        try {
            return new Member(v1Adapter(data))
        } catch {
            throw new DomainObjectCreationError('Unable to deserialise Member; response did not match expected schema.')
        }
    }
}


export class V2MemberFactory {
    makeMember(data: any): Member {
        try {
            return new Member(v2Adapter(data))
        } catch {
            throw new DomainObjectCreationError('Unable to deserialise Member; response did not match expected schema.')
        }
    }
}
