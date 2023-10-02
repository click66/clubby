import { IMember } from '../Member'

export interface Profile {
    name: string
    email: string
    phone: string
    dateOfBirth: Date
    address: string
}

export interface Licence {
    number: number
    expiryDate: Date
}

export interface Course {
    uuid: string,
}

export interface Member extends IMember {
    withCourse(course: Course): Member
    withoutCourse(course: Course): Member
    withProfile(profile: Profile): Member
    withActive(status: boolean): Member
    withLicence(licence: Licence): Member
}

export interface MemberFactory {
    makeMember(data: any): Member
}

export interface NewMember {
    readonly name: string
    readonly course?: Course | null
}
