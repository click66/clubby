import { toast } from "react-toastify";

export function notifySuccess(msg: string) {
    return toast.success(msg)
}

export function notifyError(msg: string) {
    return toast.error(msg + '')
}
