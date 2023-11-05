import MockAdapter from 'axios-mock-adapter'
import { HttpInstance, withInterceptors } from '../../src/utils/http'

const tokens = new class {
    getAuthorisationToken() {
        return 'foo'
    }
    getRefreshToken() {
        return 'bar'
    }
    exist() {
        return true
    }
    setToken(_: any) { }
    clear() { }
}

export default (http: HttpInstance) => new MockAdapter(withInterceptors(http, tokens))
