import MockAdapter from 'axios-mock-adapter'
import { HttpInstance, withInterceptors } from '../../src/utils/http'

const tokens = new class {
    get(_: string) {
        return 'foo'
    }
}

export default (http: HttpInstance) => new MockAdapter(withInterceptors(http, tokens))
