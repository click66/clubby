import 'react-toastify/dist/ReactToastify.css';
import './App.scss'

import _404 from './pages/404';
import Login from './pages/auth/login'
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import Portal from './pages/Portal'
import Courses from './pages/Courses'
import Members from './pages/Members'
import Attendance from './pages/Attendance'
import Reporting from './pages/Reporting'
import Breadcrumb from './components/Breadcrumb'
import Cookies from 'universal-cookie';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Flip, ToastContainer } from 'react-toastify';
import MemberProfile from './pages/member/MemberProfile';
import MemberPayments from './pages/member/MemberPayments';
import MemberNotes from './pages/member/MemberNotes';
import MemberLicence from './pages/member/MemberLicence';
import { MemberProvider } from './contexts/MemberContext';

function App() {
  const PortalLayout = () => (
    <div className="copyHome">
      <div id="topLogo">South Coast Jiu Jitsu</div>
      <Outlet />
    </div>
  )

  const StandardLayout = () => (
    <div className="p-3 containerInner">
      <Breadcrumb />
      <Outlet />
    </div>
  )

  const LoginGuard = () => {
    const cookies = new Cookies()
    const navigate = useNavigate()
    const token = cookies.get('jwt_authorisation')

    if (!token) {
      return <Navigate to="/auth/login" />
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return <><div className="topBar"><Button variant="light" onClick={() => {
      cookies.remove('jwt_authorisation')
      navigate('/auth/login')
    }}>Sign Out</Button></div><Outlet /></>
  }

  return (
    <BrowserRouter>
      <div className="main bg-dark">
        <div className="container-fluid">
          <Routes>
            <Route element={<PortalLayout />}>
              <Route path="*" element={<_404 />} />
              <Route path="/auth/login" element={<Login />} />
              <Route element={<LoginGuard />}>
                <Route path="/" element={<Portal />} />
              </Route>
            </Route>
            <Route element={<LoginGuard />}>
              <Route element={<StandardLayout />}>
                <Route path="/courses" element={<Courses />} />
                <Route path="/members" element={<Members />} />
                <Route element={<MemberProvider children={<Outlet />} />}>
                  <Route path="/members/:memberUuid/profile" element={<MemberProfile />} />
                  <Route path="/members/:memberUuid/licence" element={<MemberLicence />} />
                  <Route path="/members/:memberUuid/notes" element={<MemberNotes />} />
                  <Route path="/members/:memberUuid/payments" element={<MemberPayments />} />
                </Route>
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/attendance/:course_uuid" element={<Attendance />} />
                <Route path="/reporting" element={<Reporting />} />
              </Route>
            </Route>
          </Routes>
          <ToastContainer
            theme="colored"
            transition={Flip}
          />
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
