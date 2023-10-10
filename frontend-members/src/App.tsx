import { CalendarDaysIcon, ClockIcon, RectangleGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { BrowserRouter, NavLink as Link, LinkProps, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Calendar from './pages/Calendar'
import History from './pages/History'
import { useContext, useState } from 'react'
import { UserContext, UserContextProvider } from './contexts/UserContext'
import { Activate, Login, Logout, Register } from './pages/Auth'
import { authentication, tokens } from './authentication'
import Spinner from './components/Spinner'

function PortalLink({ to, children, ...restProps }: LinkProps) {
  const baseClasses = 'flex flex-col items-center text-decoration-none hover:bg-accent p-2'
  const activeClasses = 'font-bold'
  const pendingClasses = 'pending'

  const combinedClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
    isPending ? `${pendingClasses} ${baseClasses}` : isActive ? `${activeClasses} ${baseClasses}` : baseClasses

  return (
    <Link to={to} {...restProps} className={combinedClasses}>
      {children}
    </Link>
  )
}

function LoginGuard() {
  const [user, setUser] = useContext(UserContext)
  const [pending, setPending] = useState<boolean>(false)

  if (!user && !pending) {
    if (tokens.exist()) {
      setPending(true)
      authentication.attemptRefresh()
        .then(setUser)
        .finally(() => { setPending(false) })
    }
  }

  if (pending) {
    return <Spinner />
  }

  if (user) {
    return <Outlet />
  }

  return <Navigate to="/auth/login" />
}

function UserDetails() {
  const [user, _] = useContext(UserContext)

  return user ? (
    <div className="flex items-center">
      <span className="mr-2 text-gray-700">{user.name}</span>
      <img src="user-avatar.jpg" alt="User Avatar" className="w-8 h-8 rounded-full" />
      <Link to="/auth/logout">Logout</Link>
    </div>
  ) : ''
}

function Navigation() {
  const [user, _] = useContext(UserContext)

  return user ? (
    <div className="flex justify-center mt-3">
      <div className="w-3/4 md:w-1/2">
        <div className="mb-5 justify-center items-center">
          <ul id="accountLinks" className="text-primary flex list-none p-0">
            <li className="flex-1 text-center p-4">
              <PortalLink to="/dashboard">
                <RectangleGroupIcon className="h-5 w-5 mb-1" />
                Dashboard
              </PortalLink>
            </li>
            <li className="flex-1 text-center p-4">
              <PortalLink to="/profile">
                <UserIcon className="h-5 w-5 mb-1" />
                Profiles
              </PortalLink>
            </li>
            <li className="flex-1 text-center p-4">
              <PortalLink to="calendar">
                <CalendarDaysIcon className="h-5 w-5 mb-1" />
                Calendar
              </PortalLink>
            </li>
            <li className="flex-1 text-center p-4">
              <PortalLink to="history">
                <ClockIcon className="h-5 w-5 mb-1" />
                History
              </PortalLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ) : ''
}

function AuthRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="activate/:uuid" element={<Activate />} />
      <Route path="logout" element={<Logout />} />
    </Routes>
  )
}

function App() {
  const appTitle = 'Southampton Jiu Jitsu'

  return (
    <UserContextProvider>
      <BrowserRouter>
        <div className="flex flex-col">
          <div className="flex-shrink-0 h-16 border-b border-gray-300 p-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center"><h1 className="text-primary text-2xl font-bold">
                <Link to="/">{appTitle}</Link>
                </h1></div>
              <UserDetails />
            </div>
          </div>
          <div className="container mx-auto mt-8 mb-20">
            <Navigation />
            <div className="container mx-auto w-1/2 flex flex-col items-center space-y-5">
              <Routes>
                <Route path="/" element={<LoginGuard />}>
                  <Route index path="dashboard" element={<Dashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="history" element={<History />} />
                </Route>
                <Route path="/auth/*" element={<AuthRoutes />} />
              </Routes>
            </div>
          </div>
          <div className="flex fixed bottom-0 w-full h-8 bg-background border-gray-300 border-t text-sm items-center justify-center">Powered by Clubby</div>
        </div>
      </BrowserRouter>
    </UserContextProvider>
  )
}

export default App
