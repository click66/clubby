import http from "../utils/http"

type Member = {
    uuid: string
}

type Payment = {
    datetime: Date
    courseUuid: string
    used: boolean
    memberUuid: string
}

type DtoMemberPayment = {
    datetime: string
    courseUuid: string
    used: boolean
}

const API_URL = import.meta.env.VITE_LEGACY_API_URL

export function fetchPaymentsByMember(member: Member): Promise<Payment[]> {
    return http.post(`${API_URL}/payments/query`, {
        memberUuid: member.uuid,
    }).then((data) => data.map((d: DtoMemberPayment) => {
        return { ...d, datetime: new Date(d.datetime), memberUuid: member.uuid }
    }))
}

export function addPayment(payment: Payment) {
    return http.post(`${API_URL}/members/${payment.memberUuid}/payments/add`, {
        ...payment,
        product: payment.courseUuid,
    })
}
