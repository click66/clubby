import { DomainObjectCreationError } from '../errors'
import { Member, MemberOptions } from './Member'

import { z } from 'zod'

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

export const courseSchema = z.object({
    uuid: z.string().uuid(),
    label: z.string().optional(),
})

const paymentSchema = z.object({
    course: courseSchema,
    datetime: z.string().datetime().optional(),
    used: z.boolean().optional(),
})

const licenceSchema = z.object({
    number: z.number(),
    expiryDate: z.coerce.date(),
})

const memberOptionsV2Schema = z.object({
    uuid: z.string().uuid(),
    name: z.string(),
    email: z.string().optional().nullable(),
    dateOfBirth: z.coerce.date().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),    
    active: z.boolean(),
    remainingTrialSessions: z.number(),
    licence: licenceSchema.optional().nullable(),
    unusedPayments: z.array(paymentSchema),
    courses: z.array(courseSchema),
    addedBy: z.string(),
    joinDate: z.coerce.date(),
})

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
            return new Member(memberOptionsV2Schema.parse(data))
        } catch {
            throw new DomainObjectCreationError('Unable to deserialise Member; response did not match expected schema.')
        }
    }
}
