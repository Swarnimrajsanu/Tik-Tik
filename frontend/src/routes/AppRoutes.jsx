import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '../screens/Home'
import Login from '../screens/login.jsx'
import Register from '../screens/register.jsx'

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default AppRoutes
