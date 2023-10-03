import { DomainObjectCreationError } from '../errors'
import { Member, MemberOptions } from './Member'

function v1Adapter(data: any): MemberOptions {
    try {
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
    } catch {
        throw new DomainObjectCreationError('Unable to deserialise Member; response did not match expected schema.')
    }
}

export class V1MemberFactory {
    makeMember(data: any): Member {
        return new Member(v1Adapter(data))
    }
}
