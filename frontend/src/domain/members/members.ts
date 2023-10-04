import { HttpInstance } from '../../utils/http'
import { Course, Licence, Member, MemberFactory, NewMember, Profile } from './types'

const isoDate = (date: Date) => date.toISOString().split('T')[0]

export function getMember(http: HttpInstance, factory: MemberFactory) {
    return (uuid: string) => http.get(`/members/${uuid}`).then(({ data }) => factory.makeMember(data))
}

export function getMembers(http: HttpInstance, factory: MemberFactory) {
    return () => http.get('/members').then(({ data }) => data.map((d: any) => factory.makeMember(d)))
}

export function getMembersByCourses(http: HttpInstance, factory: MemberFactory) {
    return ({ courses }: { courses: Course[] }): Promise<Member[]> => http.post(
        '/members/query',
        { courses },
    ).then(({ data }) => data.map((d: any) => factory.makeMember(d)))
}

export function createMember(http: HttpInstance, factory: MemberFactory) {
    return ({ name, course = null }: NewMember): Promise<Member> => http.post('/members/add', {
        studentName: name,
        product: course?.uuid,
    }).then(({ data }) => factory.makeMember(data))
}

export function signUpForCourse(http: HttpInstance) {
    return ({ member, course }: { member: Member, course: Course }) => http.post(
        `/members/${member.uuid}/courses/add`,
        course,
    ).then(() => member.withCourse(course))
}

export function removeFromCourse(http: HttpInstance) {
    return ({ member, course }: { member: Member, course: Course }) => http.post(
        `/members/${member.uuid}/courses/remove`,
        course,
    ).then(() => member.withoutCourse(course))
}

export function updateProfile(http: HttpInstance) {
    return ({ member, profile }: { member: Member, profile: Profile }) => http.post(
        `/members/${member.uuid}/profile`,
        { ...profile, dob: isoDate(profile.dateOfBirth) },
    ).then(() => member.withProfile(profile))
}

export function deactivate(http: HttpInstance) {
    return ({ member }: { member: Member }) => http.post(`/members/${member.uuid}/deactivate`)
        .then(() => member.withActive(false))
}

export function activate(http: HttpInstance) {
    return ({ member }: { member: Member }) => http.post(`/members/${member.uuid}/activate`)
        .then(() => member.withActive(true))
}

export function permanentlyDelete(http: HttpInstance) {
    return ({ member }: { member: Member }) => http.post(`/members/delete/${member.uuid}`)
}

export function addLicence(http: HttpInstance) {
    return ({ member, licence }: { member: Member, licence: Licence }) => http.post(
        `/members/${member.uuid}/licences/add`,
        { ...licence, expiryDate: isoDate(licence.expiryDate) },
    ).then(() => member.withLicence(licence))
}
