import { BrowserRouter, Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div>login</div>} />
          <Route path="/register" element={<div>register</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default AppRoutes
