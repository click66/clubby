import { http } from '../../../src/utils/http'
import { Member } from '../../../src/domain/Member'
import {
    addPayment,
    addSubscription,
    cancelSubscription,
    createMember,
    getMember,
    getMembersByCourses,
    getPayments,
} from '../../../src/domain/members/members'
import { V2MemberFactory } from '../../../src/domain/MemberFactory'
import makeMockHttp from '../mock-http'
import { ConnectivityError, DomainError, DomainObjectCreationError } from '../../../src/errors'
import { NewMember } from '../../../src/domain/members/types'

const mockHttp = makeMockHttp(http)

describe('members module', () => {
    const memberFactory = new V2MemberFactory(new Date())

    afterEach(() => {
        jest.clearAllMocks()
        mockHttp.reset()
    })

    describe('getMember', () => {
        test('retrieves a member by UUID successfully', async () => {
            const uuid = 'some-uuid'
            const responseData = {
                'uuid': '327bde34-e413-40a2-8c84-fece6469ad04',
                'active': true,
                'name': 'Joe Bob',
                'dateOfBirth': null,
                'address': null,
                'phone': null,
                'email': null,
                'remainingTrialSessions': 2,
                'courses': [{ 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
                'joinDate': '2023-10-03',
                'addedBy': 'click66@gmail.com',
                'unusedPayments': [{ 'course': { 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }, 'datetime': '2023-10-18T16:18:05.277614Z', 'used': false }],
            }

            mockHttp.onGet(`/members/${uuid}`).reply(200, responseData)

            return getMember(http, memberFactory)(uuid).then((result) => {
                expect(result).toBeInstanceOf(Member)
                expect(result.uuid).toStrictEqual('327bde34-e413-40a2-8c84-fece6469ad04')
                expect(result.name).toStrictEqual('Joe Bob')
                expect(result.active).toBeTruthy()
                expect(result.remainingTrialSessions).toStrictEqual(2)
                expect(result.isInCourse({ uuid: '618b38f6-98bd-404b-b273-81ddbe84c429' })).toBeTruthy()
                expect(result.hasUsablePaymentForCourse({ uuid: '618b38f6-98bd-404b-b273-81ddbe84c429' })).toBeTruthy()
                expect(result.hasUsablePaymentForCourse({ uuid: '557f7295-b12a-471c-b865-a5ad5b71f46f' })).toBeFalsy()
            })
        })

        test('handles server error during member retrieval', async () => {
            const uuid = 'some-uuid'

            mockHttp.onGet(`/members/${uuid}`).reply(500)

            return expect(getMember(http, memberFactory)(uuid)).rejects.toThrowError(ConnectivityError)
        })

        test('handles network error during member retrieval', async () => {
            const uuid = 'some-uuid'

            mockHttp.onGet(`/members/${uuid}`).networkError()

            return expect(getMember(http, memberFactory)(uuid)).rejects.toThrowError(ConnectivityError)
        })

        test('handles a non-existent member', async () => {
            const uuid = 'non-existent-uuid'

            mockHttp.onGet(`/members/${uuid}`).reply(404, { error: 'Member not found' })

            // API currently 500s - this should be updated
            return expect(getMember(http, memberFactory)(uuid)).rejects.toThrowError(DomainError)
        })

        test('handles invalid response format', async () => {
            const uuid = 'some-uuid'

            mockHttp.onGet(`/members/${uuid}`).reply(200, { invalidData: 'invalid' })

            return expect(getMember(http, memberFactory)(uuid)).rejects.toThrowError(DomainObjectCreationError)
        })
    })

    describe('getMembersByCourses', () => {
        test('retrieves members by courses', () => {
            const courses = [{ uuid: '618b38f6-98bd-404b-b273-81ddbe84c429' }]
            const responseData = [{
                'uuid': '327bde34-e413-40a2-8c84-fece6469ad04',
                'active': true,
                'name': 'Dick Solomon',
                'dateOfBirth': null,
                'address': null,
                'phone': null,
                'email': null,
                'remainingTrialSessions': 2,
                'courses': [{ 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
                'joinDate': '2023-10-03',
                'addedBy': 'member1@gmail.com',
                'unusedPayments': [{ 'course': { 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }, 'datetime': '2023-10-18T16:18:05.277614Z', 'used': false }],
            },
            {
                'uuid': 'a4037611-14eb-4506-a6a7-11409923f683',
                'active': true,
                'name': 'Harry Solomon',
                'dateOfBirth': null,
                'address': null,
                'phone': null,
                'email': null,
                'remainingTrialSessions': 2,
                'courses': [{ 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
                'joinDate': '2023-10-03',
                'addedBy': 'member2@gmail.com',
                'unusedPayments': [{ 'course': { 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }, 'datetime': '2023-10-18T16:18:05.277614Z', 'used': false }],
            }]

            mockHttp.onPost('/members/query', { courses }).reply(200, responseData)

            return expect(getMembersByCourses(http, memberFactory)({ courses })).resolves.toStrictEqual([expect.any(Member), expect.any(Member)])
        })
    })

    describe('createMember', () => {
        test('creates a new member', () => {
            const newMember: NewMember = { name: 'John Doe', course: { uuid: '618b38f6-98bd-404b-b273-81ddbe84c429' } }
            const responseData = {
                'uuid': 'a4037611-14eb-4506-a6a7-11409923f683',
                'active': true,
                'name': 'John Doe',
                'dateOfBirth': null,
                'address': null,
                'phone': null,
                'email': null,
                'remainingTrialSessions': 2,
                'courses': [{ 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
                'joinDate': '2023-10-03',
                'addedBy': 'member@gmail.com',
                'unusedPayments': [],
            }

            mockHttp.onPost('/members/create', newMember).reply(200, responseData)

            return createMember(http, memberFactory)(newMember).then((result) => {
                expect(result.isInCourse({ uuid: '618b38f6-98bd-404b-b273-81ddbe84c429' })).toBeTruthy()
            })
        })
    })

    describe('getPayments', () => {
        test('reads the payments against the member', () => {
            const member = new Member({
                uuid: '618b38f6-98bd-404b-b273-81ddbe84c429',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: new Date('1991-01-05'),
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
            })

            const responseData = [
                {
                    'course': {
                        'uuid': 'e5e1349d-540c-4f99-b9c2-f225fcf33388',
                        'label': 'Adult Jitsu'
                    },
                    'datetime': '2023-10-02T13:59:03.940926Z',
                    'used': true,
                },
                {
                    'course': {
                        'uuid': 'e5e1349d-540c-4f99-b9c2-f225fcf33388',
                        'label': 'Adult Jitsu'
                    },
                    'datetime': '2023-10-06T13:59:03.940926Z',
                    'used': false,
                }
            ]

            mockHttp.onGet(`/members/${member.uuid}/payments`).reply(200, responseData)

            return expect(getPayments(http)(member)).resolves.toStrictEqual([
                {
                    course: { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388', label: 'Adult Jitsu' },
                    datetime: new Date('2023-10-02T13:59:03.940926Z'),
                    used: true,
                },
                {
                    course: { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388', label: 'Adult Jitsu' },
                    datetime: new Date('2023-10-06T13:59:03.940926Z'),
                    used: false,
                }
            ])
        })
    })

    describe('addPayment', () => {
        test('makes request to add payment', () => {
            const member = new Member({
                uuid: '618b38f6-98bd-404b-b273-81ddbe84c429',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: new Date('1991-01-05'),
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
            })
            const course = { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388' }

            mockHttp.onPost(`/members/${member.uuid}/payments/add`).reply(200, {
                course,
                datetime: new Date(),
                used: false,
            })

            const spy = jest.spyOn(http, 'post')
            return addPayment(http)(member, course).then(() => {
                expect(spy).toHaveBeenCalledWith(`/members/${member.uuid}/payments/add`, { course })
            })
        })
    })

    describe('addSubscription', () => {
        test('adds a new subscription', () => {
            const course = { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388' }
            const member = new Member({
                uuid: '618b38f6-98bd-404b-b273-81ddbe84c429',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: new Date('1991-01-05'),
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
                subscriptions: [],
            })

            expect(member.hasSubscriptionForCourse(course, new Date('2023-01-01'))).toBeFalsy()

            mockHttp.onPost(
                `/members/${member.uuid}/subscriptions/add`,
                { course, type: 'time', expiryDate: '2023-02-01' },
            ).reply(200, { course, type: 'time', expiryDate: '2023-02-01' })

            const spy = jest.spyOn(http, 'post')
            return addSubscription(http)({ member, subscription: { course, type: 'time', expiryDate: new Date('2023-02-01') } }).then((result) => {
                expect(spy).toHaveBeenCalledTimes(1)
                expect(result.hasSubscriptionForCourse(course, new Date('2023-01-01'))).toBeTruthy()
            })
        })

        test('if has existing subscription but it is expired, can add a new one', () => {
            const today = new Date('2022-01-01')
            const course = { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388' }

            // Given member has an existing subscription to this course, but it is expired
            const uuid = 'b5442d50-1b43-4549-9ef9-836daf251dc0'
            mockHttp.onGet(`/members/${uuid}`).reply(200, {
                uuid,
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: '1991-01-05',
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
                subscriptions: [{ course, type: 'time', expiryDate: '1970-01-01' }],
                unusedPayments: [],
                addedBy: 'click66@gmail.com',
                joinDate: '2020-01-01',
            })
            return getMember(http, new V2MemberFactory(today))(uuid).then((member) => {
                expect(member.uuid).toBe(uuid)

                // And a subscription could be created
                mockHttp.onPost(
                    `/members/${member.uuid}/subscriptions/add`,
                    { course, type: 'time', expiryDate: '2023-02-01' },
                ).reply(200, { course, type: 'time', expiryDate: '2023-02-01' })

                // When a subscription is created
                const spy = jest.spyOn(http, 'post')
                return addSubscription(http)({ member, subscription: { course, type: 'time', expiryDate: new Date('2023-02-01') } }).then((result) => {
                    // Then the subscription is persisted
                    expect(spy).toHaveBeenCalledTimes(1)

                    // And the member has a subscription for a course, for a date prior to the expiration date
                    expect(result.hasSubscriptionForCourse(course, new Date('2023-01-01'))).toBeTruthy()
                })
            })
        })

        test('cannot add subscription if already has one to that course', () => {
            // Given a member has an existing subscription to the course
            const course = { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388' }
            const member = new Member({
                uuid: '618b38f6-98bd-404b-b273-81ddbe84c429',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: new Date('1991-01-05'),
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
                subscriptions: [{ course, type: 'time', expiryDate: new Date('2028-01-01') }],
            })

            // When we try and create another subscription
            const spy = jest.spyOn(http, 'post')
            return expect(addSubscription(http)({ member, subscription: { course, type: 'time', expiryDate: new Date('2024-01-01') } })).rejects.toThrowError(DomainError).finally(() => {
                // Then no subscription is persisted
                expect(spy).toHaveBeenCalledTimes(0)
            })
        })
    })

    describe('cancelSubscription', () => {
        test('removes subscription from member', () => {
            const course = { uuid: 'e5e1349d-540c-4f99-b9c2-f225fcf33388' }
            const member = new Member({
                uuid: '618b38f6-98bd-404b-b273-81ddbe84c429',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                dateOfBirth: new Date('1991-01-05'),
                phone: '555-0123',
                address: '123 Fake St',
                active: true,
                remainingTrialSessions: 2,
                courses: [],
                subscriptions: [{ course, type: 'time', expiryDate: new Date('2028-01-01') }],
            })
            expect(member.hasSubscriptionForCourse(course, new Date('2023-01-01'))).toBeTruthy()

            mockHttp.onPost(`/members/${member.uuid}/subscriptions/cancel`, { course }).reply(204)

            const spy = jest.spyOn(http, 'post')
            return cancelSubscription(http)({ member, course }).then((newMember) => {
                expect(spy).toHaveBeenCalledWith(`/members/${member.uuid}/subscriptions/cancel`, { course })

                expect(newMember.uuid === member.uuid)
                expect(newMember.hasSubscriptionForCourse(course, new Date('2023-01-01'))).toBeFalsy()
            })
        })
    })
})
