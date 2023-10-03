import { toast } from "react-toastify";

export function notifySuccess(msg: string) {
    return toast.success(msg)
}

export function notifyError(e: string) {
    return toast.error(e + '')
}
