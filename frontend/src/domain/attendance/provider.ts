import * as attendance from './attendance'
import { tokens } from '../../utils/tokens'
import { createApiInstance } from '../../utils/http'
import { authentication } from '../authentication/authentication'

const ATTENDANCE_API_URL = import.meta.env.VITE_API_URL
const http = createApiInstance(ATTENDANCE_API_URL, tokens, authentication.attemptRefresh)

export const attendanceApi = {
    attendSession: attendance.attendSession(http),
    unattendSession: attendance.unattendSession(http),
    getAttendance: attendance.getAttendance(http),
}
