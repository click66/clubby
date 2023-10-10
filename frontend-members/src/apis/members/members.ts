import { z } from 'zod'
import { Http } from '../../http'

export interface MemberQuery {
    user: string,
}

const memberSchema = z.object({
    uuid: z.string().uuid(),
    name: z.string(),
    phone: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    address: z.string().nullable(),
    licence: z.object({
        number: z.number(),
        expiryDate: z.coerce.date(),
    }).nullable(),
    remainingTrialSessions: z.number(),
})

export type Member = z.infer<typeof memberSchema>

type TokenProvider = {
    getAuthorisationToken(): string
}

export function getMembers(http: Http, tokenProvider: TokenProvider) {
    return (query: MemberQuery): Promise<Member[]> => {
        return http.post('/members/query', query, { headers: { 'Authorization': `Bearer ${tokenProvider.getAuthorisationToken()}` } })
        .then(({ data }) => data.map((d: any) => memberSchema.parse(d)))}
}
