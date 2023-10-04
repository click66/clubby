import * as members from './members'
import tokens from '../../utils/tokens'
import { createApiInstance } from '../../utils/http'
import { V1MemberFactory, V2MemberFactory } from '../MemberFactory'

const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
const http = createApiInstance(LEGACY_API_URL, tokens)
const v1Factory = new V1MemberFactory()
const v2Factory = new V2MemberFactory()

export const membersApi = {
    getMember: members.getMember(http, v2Factory),
    getMembersByCourses: members.getMembersByCourses(http, v2Factory),

    getMembers: members.getMembers(http, v1Factory),
    createMember: members.createMember(http, v1Factory),
    signUpForCourse: members.signUpForCourse(http),
    removeFromCourse: members.removeFromCourse(http),
    updateProfile: members.updateProfile(http),
    deactivate: members.deactivate(http),
    activate: members.activate(http),
    permanentlyDelete: members.permanentlyDelete(http),
    addLicence: members.addLicence(http),
}
