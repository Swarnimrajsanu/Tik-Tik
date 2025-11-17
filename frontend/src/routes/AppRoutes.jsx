import { BrowserRouter, Route, Routes } from 'react-router-dom'
import UserAuth from '../auth/UserAuth'
import CodePlayground from '../components/CodePlayground'
import Home from '../screens/Home'
import Login from '../screens/login.jsx'
import Project from '../screens/project.jsx'
import Register from '../screens/register.jsx'

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/" element={<UserAuth><Home/></UserAuth>} />
          <Route path="/project" element={<UserAuth><Project/></UserAuth>} />
          <Route path="/playground" element={<UserAuth><CodePlayground/></UserAuth>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default AppRoutes
