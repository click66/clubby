import { toast } from "react-toastify"
import { AuthenticationError } from '../errors'

export function notifySuccess(msg: string) {
    return toast.success(msg)
}

export function notifyError(e: Error | string) {
    if (e instanceof AuthenticationError) {
        window.location.href = '/auth/login'
    }

    if (e instanceof Error) {
        e = e.message
    }
    return toast.error(e + '')
}
