import MockAdapter from 'axios-mock-adapter'
import { createHttp } from '../src/http'
import { getMembers } from '../src/apis/members/members'
import { ZodError } from 'zod'

const http = createHttp('')
const mockHttp = new MockAdapter(http)

const tokens = {
    getAuthorisationToken() {
        return 'foobar'
    }
}

describe('Members', () => {
    afterEach(() => {
        mockHttp.reset()
    })

    describe('getUserMembers', () => {
        test('can retrieve members for the current user', () => {
            const userUuid = '7b25f33a-3998-4a37-87a2-834ef8c0bab3'

            const responseData = [
                {
                    'uuid': '33123bcf-97ce-49d7-add4-fcae62e31b7d',
                    'name': 'Jerry Seinfeld',
                    'licence': {
                        'number': 8383,
                        'expiryDate': '2024-01-01',
                    },
                    'phone': '555-8383',
                    'clubName': 'Chikara Dojo',
                    'dateOfBirth': '1963-02-02',
                    'address': '129 West 81st',
                    'remainingTrialSessions': 2,
                },
                {
                    'uuid': '2e580ead-a4ac-4d6b-adce-eee4da2951ac',
                    'name': 'George Costanza',
                    'licence': {
                        'number': 9191,
                        'expiryDate': '2019-01-01',
                    },
                    'phone': '555-6820',
                    'clubName': 'Chikara Dojo',
                    'dateOfBirth': '1963-02-02',
                    'address': '129 West 81st',
                    'remainingTrialSessions': 0,
                },
            ]

            mockHttp.onPost('/members/query', { user: userUuid }).reply(200, responseData)

            return getMembers(http, tokens)({ user: userUuid }).then((result) => {
                expect(result.length).toBe(2)

                expect(result[0].name).toBe('Jerry Seinfeld')

                expect(result[1].name).toBe('George Costanza')
            })
        })

        test('members can be unlicenced', () => {
            const userUuid = '7b25f33a-3998-4a37-87a2-834ef8c0bab3'

            const responseData = [
                {
                    'uuid': '33123bcf-97ce-49d7-add4-fcae62e31b7d',
                    'name': 'Cosmo Kramer',
                    'licence': null,
                    'phone': '555-6820',
                    'clubName': 'Chikara Dojo',
                    'dateOfBirth': '1963-02-02',
                    'address': '129 West 81st',
                    'remainingTrialSessions': 84,
                },
            ]

            mockHttp.onPost('/members/query', { user: userUuid }).reply(200, responseData)

            return getMembers(http, tokens)({ user: userUuid }).then((result) => {
                expect(result.length).toBe(1)
                expect(result[0].licence).toBe(null)
            })
        })

        test('handles unexpected schema', () => {
            const userUuid = '7b25f33a-3998-4a37-87a2-834ef8c0bab3'

            const responseData = [
                {
                    'malformed': 'schema',
                }
            ]

            mockHttp.onPost('/members/query', { user: userUuid }).reply(200, responseData)

            return expect(getMembers(http, tokens)({ user: userUuid })).rejects.toThrowError(ZodError)
        })
    })
})
