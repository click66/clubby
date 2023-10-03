import * as members from './members'
import tokens from '../../utils/tokens'
import { createApiInstance } from '../../utils/http'
import { V1MemberFactory } from '../MemberFactory'

const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
const http = createApiInstance(LEGACY_API_URL, tokens)
const factory = new V1MemberFactory()

export const membersApi = {
    getMember: members.getMember(http, factory),
    getMembers: members.getMembers(http, factory),
    getMembersByCourses: members.getMembersByCourses(http, factory),
    createMember: members.createMember(http, factory),
    signUpForCourse: members.signUpForCourse(http),
    removeFromCourse: members.removeFromCourse(http),
    updateProfile: members.updateProfile(http),
    deactivate: members.deactivate(http),
    activate: members.activate(http),
    permanentlyDelete: members.permanentlyDelete(http),
    addLicence: members.addLicence(http),
}
