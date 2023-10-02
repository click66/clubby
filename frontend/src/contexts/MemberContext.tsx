import { Dispatch, ReactNode, SetStateAction, createContext } from 'react'
import useMember from '../hooks/member'
import { Member } from '../domain/members/types'

export const MemberContext = createContext<[Member | undefined, Dispatch<SetStateAction<Member | undefined>>]>([undefined, () => { }])

export function MemberProvider({ children }: { children: ReactNode }) {
    const member = useMember()

    return (
        <MemberContext.Provider value={member}>
            {children}
        </MemberContext.Provider>
    )
}
