import { http, withInterceptors } from '../utils/http'
import { Member } from '../models/Member'
import Cookies from 'universal-cookie'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), new Cookies())

export type DtoMember = {
    uuid: string
    name: string
    dob: string | null
    phone: string | null
    email: string | null
    address: string | null
    courses: string[]
    has_notes: boolean
    membership: string
    rem_trial_sessions: number
    signed_up_for: string[]
    licence: {
        no: number,
        exp_time: string,
        exp: boolean,
    } | null
    added_by: string
    member_since: string
    unused_payments: [{ course_uuid: string }]
    active?: boolean
}

export type DtoNewMember = {
    name: string
}

export type DtoCourse = {
    uuid?: string
}

export type DtoMemberProfile = {
    name: string
    dob: string | null
    phone: string
    email: string
    address: string
}

export type DtoMemberLicence = {
    licenceNo: number
    expiryDate: Date
}

const member = (dto: DtoMember): Member => {
    return new Member({
        uuid: dto.uuid,
        name: dto.name,
        course_uuids: dto.signed_up_for,
        membership: {
            remainingTrialSessions: dto.rem_trial_sessions,
            licence: dto.membership == 'licenced' && dto.licence ? {
                idNumber: dto.licence.no,
                expires: new Date(dto.licence.exp_time.split('/').reverse().join('/')),
            } : null
        },
        origin: {
            addedBy: dto.added_by,
            joinDate: new Date(dto.member_since.split('/').reverse().join('/')),
        },
        unusedPayments: dto.unused_payments.map((d) => { return { courseUuid: d.course_uuid } }),
        profile: {
            dateOfBirth: dto.dob ? new Date(dto.dob) : null,
            phone: dto.phone ?? '',
            email: dto.email ?? '',
            address: dto.address ?? '',
        },
        active: dto.active ?? true,
    })
}

export function addMember(m: DtoNewMember, c?: DtoCourse): Promise<Member> {
    return api.post('/members/add', {
        ...{
            studentName: m.name,
        },
        ...(c ? { product: c.uuid } : {}),
    })
        .then(({ data }) => member(data))
}

export function addMemberLicence(uuid: string, licence: DtoMemberLicence): Promise<void> {
    return api.post(`/members/${uuid}/licences/add`, {
        number: licence.licenceNo,
        expire_date: licence.expiryDate.toISOString().split('T')[0],
    })
}

export function updateMemberProfile(uuid: string, profile: DtoMemberProfile): Promise<void> {
    return api.post(`/members/${uuid}/profile`, profile)
}

export function fetchMemberByUuid(uuid: string): Promise<Member> {
    return api.get(`/members/${uuid}`).then(({ data }) => member(data))
}

export function fetchMembers(): Promise<Member[]> {
    return api.get('/members')
        .then(({ data }) => data.map(member))
}

export function fetchMembersByCourses(courses: DtoCourse[]): Promise<Member[]> {
    return api.post('/members/query', {
        'courses': courses.map((c) => c.uuid),
    })
        .then(({ data }) => data.map((d: any) => { return { ...d, course_uuids: d['signed_up_for'] } }))
        .then((data) => data.map(member))
}

export function deleteMember(member: Member): Promise<void> {
    return api.post('/members/delete/' + member.uuid)
}

export function addMemberToCourse(member: Member, course: DtoCourse): Promise<void> {
    return api.post(`/members/${member.uuid}/courses/add`, course)
}

export function removeMemberFromCourse(member: Member, course: DtoCourse): Promise<void> {
    return api.post(`/members/${member.uuid}/courses/remove`, course)
}

export function activateMember(member: Member) {
    member.activate()
    return api.post(`/members/${member.uuid}/activate`)
}

export function deactivateMember(member: Member) {
    member.deactivate()
    return api.post(`/members/${member.uuid}/deactivate`)
}
