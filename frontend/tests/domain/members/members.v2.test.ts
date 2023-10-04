import { http } from '../../../src/utils/http'
import { Member } from '../../../src/domain/Member'
import {
    getMember,
    getMembersByCourses,
} from '../../../src/domain/members/members'
import { V2MemberFactory } from '../../../src/domain/MemberFactory'
import makeMockHttp from '../mock-http'
import { ConnectivityError, DomainObjectCreationError } from '../../../src/errors'

const mockHttp = makeMockHttp(http)

describe('members module', () => {
    const memberFactory = new V2MemberFactory()

    afterEach(() => {
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
                'unusedPayments': [{ 'course': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
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

            mockHttp.onGet(`/members/${uuid}`).reply(500, { error: 'Internal Server Error' })

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
            return expect(getMember(http, memberFactory)(uuid)).rejects.toThrowError(ConnectivityError)
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
                'unusedPayments': [{ 'course': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
            },
            {
                'uuid': 'a4037611-14eb-4506-a6a7-11409923f683',
                'active': true,
                'name': 'Harry Solomon',
                'dateOfBirth': null,
                'address': null,
                'phone': null,
                'email': null,
                'rem_trial_sessions': 2,
                'courses': [{ 'uuid': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
                'joinDate': '2023-10-03',
                'addedBy': 'member2@gmail.com',
                'unusedPayments': [{ 'course': '618b38f6-98bd-404b-b273-81ddbe84c429' }],
            }]

            mockHttp.onPost('/members/query', { courses }).reply(200, responseData)

            return expect(getMembersByCourses(http, memberFactory)({ courses })).resolves.toStrictEqual([expect.any(Member), expect.any(Member)])
        })
    })
})
