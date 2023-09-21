import { Dispatch, ReactNode, SetStateAction, createContext } from "react";
import useMember from "../hooks/member";
import { PersistedMember } from "../models/Member";

export const MemberContext = createContext<[PersistedMember | undefined, Dispatch<SetStateAction<PersistedMember | undefined>>]>([undefined, () => { }])

export function MemberProvider({ children }: { children: ReactNode }) {
    const member = useMember()

    return (
        <MemberContext.Provider value={member}>
            {children}
        </MemberContext.Provider>
    )
}