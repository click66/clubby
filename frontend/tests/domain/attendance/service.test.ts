import { attendSession } from '../../../src/domain/attendance/service'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../../../src/utils/http'
import { Member } from '../../../src/domain/Member'
import { DomainError } from '../../../src/errors'

describe('attendSession', () => {
    const mockHttp = new MockAdapter(http)

    mockHttp.onPost('/attendance/create').reply(200)

    test('If a session contains multiple courses, attendee attends all for the courses for which they are signed up', () => {
        // Given a session contains 3 courses
        const session = {
            date: new Date('2023-10-15'),
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
                { uuid: 'd6fbfbb6-6f32-4bb2-9c73-404068e01b19' },
            ],
        }

        // But the attendee is only signed up for 2 of them
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
        })

        // When the attendee attends the session
        // Then the attendee will have attended 2 sessions
        return expect(attendSession(http)({ session, attendee })).resolves.toEqual(expect.objectContaining({
            remainingTrialSessions: 2,
        }))
    })

    test('Can replace existing sessions', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has attended one session on 2023-10-15
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 1,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
        })

        // When the attendee attends the session, and we instruct to replace existing attendances
        // Then the attendee will still have only attended one session
        return expect(attendSession(http)({ session, attendee, replace: true })).resolves.toEqual(expect.objectContaining({
            remainingTrialSessions: 1,
        }))
    })

    test('If an attendee is unlicenced, they can attend if they have remaining trial sessions', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has one remaining trial session
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 1,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: null,
        })

        // When the attendee attends the session
        return expect(attendSession(http)({ session, attendee })).resolves.toEqual(expect.objectContaining({
            remainingTrialSessions: 0,
        }))
    })

    test('Attendee cannot attend if they have an expired licence', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has an expired licence
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 0,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-09-15') },
        })

        // When the attendee attends the session
        // Then an error will be thrown
        return expect(attendSession(http)({ session, attendee })).rejects.toThrowError(DomainError)
    })

    test('Attendee cannot attend if they have no licence and no remaining trial sessions', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no licence and no remaining trial sessions
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 0,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: null,
        })

        // Then an error will be thrown
        return expect(attendSession(http)({ session, attendee })).rejects.toThrowError(DomainError)
    })

    test('If attendee uses an advanced payment, that payment is no longer available afterwards', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' } }],
        })

        // When the attendee attends the session and declares they have paid in advance
        return attendSession(http)({ session, attendee, paymentOption: 'advance' }).then((result) => {
            // Then that payment is no longer available
            expect(result.hasUsablePaymentForCourse(session.courses[0])).toBeFalsy()
        })
    })

    test('If attendee has multiple usable payments, only one is taken', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [
                { course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' } },
                { course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' } },
            ],
        })

        // When the attendee attends the session and declares they have paid in advance
        return attendSession(http)({ session, attendee, paymentOption: 'advance' }).then((result) => {
            // Then the payment is no longer available afterwards
            expect(result.hasUsablePaymentForCourse(session.courses[0])).toBeTruthy()
        })
    })

    test('If attendee declares they are attending with an advanced payment, error if there are no usable payments', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' } }],
        })

        // When the attendee attends the session and declares they have paid in advance
        // Then an error will be thrown
        return expect(attendSession(http)({ session, attendee, paymentOption: 'advance' })).rejects.toThrowError(DomainError)
    })
})
