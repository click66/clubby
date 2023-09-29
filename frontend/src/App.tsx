import 'react-toastify/dist/ReactToastify.css'
import './App.scss'

import _404 from './pages/404'
import Login from './pages/auth/login'
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom'
import Portal from './pages/Portal'
import Courses from './pages/Courses'
import Members from './pages/Members'
import Attendance from './pages/Attendance'
import Reporting from './pages/Reporting'
import Breadcrumb from './components/Breadcrumb'
import Cookies from 'universal-cookie'
import { Button } from 'react-bootstrap'
import { Flip, ToastContainer } from 'react-toastify'
import MemberProfile from './pages/member/MemberProfile'
import Payments from './pages/member/MemberPayments'
import MemberNotes from './pages/member/MemberNotes'
import MemberLicence from './pages/member/MemberLicence'
import { MemberProvider } from './contexts/MemberContext'
import { useState } from 'react'
import LoginGuard from './components/LoginGuard'
import User from './pages/User'
import Admin from './pages/Admin'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  const PortalLayout = () => (
    <div className="copyHome">
      <div id="topLogo">South Coast Jiu Jitsu</div>
      <Outlet />
    </div>
  )

  const StandardLayout = ({ bcParent = null }: { bcParent?: { path: string, text: string } | null }) => (
    <div className="p-3 containerInner">
      <Breadcrumb parent={bcParent} />
      <Outlet />
    </div>
  )

  const LoggedInLayout = () => {
    const navigate = useNavigate()
    const cookies = new Cookies()
    return (
      <LoginGuard loggedIn={loggedIn} setLoggedIn={setLoggedIn}>
        <div className="topBar">
          <Button variant="light" onClick={() => {
            cookies.remove('jwt_authorisation', { path: '/' })
            cookies.remove('jwt_refreshtoken', { path: '/' })
            setLoggedIn(false)
            navigate('/auth/login')
          }}>Sign Out</Button>
        </div>
        <Outlet />
      </LoginGuard>
    )
  }

  return (
    <BrowserRouter>
      <div className="main bg-dark">
        <div className="container-fluid">
          <Routes>
            <Route element={<PortalLayout />}>
              <Route path="*" element={<_404 />} />
              <Route path="/auth/login" element={<Login loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
              <Route element={<LoggedInLayout />}>
                <Route path="/" element={<Portal />} />
              </Route>
            </Route>
            <Route element={<LoggedInLayout />}>
              <Route element={<StandardLayout />}>
                <Route path="/courses" element={<Courses />} />
                <Route path="/members" element={<Members />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/attendance/:courseUuid" element={<Attendance />} />
                <Route path="/reporting" element={<Reporting />} />
                <Route path="/user" element={<User />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route element={<StandardLayout bcParent={{ 'path': '/members', 'text': 'Members' }} />}>
                <Route element={<MemberProvider children={<Outlet />} />}>
                  <Route path="/members/:memberUuid/profile" element={<MemberProfile />} />
                  <Route path="/members/:memberUuid/licence" element={<MemberLicence />} />
                  <Route path="/members/:memberUuid/notes" element={<MemberNotes />} />
                  <Route path="/members/:memberUuid/payments" element={<Payments />} />
                </Route>
              </Route>
            </Route>
          </Routes>
          <ToastContainer
            theme="colored"
            transition={Flip}
          />
        </div>
      </div>
    </BrowserRouter >
  )
}

export default App
