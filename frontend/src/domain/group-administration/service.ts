import Cookies from 'universal-cookie'
import { http, withInterceptors } from '../../utils/http'
import { Club } from './models'

const API_URL = import.meta.env.VITE_LEGACY_API_URL
const api = withInterceptors(http.create({ baseURL: API_URL }), new Cookies())

export function getClubs(): Promise<Club[]> {
    return api.get('/clubs').then(({ data }) => data)
}
