import * as courses from './courses'
import tokens from '../../utils/tokens'
import { createApiInstance } from '../../utils/http'
import { Course } from './types'
import { authentication } from '../authentication/authentication'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const http = createApiInstance(API_URL, tokens, authentication.attemptRefresh)

const cache = new Map<string, Course>()

export default {
    addCourse: courses.addCourse(http, cache),
    getCourse: courses.getCourse(http, cache),
    getCourses: courses.getCourses(http, cache),
    courseHappensOnDay: courses.courseHappensOnDay,
    courseHappensOnDate: courses.courseHappensOnDate,
    deleteCourse: courses.deleteCourse(http, cache),
}
