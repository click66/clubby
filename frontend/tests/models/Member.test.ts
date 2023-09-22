import { DomainError } from "../../src/errors"
import { Member } from "../../src/models/Member"

describe('Member model', () => {
    test('Has active trial if no licence but remaining trial sessions', () => {
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 1,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })
        expect(sut.activeTrial).toBeTruthy()
    })

    test('Trial not active if no licence and no remaining trial sessions', () => {
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })
        expect(sut.activeTrial()).toBeFalsy()
    })

    test('Trial not active if no licence and negative remaining trial sessions', () => {
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: -3,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })
        expect(sut.activeTrial()).toBeFalsy()
    })

    test('Licence expired if licence and expiry date is before now', () => {
        // Given today is April 15th
        const today = new Date(2012, 3, 15)

        // And a member's licence expired on the 12th
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: {
                    idNumber: 1234,
                    expires: new Date(2012, 3, 12)
                }
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })

        // Then the licence is expired
        expect(sut.expired(today)).toBeTruthy()
    })

    test('Licence not expired if licence and expiry date are same day', () => {
        // Given today is April 15th
        const today = new Date(2012, 3, 15)

        // And a member's licence expired on the 15th
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: {
                    idNumber: 1234,
                    expires: new Date(2012, 3, 15)
                }
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })

        // Then the licence is expired
        expect(sut.expired(today)).toBeFalsy()
    })

    test('Attending a session decreases remaining trial sessions', () => {
        // Given a member has 2 remaining trial sessions
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 2,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })

        // When that member attends a session
        sut.attend({ date: new Date() })

        // Then the member now has 1 remaining trial session
        expect(sut.remainingTrialSessions).toBe(1)
    })

    test('UNattending a session INcreases remaining trial sessions', () => {
        // Given a member has 1 remaining trial session
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 1,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' }
        })

        // When that member unattends a session
        sut.unattend({ date: new Date() })

        // Then the member now has 2 remaining trial sessions
        expect(sut.remainingTrialSessions).toBe(2)
    })

    test('Cannot attend session if no licence and no remaining trial sesson', () => {
        // Given a member has no remaining trial sessions and is unlicenced
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: null,
            },
            origin: { joinDate: new Date(), addedBy: 'John' },
        })

        // Then an error will be thrown
        expect(() => {
            // When that member tries to attend a session
            sut.attend({ date: new Date() })
        }).toThrowError(DomainError)
    })

    test('Cannot attend session with an expired licence', () => {
        // Given a member licence is expired
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: {
                    idNumber: 12345,
                    expires: new Date('2020-02-02')
                },
            },
            origin: { joinDate: new Date(), addedBy: 'John' },
        })

        // Then an error will be thrown
        expect(() => {
            // When that member tries to attend a session
            sut.attend({ date: new Date() })
        }).toThrowError(DomainError)
    })

    test('If payment is passed to attending, that payment is removed from unused payments', () => {
        // Given a member has two unused payments for one course
        const sut = new Member({
            name: 'Joe Bloggs',
            membership: {
                remainingTrialSessions: 0,
                licence: {
                    idNumber: 12345,
                    expires: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                },
            },
            origin: { joinDate: new Date(), addedBy: 'John' },
            unusedPayments: [
                { courseUuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' },
                { courseUuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' }
            ],
        })

        // When a member attends and pays for a session
        sut.attend({ date: new Date(), payment: { courseUuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' } })

        // Then that member has only 1 remaining unused payment
        expect(sut.unusedPayments.length).toBe(1)

        // And the member still has a usable payment
        expect(sut.hasUsablePaymentForCourse({ uuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' })).toBeTruthy()

        // But when the member repeats
        sut.attend({ date: new Date(), payment: { courseUuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' } })

        // Then the member no longer has a usable payment
        expect(sut.hasUsablePaymentForCourse({ uuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' })).toBeFalsy()

        // And attempting further attendance will throw a DomainError
        expect(() => {
            sut.attend({ date: new Date(), payment: { courseUuid: '2cb87084-adf0-4cd9-a67d-34e9f45e46a2' } })
        }).toThrowError(DomainError)
    })

    test('Can tell if member is in course', () => {
        // Given a course that a member is in
        const course = { uuid: '20cfcac8-d2c8-437e-a770-d4902207d780' }
        const member = new Member({
            name: 'Joe Bloggs',
            origin: { joinDate: new Date(), addedBy: 'John' },
            course_uuids: ['20cfcac8-d2c8-437e-a770-d4902207d780'],
            membership: { remainingTrialSessions: 0, licence: null }
        })

        // When I check if a member is in that course
        const result = member.isInCourse(course)

        // Then the result is true
        expect(result).toBeTruthy()
    })

    test('Can tell if member is not in course', () => {
        // Given a course that a member is not in
        const course = { uuid: '30cfcac8-e2c8-537e-b770-e4902207d780' }
        const member = new Member({
            name: 'Joe Bloggs',
            origin: { joinDate: new Date(), addedBy: 'John' },
            course_uuids: ['20cfcac8-d2c8-437e-a770-d4902207d780'],
            membership: { remainingTrialSessions: 0, licence: null }
        })

        // When I check if a member is in that course
        const result = member.isInCourse(course)

        // Then the result is false
        expect(result).toBeFalsy()
    })
})
