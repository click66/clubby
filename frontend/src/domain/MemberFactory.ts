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
    datetime: z.string().datetime().transform((dt) => new Date(dt)),
    used: z.boolean(),
})

const subscriptionSchema = z.object({
    course: courseSchema,
    type: z.enum(['time']),
    expiryDate: z.coerce.date(),
})

const licenceSchema = z.object({
    number: z.number(),
    expiryDate: z.coerce.date(),
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
    private today: Date
    private memberOptionsV2Schema

    constructor(today: Date) {
        this.today = today

        this.memberOptionsV2Schema = z.object({
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
            subscriptions: z.array(subscriptionSchema).transform((data) => data.filter((s) => new Date(s.expiryDate) >= this.today)).optional(),
            courses: z.array(courseSchema),
            addedBy: z.string(),
            joinDate: z.coerce.date(),
        })
    }

    makeMember(data: any): Member {
        try {
            return new Member(this.memberOptionsV2Schema.parse(data))
        } catch {
            throw new DomainObjectCreationError('Unable to deserialise Member; response did not match expected schema.')
        }
    }
}
