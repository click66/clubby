import { useContext } from 'react'
import { UserContext } from '../contexts/UserContext'

export default function Dashboard() {
    const [user, _] = useContext(UserContext)
    return (
        <>
            <p>Welcome back, {user?.name}!</p>
            <h2>You have 1 upcoming Booking</h2>
            <ul>
                <li><span className="font-bold">Adult Jiu Jitsu</span> - Southampton Jiu Jitsu Club</li>
            </ul>
            <h2>You have 3 notifications</h2>
            <ul>
                <li><span className="font-bold">Meryl Seinfeld</span>'s licence is due to be renewed.</li>
            </ul>
        </>
    )
}
