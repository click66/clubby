import { toast } from "react-toastify";

export function notifySuccess(msg: string) {
    return toast.success(msg)
}

export function notifyError(e: Error|string) {
    if (e instanceof Error) {
        e = e.message
    }
    return toast.error(e + '')
}
