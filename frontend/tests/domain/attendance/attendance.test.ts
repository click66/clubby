import { attendSession, getAttendance, unattendSession } from '../../../src/domain/attendance/attendance'
import { http } from '../../../src/utils/http'
import { Member } from '../../../src/domain/Member'
import { Attendee, Course } from '../../../src/domain/attendance/types'
import { DomainError } from '../../../src/errors'
import makeMockHttp from '../mock-http'

const mockHttp = makeMockHttp(http)

describe('attendSession', () => {
    afterEach(() => {
        jest.clearAllMocks()
        mockHttp.reset()
    })

    function mockAttendanceCreate(
        attendee: Attendee,
        course: Course,
        useAdvancedPayment: boolean = false,
        useSubscription: boolean = false,
        resolution?: string,
    ) {
        const requestBody = {
            memberUuid: attendee.uuid,
            courseUuid: course.uuid,
            date: '2023-10-15',
            resolution: resolution ?? null,
            useAdvancedPayment: useAdvancedPayment,
            useSubscription: useSubscription,
        }

        const responseBody = {
            'memberUuid': attendee.uuid,
            'courseUuid': course.uuid,
            'date': '2023-10-15',
            'resolution': null,
        }

        mockHttp.onPost('/attendance/create', requestBody).reply(200, responseBody)
    }

    test('Persists correctly to server', () => {
        // Given a session with two courses
        const course = { uuid: '782732e2-1b1f-4291-821c-c73400164473' }
        const session = {
            date: new Date('2023-10-15'),
            courses: [
                course,
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
        }

        // And an attendee signed up for one of them
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [course],
        })

        mockAttendanceCreate(attendee, course)

        // When the attendee attends the session
        const spy = jest.spyOn(http, 'post')
        return attendSession(http)({ session, attendee }).then(() => {
            expect(spy).toHaveBeenCalledWith('/attendance/create', expect.objectContaining({
                memberUuid: attendee.uuid,
                courseUuid: course.uuid,
                date: '2023-10-15',
                resolution: null,
                useAdvancedPayment: false,
            }))
        })
    })

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
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
        })

        mockAttendanceCreate(attendee, session.courses[0])
        mockAttendanceCreate(attendee, session.courses[1])

        // When the attendee attends the session
        // Then the attendee will have attended 2 sessions
        return expect(attendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
            attendee: expect.objectContaining({ remainingTrialSessions: 2 })
        }))
    })

    test('Can replace existing sessions', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has attended one session on 2023-10-15
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 1,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
        })

        mockAttendanceCreate(attendee, session.courses[0])

        // When the attendee attends the session, and we instruct to replace existing attendances
        // Then the attendee will still have only attended one session
        return expect(attendSession(http)({ session, attendee, replace: true })).resolves.toStrictEqual(expect.objectContaining({
            attendee: expect.objectContaining({ remainingTrialSessions: 1 }),
        }))
    })

    test('If an attendee is unlicenced, they can attend if they hae remaining trial sessions', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has one remaining trial session
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 1,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: null,
        })

        mockAttendanceCreate(attendee, session.courses[0])

        // When the attendee attends the session
        return expect(attendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
            attendee: expect.objectContaining({ remainingTrialSessions: 0 }),
        }))
    })

    test('Attendee cannot attend if they have an expired licence', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has an expired licence
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 0,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-09-15') },
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
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 0,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: null,
        })

        mockAttendanceCreate(attendee, session.courses[0])

        // Then an error will be thrown
        return expect(attendSession(http)({ session, attendee })).rejects.toThrowError(DomainError)
    })

    test('If attendee uses an advanced payment, that payment is no longer available afterwards', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' } , datetime: new Date(), used: false}],
        })

        mockAttendanceCreate(attendee, session.courses[0], true, false, 'paid')

        // When the attendee attends the session and declares they have paid in advance
        return attendSession(http)({ session, attendee, resolution: 'paid', paymentOption: 'advance' }).then((result) => {
            // Then that payment is no longer available
            expect(result.attendee.hasUsablePaymentForCourse(session.courses[0])).toBeFalsy()
        })
    })

    test('If attendee has multiple usable payments, only one is taken', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has no usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [
                { course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' }, datetime: new Date(), used: false },
                { course: { uuid: '782732e2-1b1f-4291-821c-c73400164473' }, datetime: new Date(), used: false },
            ],
        })

        mockAttendanceCreate(attendee, session.courses[0], true, false, 'paid')

        // When the attendee attends the session and declares they have paid in advance
        return attendSession(http)({ session, attendee, resolution: 'paid', paymentOption: 'advance' }).then((result) => {
            // Then the payment is no longer available afterwards
            expect(result.attendee.hasUsablePaymentForCourse(session.courses[0])).toBeTruthy()
        })
    })

    test('If attendee declares they are attending with an advanced payment, error if there are no usable payments', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '782732e2-1b1f-4291-821c-c73400164473' }] }

        // And the attendee has a usable payment the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }, datetime: new Date(), used: false }],
        })

        // When the attendee attends the session and declares they have paid in advance
        // Then an error will be thrown
        return expect(attendSession(http)({ session, attendee, paymentOption: 'advance' })).rejects.toThrowError(DomainError)
    })

    test('Only take a payment if attendee is paying', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has a usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }, datetime: new Date(), used: false }],
        })

        mockAttendanceCreate(attendee, session.courses[0], true, false, 'comp')

        // When the attendee attends the session and doesn't need to pay, EVEN if they have declared to pay in advance and has a payment
        return attendSession(http)({ session, attendee, paymentOption: 'advance', resolution: 'comp' }).then((result) => {
            // Then the payment will still be usable afterwards
            expect(result.attendee.hasUsablePaymentForCourse(session.courses[0])).toBeTruthy()
        })
    })

    test('Only take a payment if attendee declares they want to use it', () => {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has a usable payment for the course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }, datetime: new Date(), used: false }],
        })

        mockAttendanceCreate(attendee, session.courses[0], false)

        // When the attendee attends the session but does not want to use the payment
        return attendSession(http)({ session, attendee, paymentOption: 'now' }).then((result) => {
            // Then the payment will still be usable afterwards
            expect(result.attendee.hasUsablePaymentForCourse(session.courses[0])).toBeTruthy()
        })
    })

    test('Can use a subscription as a payment', () => {
        // Subscriptions have expiration dates but allow a student to make an unlimited number of payments in that period

        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has no usable payment for the course, but has a subscription
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            subscriptions: [{
                type: 'time',
                expiryDate: new Date('2023-11-30'),
                course: {
                    uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024',
                }
            }],
        })

        // Then the attendee has no usable payments for the course
        expect(attendee.hasUsablePaymentForCourse(session.courses[0])).toBeFalsy()

        // But the attendee has a usable subscription
        expect(attendee.hasSubscriptionForCourse(session.courses[0], session.date)).toBeTruthy()

        // And an attendee can pay with their subscription until it's expired
        mockAttendanceCreate(attendee, session.courses[0], false, true)
        const spy = jest.spyOn(http, 'post')
        return attendSession(http)({ session, attendee, paymentOption: 'subscription' })
            .then(() => attendSession(http)({ session, attendee, paymentOption: 'subscription' }))
            .then(() => attendSession(http)({ session, attendee, paymentOption: 'subscription' }))
            .then(() => attendSession(http)({ session, attendee, paymentOption: 'subscription' }))
            .then(() => attendSession(http)({ session, attendee, paymentOption: 'subscription' }))
            .then(() => attendSession(http)({ session, attendee, paymentOption: 'subscription' }))
            .then((result) => {
                expect(result.attendee.hasSubscriptionForCourse(session.courses[0], session.date)).toBeTruthy()

                expect(spy).toHaveBeenCalledTimes(6)
                expect(spy).toHaveBeenCalledWith('/attendance/create', expect.objectContaining({
                    memberUuid: attendee.uuid,
                    courseUuid: session.courses[0].uuid,
                    date: '2023-10-15',
                    resolution: null,
                    useAdvancedPayment: false,
                    useSubscription: true,
                }))
            })
    })

    test('If attendee has subscription and payment, using the subscription will keep the payment', function () {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has a usable payment for the course AND a subscription
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            unusedPayments: [{ course: { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }, datetime: new Date(), used: false }],
            subscriptions: [{
                type: 'time',
                expiryDate: new Date('2023-11-30'),
                course: {
                    uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024',
                }
            }],
        })

        mockAttendanceCreate(attendee, session.courses[0], false, true)

        // When the attendee attends the session and pays with their subscription
        return attendSession(http)({ session, attendee, paymentOption: 'subscription' }).then((result) => {
            // Then the payment will still be usable afterwards
            expect(result.attendee.hasUsablePaymentForCourse(session.courses[0])).toBeTruthy()
        })
    })

    test('Cannot pay with subscription if attendee has no subscription', function () {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has an expired subscription for that course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            subscriptions: [],
        })

        return expect(attendSession(http)({ session, attendee, paymentOption: 'subscription' })).rejects.toThrowError(DomainError)
    })

    test('Cannot pay with subscription if attendee has subscription for different course', function () {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has an expired subscription for that course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            subscriptions: [{
                type: 'time',
                expiryDate: new Date('2022-11-30'),
                course: {
                    uuid: '29398789-2ff5-40e7-9dc0-0749e97a8b86',
                }
            }],
        })

        return expect(attendSession(http)({ session, attendee, paymentOption: 'subscription' })).rejects.toThrowError(DomainError)
    })

    test('Cannot use an expired subscription', function () {
        // Given a session occurs on 2023-10-15
        const session = { date: new Date('2023-10-15'), courses: [{ uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' }] }

        // And the attendee has an expired subscription for that course
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 4,
            courses: [
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { number: 12345, expiryDate: new Date('2023-11-15') },
            subscriptions: [{
                type: 'time',
                expiryDate: new Date('2022-11-30'),
                course: {
                    uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024',
                }
            }],
        })

        return expect(attendSession(http)({ session, attendee, paymentOption: 'subscription' })).rejects.toThrowError(DomainError)
    })
})

describe('unattendSession', () => {
    afterEach(() => {
        mockHttp.reset()
    })

    test('If session has 3 courses, but attendeee is only in 2, they gain 2 trial sessions back', () => {
        // Given an attendee is on a trial membership
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 0,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: null,
        })

        // And a session has 3 courses, of which the attendee is in 2
        const session = {
            date: new Date('2023-10-15'), courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
                { uuid: '17665ac3-3be1-4e64-83d6-f9a397fe3124' },
            ]
        }

        mockHttp.onPost('/attendance/delete', {
            courseUuid: '782732e2-1b1f-4291-821c-c73400164473',
            memberUuids: ['7d64ac24-50f2-4210-bcfe-822f82f942bd'],
            dateEarliest: '2023-10-15',
            dateLatest: '2023-10-15',
        }).reply(204)

        mockHttp.onPost('/attendance/delete', {
            courseUuid: '1562d983-fa70-47b0-8915-3b7e9f22c024',
            memberUuids: ['7d64ac24-50f2-4210-bcfe-822f82f942bd'],
            dateEarliest: '2023-10-15',
            dateLatest: '2023-10-15',
        }).reply(204)

        // When the attendee 'unattends' the session
        // Then the attendee will gain back 2 trial sessions
        return expect(unattendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
            remainingTrialSessions: 2,
        }))
    })
})

describe('getAttendance', () => {
    afterEach(() => {
        mockHttp.reset()
    })

    test('Returns set of attendances for 3 students attending 1 course', () => {
        // Given a course with UUID
        const course = { uuid: '3e52b880-6526-4a27-9b9c-8396d124e65d' }

        // And 3 students
        const attendee1 = new Member({
            uuid: '2e4070ee-eb57-4280-94cd-4aabb98257bd',
            name: 'John Doe',
            active: true,
            remainingTrialSessions: 0,
            courses: [course],
        })
        const attendee2 = new Member({
            uuid: 'ef18ee60-4bbc-4e09-bc7f-8822fc8ed91c',
            name: 'Jane Doe',
            active: true,
            remainingTrialSessions: 0,
            courses: [course],
        })
        const attendee3 = new Member({
            uuid: '563eebea-a982-4595-a9dd-e3e7a4a9287b',
            name: 'Harry Solomon',
            active: true,
            remainingTrialSessions: 0,
            courses: [course],
        })

        // And the server holds 1 attendance for each student for that course
        mockHttp.onPost('/attendance/query').reply(200, [
            {
                'memberUuid': attendee1.uuid,
                'courseUuid': course.uuid,
                'date': '2023-07-17',
                'resolution': null,
                'id': 904
            },
            {
                'memberUuid': attendee2.uuid,
                'courseUuid': course.uuid,
                'date': '2023-07-13',
                'resolution': 'paid',
                'id': 894
            },
            {
                'memberUuid': attendee3.uuid,
                'courseUuid': course.uuid,
                'date': '2023-07-13',
                'resolution': 'comp',
                'id': 895
            }]
        )

        // When I query for attendance
        // Then those 3 attendances are returned
        return expect(getAttendance(http)({
            attendees: [attendee1, attendee2, attendee3],
            courses: [course],
            dateEarliest: new Date('2023-07-01'),
            dateLatest: new Date('2023-07-30'),
        })).resolves.toStrictEqual([
            {
                session: {
                    date: new Date('2023-07-17'),
                    courses: [course],
                },
                attendee: attendee1,
                resolution: null,
            },
            {
                session: {
                    date: new Date('2023-07-13'),
                    courses: [course],
                },
                attendee: attendee2,
                resolution: 'paid',
            },
            {
                session: {
                    date: new Date('2023-07-13'),
                    courses: [course],
                },
                attendee: attendee3,
                resolution: 'comp',
            },
        ])
    })
})
