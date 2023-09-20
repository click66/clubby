import axios, { AxiosResponse } from "axios"


function successOrError(r: AxiosResponse) {
    let data = r.data;
    if (data.hasOwnProperty('error')) {
        return Promise.reject(new Error(data.error))
    }

    return data.success ?? data
}

class Http {
    post(url: string, data?: any): Promise<any> {
        return axios.post(url, data).then(successOrError)
    }

    get(url: string): Promise<any> {
        return axios.get(url).then(successOrError)
    }
}

function createInstance() {
    const instance = new Http();
    return instance;
}

const http = createInstance();
export default http
