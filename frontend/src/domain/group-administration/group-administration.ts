import { http, withInterceptors } from '../../utils/http'
import { Club } from './types'
import { authentication } from '../authentication/authentication'
import tokens from '../../utils/tokens'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), tokens, true, authentication.attemptRefresh)

export function getClubs(): Promise<Club[]> {
    return api.get('/clubs').then(({ data }) => data)
}
