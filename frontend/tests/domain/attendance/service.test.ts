import { attendSession, getAttendance, unattendSession } from '../../../src/domain/attendance/service'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../../../src/utils/http'
import { Member } from '../../../src/domain/Member'
import { DomainError } from '../../../src/errors'

const mockHttp = new MockAdapter(http)

describe('attendSession', () => {
    mockHttp.onPost('/attendance/create').reply(200)

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
            remainingTrialSessions: 4,
            courses: [course],
        })

        // When the attendee attends the session
        const spy = jest.spyOn(http, 'post')
        return attendSession(http)({ session, attendee }).then(() => {
            expect(spy).toHaveBeenCalledWith('/attendance/create', expect.objectContaining({
                student_uuid: attendee.uuid,
                course_uuid: course.uuid,
                date: '2023-10-15',
                resolution: null,
                use_advanced_payment: false,
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
            remainingTrialSessions: 4,
            courses: [
                { uuid: '782732e2-1b1f-4291-821c-c73400164473' },
                { uuid: '1562d983-fa70-47b0-8915-3b7e9f22c024' },
            ],
            licence: { id: 12345, expiryDate: new Date('2023-11-15') },
        })

        // When the attendee attends the session
        // Then the attendee will have attended 2 sessions
        return expect(attendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
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
        return expect(attendSession(http)({ session, attendee, replace: true })).resolves.toStrictEqual(expect.objectContaining({
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
        return expect(attendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
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

describe('unattendSession', () => {
    mockHttp.onPost('/attendance/delete').reply(200)

    test('If session has 3 courses, but attendeee is only in 2, they gain 2 trial sessions back', () => {
        // Given an attendee is on a trial membership
        const attendee = new Member({
            uuid: '7d64ac24-50f2-4210-bcfe-822f82f942bd',
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

        // When the attendee "unattends" the session
        // Then the attendee will gain back 2 trial sessions
        return expect(unattendSession(http)({ session, attendee })).resolves.toStrictEqual(expect.objectContaining({
            remainingTrialSessions: 2,
        }))
    })
})

describe('getAttendance', () => {
    test('Returns set of attendances for 3 students attending 1 course', () => {
        // Given a course with UUID
        const course = { uuid: '3e52b880-6526-4a27-9b9c-8396d124e65d' }

        // And 3 students
        const attendee1 = new Member({
            uuid: '2e4070ee-eb57-4280-94cd-4aabb98257bd',
            remainingTrialSessions: 0,
            courses: [course],
        })
        const attendee2 = new Member({
            uuid: 'ef18ee60-4bbc-4e09-bc7f-8822fc8ed91c',
            remainingTrialSessions: 0,
            courses: [course],
        })
        const attendee3 = new Member({
            uuid: '563eebea-a982-4595-a9dd-e3e7a4a9287b',
            remainingTrialSessions: 0,
            courses: [course],
        })

        // And the server holds 1 attendance for each student for that course
        mockHttp.onPost('/attendance/query').reply(200, [
            {
                'student_uuid': attendee1.uuid,
                'course_uuid': course.uuid,
                'date': '2023-07-17',
                'resolution': null,
                'id': 904
            },
            {
                'student_uuid': attendee2.uuid,
                'course_uuid': course.uuid,
                'date': '2023-07-13',
                'resolution': 'paid',
                'id': 894
            },
            {
                'student_uuid': attendee3.uuid,
                'course_uuid': course.uuid,
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
                id: 904,
                session: {
                    date: new Date('2023-07-17'),
                    courses: [course],
                },
                attendee: attendee1,
                resolution: null,
            },
            {
                id: 894,
                session: {
                    date: new Date('2023-07-13'),
                    courses: [course],
                },
                attendee: attendee2,
                resolution: 'paid',
            },
            {
                id: 895,
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
