import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '../screens/Home'
import Login from '../screens/login'
import Register from '../screens/register'

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
