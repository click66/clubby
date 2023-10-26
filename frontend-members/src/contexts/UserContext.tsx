import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from 'react'
import { User } from '../authentication'

export const UserContext = createContext<[User | null, Dispatch<SetStateAction<User | null>>]>([null, () => { }])

interface Props {
    children: ReactNode
}

export const UserContextProvider: FC<Props> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)

    return (
        <UserContext.Provider value={[user, setUser]}>
            {children}
        </UserContext.Provider>
    )
}
