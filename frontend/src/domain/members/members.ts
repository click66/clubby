import { DomainError } from '../../errors'
import { HttpInstance } from '../../utils/http'
import { Course, Licence, Member, MemberFactory, NewMember, Payment, Profile, Subscription } from './types'

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

export function getMembersLikeName(http: HttpInstance, factory: MemberFactory) {
    return ({ searchString } : { searchString: string }): Promise<Member[]> => http.post(
        '/members/query',
        { name: searchString },
    ).then(({ data }) => data.map((d: any) => factory.makeMember(d)))
}

export function createMember(http: HttpInstance, factory: MemberFactory) {
    return (data: NewMember): Promise<Member> => http.post('/members/create', data)
        .then(({ data }) => factory.makeMember(data))
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
        { ...profile, dob: profile.dateOfBirth ? isoDate(profile.dateOfBirth) : null },
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
    return ({ member }: { member: Member }) => http.post(`/members/${member.uuid}/delete`)
}

export function addLicence(http: HttpInstance) {
    return ({ member, licence }: { member: Member, licence: Licence }) => http.post(
        `/members/${member.uuid}/licences/add`,
        { ...licence, expiryDate: isoDate(licence.expiryDate) },
    ).then(() => member.withLicence(licence))
}

export function getPayments(http: HttpInstance) {
    return (member: Member): Promise<Payment[]> => http.get(`/members/${member.uuid}/payments`)
        .then(({ data }) => data.map((d: any) => ({ ...d, datetime: new Date(d.datetime) })))
}

export function addPayment(http: HttpInstance) {
    return (member: Member, course: Course): Promise<Member> => http.post(`/members/${member.uuid}/payments/add`, { course })
        .then(({ data }) => member.withUnusedPayment({ ...data, datetime: new Date(data.datetime) }))
}

export function getSubscriptions(http: HttpInstance) {
    return (member: Member): Promise<Payment[]> => http.get(`/members/${member.uuid}/subscriptions`)
        .then(({ data }) => data.map((d: any) => ({ ...d, expiryDate: new Date(d.expiryDate) })))
}

export function addSubscription(http: HttpInstance) {
    return ({ member, subscription }: { member: Member, subscription: Subscription }): Promise<Member> => {
        if (member.hasSubscriptionForCourse(subscription.course)) {
            return Promise.reject(new DomainError('Member is already subscribed to this course. Cancel the existing subscription if you want to make a new one.'))
        }

        return http.post(
            `/members/${member.uuid}/subscriptions/add`,
            { ...subscription, expiryDate: isoDate(subscription.expiryDate) },
        ).then(({ data }) => member.withSubscription({ ...data, expiryDate: new Date(data.expiryDate) }))
    }
}

export function cancelSubscription(http: HttpInstance) {
    return ({ member, course }: { member: Member, course: Course }): Promise<Member> => http.post(
        `/members/${member.uuid}/subscriptions/cancel`,
        { course },
    ).then(() => member.withoutCourseSubscription(course))
}
