import { tokens } from '../../authentication'
import { createHttp } from '../../http'
import { getMembers } from './members'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const http = createHttp(API_URL)

export const members = {
    getMembers: getMembers(http, tokens)
}
