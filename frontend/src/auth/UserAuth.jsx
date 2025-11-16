import axios from '../config/axios'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const UserAuth = ({ children }) => {

    const { user, setUser } = useContext(UserContext)
    const [ loading, setLoading ] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                navigate('/login')
                setLoading(false)
                return
            }

            // If user is not set, try to fetch profile
            if (!user) {
                try {
                    const res = await axios.get('/users/profile')
                    setUser(res.data.user)
                } catch (error) {
                    console.error('Auth check failed:', error)
                    localStorage.removeItem('token')
                    navigate('/login')
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [token, user, navigate, setUser])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!token || !user) {
        return null
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserAuth